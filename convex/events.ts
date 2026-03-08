import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuth } from "./helpers";

const MAX_EVENTS_PER_FEED = 50;
const MAX_EVENT_NAME_LENGTH = 80;
const EVENT_PAST_TOLERANCE_MS = 24 * 60 * 60 * 1000;
const EVENT_FUTURE_LIMIT_MS = 10 * 365 * 24 * 60 * 60 * 1000;

// 1. מוטציית היצירה המעודכנת
export const create = mutation({
    args: {
        name: v.string(),
        date: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const eventName = args.name.trim();

        if (!eventName) {
            throw new ConvexError('חובה להזין שם למפגש.');
        }

        if (eventName.length > MAX_EVENT_NAME_LENGTH) {
            throw new ConvexError('שם המפגש ארוך מדי. עד 80 תווים.');
        }

        const now = Date.now();
        if (!Number.isFinite(args.date)) {
            throw new ConvexError('תאריך המפגש לא תקין.');
        }

        if (args.date < now - EVENT_PAST_TOLERANCE_MS || args.date > now + EVENT_FUTURE_LIMIT_MS) {
            throw new ConvexError('תאריך המפגש לא בטווח תקין.');
        }

        // שומרים את האירוע (בלי מערך participants)
        const eventId = await ctx.db.insert("events", {
            name: eventName,
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
            .order("desc")
            .take(MAX_EVENTS_PER_FEED);

        // שלב ב': הולכים לטבלת events ומביאים את המידע האמיתי עבור כל מפגש
        const events = await Promise.all(
            participations.map((p) => ctx.db.get(p.eventId))
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
