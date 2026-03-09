import { v, ConvexError } from "convex/values";
import {mutation, query} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuth, requireEventAccess } from "./helpers";

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
        const events: Doc<'events'>[] = [];

        for (const participation of participations) {
            const event = await ctx.db.get(participation.eventId);
            if (event) {
                events.push(event);
            }
        }

        // Type predicate tells TypeScript the filtered array is non-null,
        // eliminating the need for ! assertions on the frontend
        return events.sort((a, b) => b.date - a.date);
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

export const update = mutation({
    args: {
        eventId: v.id("events"),
        name: v.optional(v.string()),
        date: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const event = await ctx.db.get(args.eventId);

        if (!event) {
            throw new ConvexError('האירוע לא נמצא');
        }

        if (event.ownerId !== userId) {
            throw new ConvexError('רק בעל האירוע יכול לערוך את פרטי המפגש');
        }

        const updates: { name?: string; date?: number } = {};

        if (typeof args.name === 'string') {
            const name = args.name.trim();
            if (!name) {
                throw new ConvexError('חובה להזין שם למפגש.');
            }
            if (name.length > MAX_EVENT_NAME_LENGTH) {
                throw new ConvexError('שם המפגש ארוך מדי. עד 80 תווים.');
            }
            updates.name = name;
        }

        if (typeof args.date === 'number') {
            const now = Date.now();
            if (!Number.isFinite(args.date)) {
                throw new ConvexError('תאריך המפגש לא תקין.');
            }
            if (args.date < now - EVENT_PAST_TOLERANCE_MS || args.date > now + EVENT_FUTURE_LIMIT_MS) {
                throw new ConvexError('תאריך המפגש לא בטווח תקין.');
            }
            updates.date = args.date;
        }

        if (Object.keys(updates).length === 0) {
            throw new ConvexError('לא נשלח מידע לעדכון.');
        }

        await ctx.db.patch(args.eventId, updates);
    },
});

export const remove = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const event = await ctx.db.get(args.eventId);

        if (!event) {
            throw new ConvexError("האירוע לא נמצא");
        }
        if (event.ownerId !== userId) {
            throw new ConvexError("רק בעל האירוע יכול למחוק את המפגש");
        }

        const drinks = await ctx.db
            .query("drinks")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        const participants = await ctx.db
            .query("eventParticipants")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        for (const drink of drinks) {
            await ctx.db.delete(drink._id);
        }
        for (const participant of participants) {
            await ctx.db.delete(participant._id);
        }

        await ctx.db.delete(args.eventId);
    },
});

export const getParticipantsSummary = query({
    args: {
        eventId: v.id('events'),
    },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        await requireEventAccess(ctx, args.eventId, userId);

        const participants = await ctx.db
            .query('eventParticipants')
            .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
            .collect();

        const drinks = await ctx.db
            .query('drinks')
            .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
            .collect();

        const statsByUserId = new Map<string, { beersBrought: number; totalSpent: number }>();

        for (const drink of drinks) {
            const key = drink.payerId;
            const previous = statsByUserId.get(key) ?? { beersBrought: 0, totalSpent: 0 };
            statsByUserId.set(key, {
                beersBrought: previous.beersBrought + 1,
                totalSpent: previous.totalSpent + drink.price,
            });
        }

        const participantRows: {
            userId: string;
            name: string;
            image?: string;
            beersBrought: number;
            totalSpent: number;
        }[] = [];

        for (const participant of participants) {
            const participantUser = await ctx.db.get(participant.userId);
            const stats = statsByUserId.get(participant.userId) ?? { beersBrought: 0, totalSpent: 0 };

            participantRows.push({
                userId: participant.userId,
                name: participantUser?.name ?? 'משתתף',
                image: participantUser?.image,
                beersBrought: stats.beersBrought,
                totalSpent: stats.totalSpent,
            });
        }

        return participantRows.sort((a, b) => b.beersBrought - a.beersBrought);
    },
});

export const getInviteDetails = query({
    args: { eventId: v.id('events') },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const event = await ctx.db.get(args.eventId);


        if (!event) {
            throw new ConvexError('האירוע לא נמצא');
        }

        const owner = await ctx.db.get(event.ownerId);
        const ownerName = owner?.name ?? 'משתמש';

        const participation = await ctx.db
            .query('eventParticipants')
            .withIndex('by_event_and_user', (q) => q.eq('eventId', args.eventId).eq('userId', userId))
            .first();

        const now = Date.now();
        const canJoin = !(event.isSettled || event.date < now);
        const joinBlockedReason = !canJoin
            ? event.isSettled
                ? 'אי אפשר להצטרף למפגש שסוכם.'
                : 'אי אפשר להצטרף למפגש שכבר הסתיים.'
            : null;

        return {
            name: event.name,
            date: event.date,
            ownerName,
            alreadyParticipant: Boolean(participation),
            canJoin,
            joinBlockedReason,
        };
    },
});

export const addParticipant = mutation({
    args: { eventId: v.id('events') },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const event = await ctx.db.get(args.eventId);

        if (!event) {
            throw new ConvexError('האירוע לא נמצא');
        }

        const participation = await ctx.db
            .query('eventParticipants')
            .withIndex('by_event_and_user', (q) => q.eq('eventId', args.eventId).eq('userId', userId))
            .first();

        if (participation) {
            return {
                participationId: participation._id,
                alreadyParticipant: true,
            };
        }

        if (event.isSettled) {
            throw new ConvexError('אי אפשר להצטרף למפגש שסוכם.');
        }

        if (event.date < Date.now()) {
            throw new ConvexError('אי אפשר להצטרף למפגש שכבר הסתיים.');
        }

        const participationId = await ctx.db.insert('eventParticipants', {
            eventId: args.eventId,
            userId,
        });

        return {
            participationId,
            alreadyParticipant: false,
        };
    },
});

export const removeParticipant = mutation({
    args: {
        eventId: v.id('events'),
        userId: v.id('users'),
    },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const event = await ctx.db.get(args.eventId);

        if (!event) {
            throw new ConvexError('האירוע לא נמצא');
        }

        const canRemoveParticipant = args.userId === userId || event.ownerId === userId;
        if (!canRemoveParticipant) {
            throw new ConvexError('אין לך הרשאה להסיר את המשתתף הזה');
        }

        if (args.userId === event.ownerId) {
            throw new ConvexError('בעל המפגש לא יכול לעזוב את המפגש שלו');
        }

        const participation = await ctx.db
            .query('eventParticipants')
            .withIndex('by_event_and_user', (q) => q.eq('eventId', args.eventId).eq('userId', args.userId))
            .first();

        if (!participation) {
            throw new ConvexError('המשתתף לא נמצא במפגש');
        }

        const drinks = await ctx.db
            .query('drinks')
            .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
            .collect();

        const participantDrinks = drinks.filter((drink) => drink.payerId === args.userId);

        for (const drink of participantDrinks) {
            await ctx.db.delete(drink._id);
        }

        await ctx.db.delete(participation._id);
    },

});
