import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bets,
  betParticipants,
  activityFeedEntries,
  type NewBet,
  type NewBetParticipant,
} from "@/lib/db/schema";
import { validateTransition } from "./state-machines/bet-sm";
import type { BetStatus } from "@/types";
import type { CreateBetInput } from "@/lib/validation/rounds";

export async function createBet(
  tripId: string,
  userId: string,
  data: CreateBetInput
) {
  return db.transaction(async (tx) => {
    const [bet] = await tx
      .insert(bets)
      .values({
        tripId,
        roundId: data.roundId ?? null,
        creatorId: userId,
        name: data.name ?? null,
        amount: data.amount.toString(),
        triggerDescription: data.triggerDescription,
        status: "proposed",
      } satisfies NewBet)
      .returning();

    // Create participant entries for each participantId
    const participantValues: NewBetParticipant[] = data.participantIds.map(
      (participantId) => ({
        betId: bet.id,
        userId: participantId,
        status: "pending" as const,
      })
    );

    const participants = await tx
      .insert(betParticipants)
      .values(participantValues)
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "bet_created",
      actorId: userId,
      description: data.name
        ? `Side bet proposed: "${data.name}"`
        : `Side bet proposed: ${data.triggerDescription}`,
      metadata: {
        betId: bet.id,
        amount: data.amount,
        participantCount: data.participantIds.length,
      },
    });

    return { bet, participants };
  });
}

export async function listBets(tripId: string, roundId?: string) {
  const conditions = [eq(bets.tripId, tripId)];
  if (roundId) {
    conditions.push(eq(bets.roundId, roundId));
  }

  const betRows = await db
    .select()
    .from(bets)
    .where(and(...conditions))
    .orderBy(bets.createdAt);

  if (betRows.length === 0) return [];

  // Batch-fetch participants
  const betIds = betRows.map((b) => b.id);
  const allParticipants = await db
    .select()
    .from(betParticipants)
    .where(inArray(betParticipants.betId, betIds));

  const participantsByBet = new Map<string, typeof allParticipants>();
  for (const p of allParticipants) {
    const existing = participantsByBet.get(p.betId) ?? [];
    existing.push(p);
    participantsByBet.set(p.betId, existing);
  }

  return betRows.map((b) => ({
    ...b,
    participants: participantsByBet.get(b.id) ?? [],
  }));
}

export async function getBet(betId: string) {
  const [bet] = await db
    .select()
    .from(bets)
    .where(eq(bets.id, betId));

  if (!bet) return null;

  const participants = await db
    .select()
    .from(betParticipants)
    .where(eq(betParticipants.betId, betId));

  return { ...bet, participants };
}

export async function acceptBet(betId: string, userId: string) {
  const bet = await getBet(betId);
  if (!bet) return { error: "Bet not found" };

  // Find this user's participant entry
  const participant = bet.participants.find((p) => p.userId === userId);
  if (!participant) return { error: "Not a participant in this bet" };

  if (participant.status !== "pending") {
    return { error: `Already ${participant.status}` };
  }

  return db.transaction(async (tx) => {
    // Update participant status
    await tx
      .update(betParticipants)
      .set({ status: "accepted", statusChangedAt: new Date() })
      .where(eq(betParticipants.id, participant.id));

    // Check if all participants have accepted
    const updatedParticipants = await tx
      .select()
      .from(betParticipants)
      .where(eq(betParticipants.betId, betId));

    const allAccepted = updatedParticipants.every(
      (p) => p.status === "accepted"
    );

    let updatedBet = bet;
    if (allAccepted && bet.status === "proposed") {
      const result = validateTransition(bet.status as BetStatus, "accepted");
      if (result.valid) {
        const [transitioned] = await tx
          .update(bets)
          .set({ status: "accepted", statusChangedAt: new Date() })
          .where(eq(bets.id, betId))
          .returning();
        updatedBet = { ...transitioned, participants: updatedParticipants };
      }
    }

    return {
      bet: { ...updatedBet, participants: updatedParticipants },
    };
  });
}

export async function declineBet(betId: string, userId: string) {
  const bet = await getBet(betId);
  if (!bet) return { error: "Bet not found" };

  const participant = bet.participants.find((p) => p.userId === userId);
  if (!participant) return { error: "Not a participant in this bet" };

  if (participant.status !== "pending") {
    return { error: `Already ${participant.status}` };
  }

  return db.transaction(async (tx) => {
    await tx
      .update(betParticipants)
      .set({ status: "declined", statusChangedAt: new Date() })
      .where(eq(betParticipants.id, participant.id));

    // Transition bet to declined if any participant declines
    const result = validateTransition(bet.status as BetStatus, "declined");
    let updatedBet = bet;
    if (result.valid) {
      const [transitioned] = await tx
        .update(bets)
        .set({ status: "declined", statusChangedAt: new Date() })
        .where(eq(bets.id, betId))
        .returning();

      const updatedParticipants = await tx
        .select()
        .from(betParticipants)
        .where(eq(betParticipants.betId, betId));

      updatedBet = { ...transitioned, participants: updatedParticipants };
    }

    return { bet: updatedBet };
  });
}

export async function resolveBet(
  betId: string,
  userId: string,
  outcome: string
) {
  const bet = await getBet(betId);
  if (!bet) return { error: "Bet not found" };

  const result = validateTransition(bet.status as BetStatus, "resolved");
  if (!result.valid) return { error: result.reason };

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(bets)
      .set({
        status: "resolved",
        statusChangedAt: new Date(),
        outcome,
        resolvedAt: new Date(),
      })
      .where(eq(bets.id, betId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: bet.tripId,
      eventType: "bet_resolved",
      actorId: userId,
      description: `Side bet resolved: ${outcome}`,
      metadata: {
        betId,
        outcome,
        amount: bet.amount,
      },
    });

    const participants = await tx
      .select()
      .from(betParticipants)
      .where(eq(betParticipants.betId, betId));

    return { bet: { ...updated, participants } };
  });
}

export async function voidBet(betId: string, userId: string) {
  const bet = await getBet(betId);
  if (!bet) return { error: "Bet not found" };

  const result = validateTransition(bet.status as BetStatus, "voided");
  if (!result.valid) return { error: result.reason };

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(bets)
      .set({
        status: "voided",
        statusChangedAt: new Date(),
      })
      .where(eq(bets.id, betId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: bet.tripId,
      eventType: "bet_voided",
      actorId: userId,
      description: `Side bet voided`,
      metadata: { betId },
    });

    const participants = await tx
      .select()
      .from(betParticipants)
      .where(eq(betParticipants.betId, betId));

    return { bet: { ...updated, participants } };
  });
}

/**
 * Compute the net bet ledger for a trip.
 * Only considers resolved bets. Returns net amounts per user.
 */
export async function getBetLedger(tripId: string) {
  const resolvedBets = await db
    .select()
    .from(bets)
    .where(and(eq(bets.tripId, tripId), eq(bets.status, "resolved")));

  if (resolvedBets.length === 0) {
    return { entries: [], totalResolved: 0 };
  }

  // Get all participants for resolved bets
  const betIds = resolvedBets.map((b) => b.id);
  const allParticipants = await db
    .select()
    .from(betParticipants)
    .where(inArray(betParticipants.betId, betIds));

  // Build ledger: for each resolved bet, the amount is the total pot
  // This is a summary view — detailed winner/loser assignment requires
  // the outcome field to be parsed, which is format-dependent.
  const ledger = resolvedBets.map((bet) => {
    const participants = allParticipants.filter((p) => p.betId === bet.id);
    return {
      betId: bet.id,
      name: bet.name,
      amount: bet.amount,
      outcome: bet.outcome,
      participantCount: participants.length,
      participants: participants.map((p) => ({
        userId: p.userId,
        side: p.side,
        status: p.status,
      })),
    };
  });

  return {
    entries: ledger,
    totalResolved: resolvedBets.length,
  };
}
