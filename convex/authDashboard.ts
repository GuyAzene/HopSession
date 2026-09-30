import { runWithEndpointContext } from '@better-auth/core/context';
import { dash } from '@better-auth/infra';
import type { BetterAuthPlugin, GenericEndpointContext } from 'better-auth';

export function safeDashboardPlugin(apiKey: string, flushBackgroundTasks: () => Promise<void>) {
    const original = dash({
        apiKey,
        activityTracking: { enabled: false },
        managedDirectorySync: { enabled: false },
    });
    const publicOptions = Object.fromEntries(
        Object.entries(original.options).filter(([key]) => key !== 'apiKey' && key !== 'apiKeys'),
    );

    function scopeAfter<Record>(
        after: (record: Record, context: GenericEndpointContext | null) => Promise<void>,
    ) {
        return async (record: Record, context: GenericEndpointContext | null): Promise<void> => {
            if (!context) return after(record, context);
            await runWithEndpointContext(context, async () => {
                try {
                    await after(record, context);
                } finally {
                    await flushBackgroundTasks();
                }
            });
        };
    }

    return {
        ...original,
        options: publicOptions,
        init(ctx: Parameters<typeof original.init>[0]) {
            const result = original.init(ctx);
            const hooks = result.options.databaseHooks;
            return {
                ...result,
                options: {
                    ...result.options,
                    // Better Auth invokes these hooks after the endpoint's async context ends.
                    databaseHooks: {
                        user: {
                            ...hooks.user,
                            create: { ...hooks.user.create, after: scopeAfter(hooks.user.create.after) },
                            update: { ...hooks.user.update, after: scopeAfter(hooks.user.update.after) },
                            delete: { ...hooks.user.delete, after: scopeAfter(hooks.user.delete.after) },
                        },
                        session: {
                            ...hooks.session,
                            create: { ...hooks.session.create, after: scopeAfter(hooks.session.create.after) },
                            delete: { ...hooks.session.delete, after: scopeAfter(hooks.session.delete.after) },
                        },
                        account: {
                            ...hooks.account,
                            create: { ...hooks.account.create, after: scopeAfter(hooks.account.create.after) },
                            update: { ...hooks.account.update, after: scopeAfter(hooks.account.update.after) },
                            delete: { ...hooks.account.delete, after: scopeAfter(hooks.account.delete.after) },
                        },
                        verification: {
                            ...hooks.verification,
                            create: { ...hooks.verification.create, after: scopeAfter(hooks.verification.create.after) },
                            delete: { ...hooks.verification.delete, after: scopeAfter(hooks.verification.delete.after) },
                        },
                    },
                },
            };
        },
    } satisfies BetterAuthPlugin;
}
