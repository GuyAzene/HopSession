import { createClient, type AuthFunctions, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins/magic-link';

import { components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';
import { safeDashboardPlugin } from './authDashboard';
import { authIsReady, getAuthTrustedOrigins, normalizeAuthEmail, requireEnv } from './authEnvironment';

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
    authFunctions,
    triggers: {
        user: {
            onCreate: async (ctx, user) => {
                const authEmail = normalizeAuthEmail(user.email);
                const existing = await ctx.db.query('users')
                    .withIndex('by_auth_email', (q) => q.eq('authEmail', authEmail))
                    .unique();
                // Legacy identities must be imported, never claimed by matching email at signup.
                if (existing) throw new Error('An application user already owns this email');
                await ctx.db.insert('users', {
                    betterAuthId: user._id,
                    authEmail,
                    email: user.email,
                    name: user.name,
                    image: user.image ?? undefined,
                    emailVerificationTime: user.emailVerified ? Date.now() : undefined,
                });
            },
        },
    },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export function createAuth(ctx: GenericCtx<DataModel>) {
    const siteUrl = requireEnv('SITE_URL');
    const dashboardApiKey = process.env.BETTER_AUTH_API_KEY;
    const backgroundTasks: Promise<unknown>[] = [];
    let drainedTasks = 0;
    const flushBackgroundTasks = async () => {
        while (drainedTasks < backgroundTasks.length) {
            const batch = backgroundTasks.slice(drainedTasks);
            drainedTasks = backgroundTasks.length;
            await Promise.allSettled(batch);
        }
    };
    const auth = betterAuth({
        appName: 'HopSession',
        baseURL: requireEnv('CONVEX_SITE_URL'),
        secret: requireEnv('BETTER_AUTH_SECRET'),
        trustedOrigins: getAuthTrustedOrigins(),
        onAPIError: {
            errorURL: new URL('/login', siteUrl).toString(),
        },
        database: authComponent.adapter(ctx),
        socialProviders: {
            google: {
                clientId: requireEnv('AUTH_GOOGLE_ID'),
                clientSecret: requireEnv('AUTH_GOOGLE_SECRET'),
            },
        },
        account: {
            accountLinking: { enabled: true, allowDifferentEmails: false },
        },
        rateLimit: { enabled: true, storage: 'database' },
        advanced: dashboardApiKey ? {
            backgroundTasks: {
                handler: (task) => {
                    backgroundTasks.push(task.catch(() => {
                        console.warn('Better Auth dashboard background task failed');
                    }));
                },
            },
        } : undefined,
        hooks: {
            before: createAuthMiddleware(async (request) => {
                if (!authIsReady() && request.path !== '/convex/jwks') {
                    throw new APIError('SERVICE_UNAVAILABLE', {
                        message: 'ההתחברות בתחזוקה זמנית. נסו שוב בעוד כמה דקות.',
                    });
                }
            }),
        },
        plugins: [
            ...(dashboardApiKey ? [safeDashboardPlugin(dashboardApiKey, flushBackgroundTasks)] : []),
            magicLink({
                expiresIn: 15 * 60,
                storeToken: 'hashed',
                sendMagicLink: async ({ email, url }) => {
                    const response = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${requireEnv('AUTH_RESEND_KEY')}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: 'HopSession 🍻 <auth@hopsession.cc>',
                            to: email,
                            subject: 'קישור התחברות ל-HopSession',
                            text: `להתחברות ל-HopSession לחצו על הקישור:\n${url}\n\nהקישור תקף ל-15 דקות. אם לא ביקשתם להתחבר, אפשר להתעלם מההודעה.`,
                        }),
                    });
                    if (!response.ok) {
                        throw new APIError('INTERNAL_SERVER_ERROR', {
                            message: 'שליחת קישור ההתחברות נכשלה. נסו שוב.',
                        });
                    }
                },
            }),
            crossDomain({ siteUrl }),
            convex({ authConfig }),
        ],
    });

    if (!dashboardApiKey) return auth;

    return {
        ...auth,
        handler: async (...args: Parameters<typeof auth.handler>) => {
            try {
                return await auth.handler(...args);
            } finally {
                // Convex stops outstanding work when the HTTP action returns.
                await flushBackgroundTasks();
            }
        },
    };
}
