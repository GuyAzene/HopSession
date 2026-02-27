import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
    ...authTables,

    events: defineTable({
        name: v.string(),
        date: v.number(),
        ownerId: v.id("users"),
        isSettled: v.boolean(),
        // הסרנו את participants! במקום זה נשתמש בטבלה למטה
    }),

    // --- הטבלה החדשה שלנו: משתתפי המפגש ---
    eventParticipants: defineTable({
        eventId: v.id("events"),
        userId: v.id("users"),
    })
        // אינדקס שמאפשר לשלוף בשניה את כל המפגשים של משתמש ספציפי (לעמוד הראשי)
        .index("by_user", ["userId"])
        // אינדקס שמאפשר לשלוף בשניה את כל המשתתפים של מפגש ספציפי (לעמוד המפגש)
        .index("by_event", ["eventId"])
        // אינדקס שמונע מהמשתמש להצטרף פעמיים לאותו מפגש
        .index("by_event_and_user", ["eventId", "userId"]),

    drinks: defineTable({
        eventId: v.id("events"),
        payerId: v.id("users"),
        name: v.string(),
        price: v.number(),
        consumers: v.array(v.id("users")),
        style: v.optional(v.string()),
        abv: v.optional(v.number()),
        flavors: v.optional(v.array(v.string())),
        untappdLink: v.optional(v.string()),
    })
        .index("by_event", ["eventId"]),
});

export default schema;