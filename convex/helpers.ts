import { getAuthUserId } from "@convex-dev/auth/server";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// Works across queries, mutations, and actions — all have auth
export async function requireAuth(
    ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<Id<"users">> {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("חובה להתחבר");
    return userId;
}

// Fetches event and verifies access — throws if not found or not authorized
// Use in mutations and queries where a missing event is an error
export async function requireEventAccess(
    ctx: QueryCtx | MutationCtx,
    eventId: Id<"events">,
    userId: Id<"users">
) {
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError("האירוע לא נמצא");

    const isParticipant = await ctx.db
        .query("eventParticipants")
        .withIndex("by_event_and_user", (q) =>
            q.eq("eventId", eventId).eq("userId", userId)
        )
        .first();

    if (!isParticipant && event.ownerId !== userId) {
        throw new ConvexError("אין לך הרשאה לגשת לסשן הזה");
    }

    return event;
}
