import { createClient, type AuthFunctions, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins/magic-link';

import { components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';
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
    return betterAuth({
        baseURL: requireEnv('CONVEX_SITE_URL'),
        secret: requireEnv('BETTER_AUTH_SECRET'),
        trustedOrigins: getAuthTrustedOrigins(),
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
}
