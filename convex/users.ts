import {mutation, query} from "./_generated/server";
import { getAppUser, getAppUserId } from './authUser';
import { v, ConvexError } from "convex/values";

export const current = query({
    args: {},
    handler: async (ctx) => {
        return await getAppUser(ctx);
    },
});

export const updateProfile = mutation({
    args: {
        name: v.string(),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAppUserId(ctx);
        if (userId === null) throw new ConvexError("חובה להתחבר");

        await ctx.db.patch(userId, {
            name: args.name.trim(),
            phone: args.phone,
        });
    },
});
