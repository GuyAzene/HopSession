import {mutation, query} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v, ConvexError } from "convex/values";

export const current = query({
    args: {},
    handler: async (ctx) => {
        // 1. שולפים את ה-ID של המשתמש בעזרת הספריה החדשה
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return null;
        }

        // 2. שולפים את המסמך *האמיתי* של המשתמש ממסד הנתונים!
        return await ctx.db.get(userId);
    },
});

export const updateProfile = mutation({
    args: {
        name: v.string(),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new ConvexError("חובה להתחבר");

        await ctx.db.patch(userId, {
            name: args.name,
            phone: args.phone,
        });
    },
});
