import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { legacyAuthTables } from './legacyAuthTables';

const schema = defineSchema({
    ...legacyAuthTables,
    users: defineTable({
        name: v.optional(v.string()), image: v.optional(v.string()),
        email: v.optional(v.string()), emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()), phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
        betterAuthId: v.optional(v.string()),
        authEmail: v.optional(v.string()),
    }).index('email', ['email'])
        .index('phone', ['phone'])
        .index('by_better_auth_id', ['betterAuthId'])
        .index('by_auth_email', ['authEmail']),

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
        // אינדקס לשליפה מהירה לפי eventId+userId (לא ייחודי בפני עצמו)
        .index("by_event_and_user", ["eventId", "userId"]),

    drinks: defineTable({
        eventId: v.id("events"),               //auto added
        payerId: v.id("users"),                //auto added
        beerName: v.string(),                            //manually/untapped added
        breweryName: v.optional(v.string()),             //manually/untapped added
        abv: v.optional(v.number()),                     //manually/untapped added
        rating: v.optional(v.number()),                  //untapped added
        style: v.optional(v.string()),                   //manually/untapped added
        beerImageURL: v.optional(v.string()),            //untapped added
        untappdLink: v.optional(v.string()),             //untapped added
        price: v.number(),                               //manually added
        consumers: v.array(v.id("users")),    //auto added — currently only set to [payerId] on creation; update via a future "markConsumed" mutation for cost-splitting
    })
        .index("by_event", ["eventId"])
        .index("by_event_and_payer", ["eventId", "payerId"]),
});

export default schema;
