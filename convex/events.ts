import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuth } from "./helpers";

// 1. מוטציית היצירה המעודכנת
export const create = mutation({
    args: {
        name: v.string(),
        date: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);

        // שומרים את האירוע (בלי מערך participants)
        const eventId = await ctx.db.insert("events", {
            name: args.name,
            date: args.date,
            ownerId: userId,
            isSettled: false,
        });

        // שומרים את ההשתתפות בטבלת הגישור
        await ctx.db.insert("eventParticipants", {
            eventId: eventId,
            userId: userId,
        });

        return eventId;
    },
});

// 2. השאילתה החדשה לעמוד הראשי!
export const getMyEvents = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) return [];

        // שלב א': שולפים את כל מסמכי ההשתתפות של המשתמש (סופר מהיר בזכות האינדקס)
        const participations = await ctx.db
            .query("eventParticipants")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // שלב ב': הולכים לטבלת events ומביאים את המידע האמיתי עבור כל מפגש
        const events = await Promise.all(
            participations.map(async (p) => {
                return await ctx.db.get(p.eventId);
            })
        );

        // Type predicate tells TypeScript the filtered array is non-null,
        // eliminating the need for ! assertions on the frontend
        return events
            .filter((e): e is NonNullable<typeof e> => e !== null)
            .sort((a, b) => b.date - a.date);
    },
});

export const getEvent = query({
    args: {
        eventId: v.id("events"),
    },
    handler: async (ctx, args) => {
        // 1. אימות משתמש
        const userId = await requireAuth(ctx);

        // 2. שליפת האירוע — throw if not found so ErrorBoundary can show message
        const event = await ctx.db.get(args.eventId);
        if (!event) {
            throw new ConvexError("האירוע לא נמצא");
        }

        // 3. בדיקת הרשאות מול טבלת המשתתפים באמצעות האינדקס המורכב
        const isParticipant = await ctx.db
            .query("eventParticipants")
            .withIndex("by_event_and_user", (q) =>
                q.eq("eventId", args.eventId).eq("userId", userId)
            )
            .first();

        // אם המשתמש לא מופיע בטבלת המשתתפים (וגם לא הבעלים, ליתר ביטחון)
        if (!isParticipant && event.ownerId !== userId) {
            throw new ConvexError("אין לך הרשאה לגשת לסשן הזה");
        }

        return event;
    }
});
