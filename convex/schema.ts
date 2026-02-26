import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
    ...authTables,

    events: defineTable({
        name: v.string(), // למשל: "טעימות חמישי בערב"
        date: v.number(), // נשמור כ-Timestamp כדי שיהיה קל למיין
        ownerId: v.id("users"), // מי פתח את האירוע
        participants: v.array(v.id("users")), // כל מי שיושב בשולחן
        isSettled: v.boolean(), // האם החשבון כבר חולק ונסגר?
    }),

    drinks: defineTable({
        eventId: v.id("events"), // לאיזה אירוע הבירה שייכת
        payerId: v.id("users"), // מי קנה/שילם על הבירה
        name: v.string(), // שם הבירה
        price: v.number(), // כמה היא עלתה

        // מי שתה בפועל? (כדי שנוכל לחלק את המחיר של הבירה הזו רק ביניהם)
        consumers: v.array(v.id("users")),

        // --- פרטים נוספים (אופציונליים) ---
        style: v.optional(v.string()), // סוג (IPA, Stout, Sour...)
        abv: v.optional(v.number()), // אחוז אלכוהול
        flavors: v.optional(v.array(v.string())), // תגיות טעם
        untappdLink: v.optional(v.string()), // לינק
    })
        // אנחנו מוסיפים אינדקס כדי שהשליפה של כל הבירות לאירוע ספציפי תהיה סופר מהירה
        .index("by_event", ["eventId"]),

});

export default schema;