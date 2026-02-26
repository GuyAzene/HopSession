import { query } from "./_generated/server";

export const current = query({
    args: {},
    handler: async (ctx) => {
        // שליפת המשתמש המחובר לפי ההנחיות המעודכנות של Convex
        const user = await ctx.auth.getUserIdentity();

        if (user === null) {
            return null;
        }

        return user;
    },
});