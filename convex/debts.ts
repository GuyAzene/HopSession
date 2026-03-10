import { query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import type { Id, Doc } from './_generated/dataModel';
import { requireAuth, requireEventAccess } from './helpers';

// --- Pure helpers (no Convex dependency) ---

/**
 * Computes net balance per participant.
 * Positive = others owe this person. Negative = this person owes others.
 *
 * Each drink: payer is credited the full price,
 * every participant is debited an equal share (price / n).
 */
function computeBalances(
    drinks: Doc<'drinks'>[],
    participantIds: Id<'users'>[]
): Map<Id<'users'>, number> {
    const n = participantIds.length;
    const balances = new Map<Id<'users'>, number>();
    for (const id of participantIds) balances.set(id, 0);

    for (const drink of drinks) {
        const share = drink.price / n;

        // Payer gets credited the full price
        balances.set(drink.payerId, (balances.get(drink.payerId) ?? 0) + drink.price);

        // Every participant is debited their equal share
        for (const id of participantIds) {
            balances.set(id, (balances.get(id) ?? 0) - share);
        }
    }

    return balances;
}

interface DebtTransaction {
    from: Id<'users'>;
    to: Id<'users'>;
    amount: number;
}

/**
 * Greedy debt simplification — minimizes the number of transactions needed
 * to settle all balances. Consistent across all participants since every
 * individual view is a filter of this same global list.
 */
function simplifyDebts(balances: Map<Id<'users'>, number>): DebtTransaction[] {
    const EPSILON = 0.01; // ignore sub-agora floating point dust

    const creditors: { id: Id<'users'>; amount: number }[] = [];
    const debtors: { id: Id<'users'>; amount: number }[] = [];

    for (const [id, balance] of balances) {
        if (balance > EPSILON) creditors.push({ id, amount: balance });
        else if (balance < -EPSILON) debtors.push({ id, amount: -balance });
    }

    // Sort descending — always match the largest amounts first
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions: DebtTransaction[] = [];
    let ci = 0;
    let di = 0;

    while (ci < creditors.length && di < debtors.length) {
        const payment = Math.min(creditors[ci].amount, debtors[di].amount);

        transactions.push({
            from: debtors[di].id,
            to: creditors[ci].id,
            amount: Math.round(payment * 100) / 100, // round to 2 decimals
        });

        creditors[ci].amount -= payment;
        debtors[di].amount -= payment;

        if (creditors[ci].amount < EPSILON) ci++;
        if (debtors[di].amount < EPSILON) di++;
    }

    return transactions;
}

// --- Query ---

/**
 * Returns the simplified debt settlement list for an event.
 * Each entry: `from` owes `to` the given `amount` (in ₪).
 *
 * Reactive — re-runs automatically whenever drinks or participants change.
 * Auth-protected — only event participants/owner can query.
 */
export const getEventDebts = query({
    args: { eventId: v.id('events') },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        await requireEventAccess(ctx, args.eventId, userId);

        const drinks = await ctx.db
            .query('drinks')
            .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
            .collect();

        const participants = await ctx.db
            .query('eventParticipants')
            .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
            .collect();

        // Not enough participants or no drinks — nothing to settle
        if (participants.length < 2 || drinks.length === 0) return [];

        const participantIds = participants.map((p) => p.userId);

        // Validate: all drink payers must be known participants
        const participantSet = new Set(participantIds.map(String));
        for (const drink of drinks) {
            if (!participantSet.has(String(drink.payerId))) {
                throw new ConvexError('נמצאה בירה ששולמה על ידי משתמש שאינו משתתף במפגש');
            }
        }

        const balances = computeBalances(drinks, participantIds);
        return simplifyDebts(balances);
    },
});
