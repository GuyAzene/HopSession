import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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