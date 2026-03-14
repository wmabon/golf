import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  tripExpenses,
  tripMembers,
  activityFeedEntries,
  feeCharges,
  users,
} from "@/lib/db/schema";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/lib/validation/expenses";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemberBalance {
  userId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netPosition: number;
  owesTo: { userId: string; name: string; amount: number }[];
}

export interface PlatformFeeEntry {
  userId: string;
  amount: number;
}

export interface SettlementSummary {
  memberBalances: MemberBalance[];
  platformFees: {
    total: number;
    perMember: PlatformFeeEntry[];
  };
}

// ---------------------------------------------------------------------------
// Pure computation (exported for unit testing)
// ---------------------------------------------------------------------------

interface ExpenseInput {
  payerId: string;
  amount: number;
  splitMethod: "equal" | "custom" | "exclude";
  customSplits?: { userId: string; amount: number }[] | null;
  excludedUserIds?: string[] | null;
}

interface MemberInput {
  userId: string;
  name: string;
}

interface FeeInput {
  userId: string;
  amount: number;
}

/**
 * Pure function to calculate settlement from expenses and member data.
 * No DB dependency -- exported for unit testing.
 */
export function calculateSettlementPure(
  expenses: ExpenseInput[],
  members: MemberInput[],
  fees: FeeInput[]
): SettlementSummary {
  const memberMap = new Map(members.map((m) => [m.userId, m.name]));
  const memberIds = members.map((m) => m.userId);

  // Track how much each person paid and how much each person owes
  const totalPaid = new Map<string, number>();
  const totalOwed = new Map<string, number>();

  for (const id of memberIds) {
    totalPaid.set(id, 0);
    totalOwed.set(id, 0);
  }

  for (const expense of expenses) {
    const amount = expense.amount;

    // Record payment by payer
    totalPaid.set(
      expense.payerId,
      (totalPaid.get(expense.payerId) ?? 0) + amount
    );

    // Determine shares based on split method
    if (expense.splitMethod === "custom" && expense.customSplits) {
      for (const split of expense.customSplits) {
        if (memberIds.includes(split.userId)) {
          totalOwed.set(
            split.userId,
            (totalOwed.get(split.userId) ?? 0) + split.amount
          );
        }
      }
    } else if (expense.splitMethod === "exclude") {
      const excluded = new Set(expense.excludedUserIds ?? []);
      const eligible = memberIds.filter((id) => !excluded.has(id));
      if (eligible.length > 0) {
        const share = Math.round((amount / eligible.length) * 100) / 100;
        for (const id of eligible) {
          totalOwed.set(id, (totalOwed.get(id) ?? 0) + share);
        }
      }
    } else {
      // equal split across all members
      if (memberIds.length > 0) {
        const share = Math.round((amount / memberIds.length) * 100) / 100;
        for (const id of memberIds) {
          totalOwed.set(id, (totalOwed.get(id) ?? 0) + share);
        }
      }
    }
  }

  // Calculate net positions: positive = owed money, negative = owes money
  const netPositions = new Map<string, number>();
  for (const id of memberIds) {
    const paid = totalPaid.get(id) ?? 0;
    const owed = totalOwed.get(id) ?? 0;
    netPositions.set(id, Math.round((paid - owed) * 100) / 100);
  }

  // Compute "who owes whom" using the simplification algorithm
  // Separate into creditors (positive net) and debtors (negative net)
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const id of memberIds) {
    const net = netPositions.get(id) ?? 0;
    if (net > 0) {
      creditors.push({ userId: id, amount: net });
    } else if (net < 0) {
      debtors.push({ userId: id, amount: -net });
    }
  }

  // Sort for deterministic results
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Build owesTo map
  const owesToMap = new Map<string, { userId: string; name: string; amount: number }[]>();
  for (const id of memberIds) {
    owesToMap.set(id, []);
  }

  // Match debtors to creditors
  let ci = 0;
  let di = 0;
  const creditorsCopy = creditors.map((c) => ({ ...c }));
  const debtorsCopy = debtors.map((d) => ({ ...d }));

  while (ci < creditorsCopy.length && di < debtorsCopy.length) {
    const creditor = creditorsCopy[ci];
    const debtor = debtorsCopy[di];
    const payment = Math.round(Math.min(creditor.amount, debtor.amount) * 100) / 100;

    if (payment > 0) {
      owesToMap.get(debtor.userId)!.push({
        userId: creditor.userId,
        name: memberMap.get(creditor.userId) ?? "Unknown",
        amount: payment,
      });
    }

    creditor.amount = Math.round((creditor.amount - payment) * 100) / 100;
    debtor.amount = Math.round((debtor.amount - payment) * 100) / 100;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  // Platform fees
  const feeMap = new Map<string, number>();
  let feeTotal = 0;
  for (const fee of fees) {
    feeMap.set(fee.userId, (feeMap.get(fee.userId) ?? 0) + fee.amount);
    feeTotal += fee.amount;
  }

  const memberBalances: MemberBalance[] = memberIds.map((id) => ({
    userId: id,
    name: memberMap.get(id) ?? "Unknown",
    totalPaid: Math.round((totalPaid.get(id) ?? 0) * 100) / 100,
    totalOwed: Math.round((totalOwed.get(id) ?? 0) * 100) / 100,
    netPosition: netPositions.get(id) ?? 0,
    owesTo: owesToMap.get(id) ?? [],
  }));

  const perMember: PlatformFeeEntry[] = [];
  for (const [userId, amount] of feeMap.entries()) {
    perMember.push({ userId, amount: Math.round(amount * 100) / 100 });
  }

  return {
    memberBalances,
    platformFees: {
      total: Math.round(feeTotal * 100) / 100,
      perMember,
    },
  };
}

// ---------------------------------------------------------------------------
// Service functions (DB-dependent)
// ---------------------------------------------------------------------------

/**
 * Create a new trip expense, log to activity feed.
 */
export async function createExpense(
  tripId: string,
  payerId: string,
  data: CreateExpenseInput
) {
  return db.transaction(async (tx) => {
    const [expense] = await tx
      .insert(tripExpenses)
      .values({
        tripId,
        payerId,
        description: data.description,
        amount: String(data.amount),
        category: data.category,
        splitMethod: data.splitMethod,
        customSplits: data.customSplits ?? null,
        excludedUserIds: data.excludedUserIds ?? null,
      })
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "expense_created",
      actorId: payerId,
      description: `Added expense "${data.description}" ($${data.amount.toFixed(2)})`,
      metadata: {
        expenseId: expense.id,
        amount: data.amount,
        category: data.category,
        splitMethod: data.splitMethod,
      },
    });

    return expense;
  });
}

/**
 * List all expenses for a trip, ordered by createdAt DESC.
 */
export async function listExpenses(tripId: string) {
  return db
    .select()
    .from(tripExpenses)
    .where(eq(tripExpenses.tripId, tripId))
    .orderBy(desc(tripExpenses.createdAt));
}

/**
 * Get a single expense by ID.
 */
export async function getExpense(expenseId: string) {
  const [expense] = await db
    .select()
    .from(tripExpenses)
    .where(eq(tripExpenses.id, expenseId));

  return expense ?? null;
}

/**
 * Update an existing expense (partial update).
 */
export async function updateExpense(expenseId: string, data: UpdateExpenseInput) {
  const updateData: Record<string, unknown> = {};

  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = String(data.amount);
  if (data.category !== undefined) updateData.category = data.category;
  if (data.splitMethod !== undefined) updateData.splitMethod = data.splitMethod;
  if (data.customSplits !== undefined) updateData.customSplits = data.customSplits;
  if (data.excludedUserIds !== undefined) updateData.excludedUserIds = data.excludedUserIds;

  if (Object.keys(updateData).length === 0) return null;

  const [updated] = await db
    .update(tripExpenses)
    .set(updateData)
    .where(eq(tripExpenses.id, expenseId))
    .returning();

  return updated ?? null;
}

/**
 * Delete an expense (hard delete).
 */
export async function deleteExpense(expenseId: string) {
  const [deleted] = await db
    .delete(tripExpenses)
    .where(eq(tripExpenses.id, expenseId))
    .returning();

  return deleted ?? null;
}

/**
 * Calculate the settlement summary for a trip.
 * Gathers expenses, accepted members, and platform fees,
 * then delegates to the pure calculateSettlementPure function.
 */
export async function calculateSettlement(tripId: string): Promise<SettlementSummary> {
  // Get all trip expenses
  const expenses = await db
    .select()
    .from(tripExpenses)
    .where(eq(tripExpenses.tripId, tripId));

  // Get accepted trip members with user names
  const members = await db
    .select({
      userId: tripMembers.userId,
      name: users.name,
    })
    .from(tripMembers)
    .innerJoin(users, eq(tripMembers.userId, users.id))
    .where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.responseStatus, "accepted")
      )
    );

  // Get platform fees for this trip
  const fees = await db
    .select()
    .from(feeCharges)
    .where(eq(feeCharges.tripId, tripId));

  const expenseInputs: ExpenseInput[] = expenses.map((e) => ({
    payerId: e.payerId,
    amount: Number(e.amount),
    splitMethod: e.splitMethod,
    customSplits: e.customSplits,
    excludedUserIds: e.excludedUserIds,
  }));

  const memberInputs: MemberInput[] = members
    .filter((m) => m.userId !== null)
    .map((m) => ({
      userId: m.userId!,
      name: m.name,
    }));

  const feeInputs: FeeInput[] = fees.map((f) => ({
    userId: f.userId,
    amount: Number(f.amount),
  }));

  return calculateSettlementPure(expenseInputs, memberInputs, feeInputs);
}
