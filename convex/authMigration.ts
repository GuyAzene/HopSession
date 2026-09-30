import { paginationOptsValidator, type FunctionArgs, type PaginationResult } from 'convex/server';
import { v } from 'convex/values';

import { components, internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { internalAction, internalMutation, internalQuery, type ActionCtx, type MutationCtx } from './_generated/server';
import { authIsReady, normalizeAuthEmail } from './authEnvironment';

type LegacyAccount = Pick<Doc<'authAccounts'>,
    '_id' | 'userId' | 'provider' | 'providerAccountId' | 'emailVerified'>;
interface Inventory {
    users: number;
    linkedUsers: number;
    googleAccounts: number;
    linkedGoogleAccounts: number;
    issues: string[];
}
interface AuthUser {
    _id: string;
    email: string;
    emailVerified: boolean;
}
interface AuthAccount {
    _id: string;
    userId: string;
}
type IdentityWhere = NonNullable<FunctionArgs<typeof components.betterAuth.adapter.findMany>['where']>;

async function findIdentityMatches<T>(ctx: ActionCtx | MutationCtx, model: 'user' | 'account', where: IdentityWhere): Promise<T[]> {
    const matches: T[] = [];
    let cursor: string | null = null;
    do {
        const result: PaginationResult<T> = await ctx.runQuery(components.betterAuth.adapter.findMany, {
            model, where, paginationOpts: { cursor, numItems: 2 - matches.length },
        });
        matches.push(...result.page);
        if (result.isDone || matches.length >= 2) return matches;
        if (result.continueCursor === cursor) throw new Error('Identity lookup pagination did not advance');
        cursor = result.continueCursor;
    } while (cursor);
    throw new Error('Identity lookup pagination ended before completion');
}

function emailIdentityWhere(email: string): IdentityWhere {
    // Exact range bounds bypass the adapter's unique-field shortcut and enumerate
    // imported duplicates without changing the email_name index ordering.
    return [
        { field: 'email', operator: 'gte', value: email },
        { field: 'email', operator: 'lte', value: email },
    ];
}

function requireMaintenance() {
    if (authIsReady()) throw new Error('Set AUTH_MIGRATION_COMPLETE=false before importing accounts');
}

export const usersPage = internalQuery({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => ctx.db.query('users').paginate(args.paginationOpts),
});

export const accountsPage = internalQuery({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const result = await ctx.db.query('authAccounts').paginate(args.paginationOpts);
        return {
            ...result,
            page: result.page.map(({ _id, userId, provider, providerAccountId, emailVerified }) =>
                ({ _id, userId, provider, providerAccountId, emailVerified })),
        };
    },
});

// This inventory is read-only. It reports IDs, never credentials or provider tokens.
export const inventory = internalAction({
    args: {},
    handler: async (ctx): Promise<Inventory> => {
        const users: Doc<'users'>[] = [];
        const accounts: LegacyAccount[] = [];
        let cursor: string | null = null;
        do {
            const result: PaginationResult<Doc<'users'>> = await ctx.runQuery(internal.authMigration.usersPage, {
                paginationOpts: { cursor, numItems: 100 },
            });
            users.push(...result.page);
            cursor = result.isDone ? null : result.continueCursor;
        } while (cursor);
        do {
            const result: PaginationResult<LegacyAccount> = await ctx.runQuery(internal.authMigration.accountsPage, {
                paginationOpts: { cursor, numItems: 100 },
            });
            accounts.push(...result.page);
            cursor = result.isDone ? null : result.continueCursor;
        } while (cursor);

        const issues: string[] = [];
        const byId = new Map(users.map((user) => [user._id, user]));
        const byEmail = new Map<string, string>();
        const byAuthId = new Map<string, string>();
        const byProvider = new Map<string, string>();
        const accountOwners = new Set(accounts.map((account) => account.userId));
        let linkedGoogleAccounts = 0;

        for (const user of users) {
            const email = normalizeAuthEmail(user.email ?? '');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                issues.push(`User ${user._id}: missing or invalid email`);
            }
            if (user.isAnonymous) issues.push(`User ${user._id}: anonymous identity requires manual resolution`);
            const duplicate = byEmail.get(email);
            if (duplicate) issues.push(`Users ${duplicate} and ${user._id}: duplicate normalized email`);
            byEmail.set(email, user._id);
            if (!user.betterAuthId && !accountOwners.has(user._id)) {
                issues.push(`User ${user._id}: no legacy provider identity`);
            }
            const emailMatches = email ? await findIdentityMatches<AuthUser>(ctx, 'user', emailIdentityWhere(email)) : [];
            if (emailMatches.length > 1) issues.push(`User ${user._id}: duplicate Better Auth email identity`);
            if (user.betterAuthId) {
                const duplicateId = byAuthId.get(user.betterAuthId);
                if (duplicateId) issues.push(`Users ${duplicateId} and ${user._id}: duplicate Better Auth mapping`);
                byAuthId.set(user.betterAuthId, user._id);
                const target: AuthUser | null = await ctx.runQuery(components.betterAuth.adapter.findOne, {
                    model: 'user', where: [{ field: '_id', value: user.betterAuthId }],
                });
                if (!target || target.email !== email || user.authEmail !== email ||
                    emailMatches.length !== 1 || emailMatches[0]._id !== user.betterAuthId) {
                    issues.push(`User ${user._id}: missing or inconsistent Better Auth mapping`);
                }
            } else if (emailMatches.length) {
                issues.push(`User ${user._id}: email already belongs to an unmapped Better Auth user`);
            }
        }
        for (const account of accounts) {
            const owner = byId.get(account.userId);
            if (!owner) issues.push(`Account ${account._id}: missing application user`);
            if (!['google', 'resend'].includes(account.provider)) {
                issues.push(`Account ${account._id}: unsupported provider ${account.provider}`);
            }
            if (!account.providerAccountId.trim()) issues.push(`Account ${account._id}: empty provider identity`);
            const key = JSON.stringify([account.provider, account.providerAccountId]);
            const duplicate = byProvider.get(key);
            if (duplicate) issues.push(`Accounts ${duplicate} and ${account._id}: duplicate provider identity`);
            byProvider.set(key, account._id);
            if (account.provider === 'resend' && owner &&
                normalizeAuthEmail(account.providerAccountId) !== normalizeAuthEmail(owner.email ?? '')) {
                issues.push(`Account ${account._id}: email alias requires manual resolution`);
            }
            if (account.provider === 'google') {
                const matches = await findIdentityMatches<AuthAccount>(ctx, 'account', [
                    { field: 'providerId', value: 'google' },
                    { field: 'accountId', value: account.providerAccountId },
                ]);
                if (matches.length > 1) {
                    issues.push(`Account ${account._id}: duplicate Better Auth Google identity`);
                } else if (matches.length === 1 && matches[0].userId !== owner?.betterAuthId) {
                    issues.push(`Account ${account._id}: Google identity belongs to a different Better Auth user`);
                } else if (matches.length === 1) {
                    linkedGoogleAccounts++;
                }
            }
        }
        return {
            users: users.length,
            linkedUsers: users.filter((user) => user.betterAuthId).length,
            googleAccounts: accounts.filter((account) => account.provider === 'google').length,
            linkedGoogleAccounts,
            issues,
        };
    },
});

// Each page is atomic, including component writes. Deliberately omit user-create
// triggers: imported identities attach to the existing application documents.
export const importPage = internalMutation({
    args: { cursor: v.union(v.string(), v.null()) },
    handler: async (ctx, args) => {
        requireMaintenance();
        const result = await ctx.db.query('users').paginate({ cursor: args.cursor, numItems: 25 });
        let createdUsers = 0;
        let createdAccounts = 0;
        for (const user of result.page) {
            const email = normalizeAuthEmail(user.email ?? '');
            if (!email) throw new Error(`User ${user._id} has no email; run inventory`);
            const accounts = await ctx.db.query('authAccounts')
                .withIndex('userIdAndProvider', (q) => q.eq('userId', user._id)).collect();
            const now = Date.now();
            let authId = user.betterAuthId;
            const emailMatches = await findIdentityMatches<AuthUser>(ctx, 'user', emailIdentityWhere(email));
            if (emailMatches.length > 1) throw new Error(`User ${user._id}: duplicate Better Auth email identity`);
            if (authId) {
                const target: AuthUser | null = await ctx.runQuery(components.betterAuth.adapter.findOne, {
                    model: 'user', where: [{ field: '_id', value: authId }],
                });
                if (!target || target.email !== email || user.authEmail !== email ||
                    emailMatches.length !== 1 || emailMatches[0]._id !== authId) {
                    throw new Error(`User ${user._id}: missing or inconsistent Better Auth mapping`);
                }
            } else if (emailMatches.length) {
                throw new Error(`User ${user._id}: email already belongs to an unmapped Better Auth user`);
            }
            if (!authId) {
                const target: AuthUser = await ctx.runMutation(components.betterAuth.adapter.create, {
                    input: {
                        model: 'user',
                        data: {
                            email,
                            emailVerified: user.emailVerificationTime !== undefined || accounts.some((account) =>
                                account.emailVerified !== undefined && normalizeAuthEmail(account.emailVerified) === email),
                            name: user.name ?? email.split('@')[0],
                            image: user.image,
                            createdAt: user._creationTime,
                            updatedAt: now,
                        },
                    },
                });
                authId = target._id;
                await ctx.db.patch(user._id, { betterAuthId: authId, authEmail: email });
                createdUsers++;
            }
            for (const account of accounts.filter((entry) => entry.provider === 'google')) {
                const matches = await findIdentityMatches<AuthAccount>(ctx, 'account', [
                    { field: 'providerId', value: 'google' },
                    { field: 'accountId', value: account.providerAccountId },
                ]);
                if (matches.length > 1) throw new Error(`Account ${account._id}: duplicate Better Auth Google identity`);
                if (matches.length === 1) {
                    if (matches[0].userId !== authId) throw new Error(`Account ${account._id}: conflicting Google identity`);
                    continue;
                }
                await ctx.runMutation(components.betterAuth.adapter.create, {
                    input: {
                        model: 'account',
                        data: {
                            providerId: 'google', accountId: account.providerAccountId,
                            userId: authId, createdAt: account._creationTime, updatedAt: now,
                        },
                    },
                });
                createdAccounts++;
            }
        }
        return { cursor: result.isDone ? null : result.continueCursor, isDone: result.isDone, createdUsers, createdAccounts };
    },
});

export const migratePage = internalAction({
    args: { cursor: v.optional(v.union(v.string(), v.null())) },
    handler: async (ctx, args): Promise<{
        cursor: string | null; isDone: boolean; createdUsers: number; createdAccounts: number;
    }> => {
        requireMaintenance();
        const report = await ctx.runAction(internal.authMigration.inventory, {});
        if (report.issues.length) throw new Error(`Migration blocked: ${report.issues.join('; ')}`);
        return ctx.runMutation(internal.authMigration.importPage, { cursor: args.cursor ?? null });
    },
});
