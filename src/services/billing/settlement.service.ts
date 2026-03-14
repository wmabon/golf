import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { settlementActions } from "@/lib/db/schema";
import { calculateSettlement } from "./expense.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentMethod = "venmo" | "zelle" | "paypal" | "cashapp";

export interface DeepLinkResult {
  actionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  method: PaymentMethod;
  deepLinkUrl: string;
}

// ---------------------------------------------------------------------------
// Pure deep link generation (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Generate a deep link URL for a given payment method.
 * Pure function -- no DB dependency.
 *
 * @param method     The payment app
 * @param recipient  Username/handle/email for the recipient
 * @param amount     Dollar amount
 * @param note       Description for the payment
 */
export function buildDeepLinkUrl(
  method: PaymentMethod,
  recipient: string,
  amount: number,
  note: string
): string {
  const encodedNote = encodeURIComponent(note);
  const formattedAmount = amount.toFixed(2);

  switch (method) {
    case "venmo":
      return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(recipient)}&amount=${formattedAmount}&note=${encodedNote}`;

    case "zelle":
      // Zelle has no standard deep link -- fall back to mailto with pre-filled subject
      return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(`Payment: $${formattedAmount}`)}&body=${encodedNote}`;

    case "paypal":
      return `https://www.paypal.com/paypalme/${encodeURIComponent(recipient)}/${formattedAmount}`;

    case "cashapp":
      return `https://cash.app/$${encodeURIComponent(recipient)}/${formattedAmount}`;
  }
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

const PAYMENT_METHODS: PaymentMethod[] = ["venmo", "zelle", "paypal", "cashapp"];

/**
 * Generate settlement deep links for all outstanding balances in a trip.
 * Creates settlement_action records for each debtor -> creditor pair,
 * with deep links for each supported payment method.
 */
export async function generateDeepLinks(tripId: string): Promise<DeepLinkResult[]> {
  const settlement = await calculateSettlement(tripId);
  const results: DeepLinkResult[] = [];

  // Collect all user IDs that need name lookups
  const userIds = new Set<string>();
  for (const balance of settlement.memberBalances) {
    userIds.add(balance.userId);
    for (const entry of balance.owesTo) {
      userIds.add(entry.userId);
    }
  }

  // Look up user names for the payment note
  const userNames = new Map<string, string>();
  for (const balance of settlement.memberBalances) {
    userNames.set(balance.userId, balance.name);
    for (const entry of balance.owesTo) {
      userNames.set(entry.userId, entry.name);
    }
  }

  for (const balance of settlement.memberBalances) {
    for (const entry of balance.owesTo) {
      const note = `Golf trip settlement: ${userNames.get(balance.userId) ?? "Member"} -> ${userNames.get(entry.userId) ?? "Member"}`;

      // Create one settlement action per payment method
      for (const method of PAYMENT_METHODS) {
        // Use a placeholder recipient -- users configure their own handles
        const recipientPlaceholder = entry.userId;
        const deepLinkUrl = buildDeepLinkUrl(
          method,
          recipientPlaceholder,
          entry.amount,
          note
        );

        const [action] = await db
          .insert(settlementActions)
          .values({
            tripId,
            fromUserId: balance.userId,
            toUserId: entry.userId,
            amount: String(entry.amount),
            method,
            deepLinkUrl,
            status: "pending",
          })
          .returning();

        results.push({
          actionId: action.id,
          fromUserId: balance.userId,
          toUserId: entry.userId,
          amount: entry.amount,
          method,
          deepLinkUrl,
        });
      }
    }
  }

  return results;
}

/**
 * List all settlement actions for a trip.
 */
export async function listSettlementActions(tripId: string) {
  return db
    .select()
    .from(settlementActions)
    .where(eq(settlementActions.tripId, tripId))
    .orderBy(desc(settlementActions.createdAt));
}

/**
 * Captain marks a settlement action as settled (FR-83).
 */
export async function markSettled(actionId: string, captainId: string) {
  const [action] = await db
    .select()
    .from(settlementActions)
    .where(eq(settlementActions.id, actionId));

  if (!action) return { error: "Settlement action not found" };

  const [updated] = await db
    .update(settlementActions)
    .set({
      status: "confirmed",
      statusChangedAt: new Date(),
      confirmedAt: new Date(),
    })
    .where(eq(settlementActions.id, actionId))
    .returning();

  return { action: updated };
}

/**
 * Payee confirms receipt of payment (FR-83).
 * Only the "toUser" (creditor) can confirm.
 */
export async function confirmReceipt(actionId: string, userId: string) {
  const [action] = await db
    .select()
    .from(settlementActions)
    .where(eq(settlementActions.id, actionId));

  if (!action) return { error: "Settlement action not found" };
  if (action.toUserId !== userId) {
    return { error: "Only the payee can confirm receipt" };
  }

  const [updated] = await db
    .update(settlementActions)
    .set({
      status: "confirmed",
      statusChangedAt: new Date(),
      confirmedAt: new Date(),
    })
    .where(eq(settlementActions.id, actionId))
    .returning();

  return { action: updated };
}
