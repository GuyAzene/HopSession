import { ConvexError } from 'convex/values';

import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { internalQuery, type ActionCtx, type MutationCtx, type QueryCtx } from './_generated/server';
import { authComponent } from './auth';
import { authIsReady } from './authEnvironment';

async function resolveUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'> | null> {
    if (!authIsReady()) return null;
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return null;
    const user = await ctx.db.query('users')
        .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', authUser._id))
        .unique();
    if (!user) throw new ConvexError('לא ניתן לטעון את החשבון. פנו לתמיכה.');
    return user;
}

export const current = internalQuery({ args: {}, handler: resolveUser });

export async function getAppUser(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<Doc<'users'> | null> {
    return 'db' in ctx ? resolveUser(ctx) : ctx.runQuery(internal.authUser.current, {});
}

export async function getAppUserId(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<Id<'users'> | null> {
    return (await getAppUser(ctx))?._id ?? null;
}
