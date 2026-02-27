import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// 1. מוטציית היצירה המעודכנת
export const create = mutation({
    args: {
        name: v.string(),
        date: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("חובה להתחבר");

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

        // מסננים למקרה שמשהו נמחק, וממיינים לפי תאריך (הכי חדש למעלה)
        return events
            .filter((e) => e !== null)
            .sort((a, b) => b!.date - a!.date);
    },
});