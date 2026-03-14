import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  rounds,
  scoreEntries,
  activityFeedEntries,
  type NewRound,
} from "@/lib/db/schema";
import { validateTransition } from "./state-machines/round-sm";
import type { RoundStatus } from "@/types";
import type { CreateRoundInput, UpdateRoundInput } from "@/lib/validation/rounds";

export async function createRound(
  tripId: string,
  userId: string,
  data: CreateRoundInput
) {
  return db.transaction(async (tx) => {
    const [round] = await tx
      .insert(rounds)
      .values({
        tripId,
        courseId: data.courseId,
        roundDate: data.roundDate,
        format: data.format ?? null,
        status: "scheduled",
      } satisfies NewRound)
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "round_created",
      actorId: userId,
      description: `Round scheduled for ${data.roundDate}`,
      metadata: {
        roundId: round.id,
        courseId: data.courseId,
      },
    });

    return round;
  });
}

export async function listRounds(tripId: string) {
  return db
    .select()
    .from(rounds)
    .where(eq(rounds.tripId, tripId))
    .orderBy(rounds.roundDate);
}

export async function getRound(roundId: string) {
  const [round] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.id, roundId));

  if (!round) return null;

  // Get distinct player count from score entries
  const scores = await db
    .select({ playerId: scoreEntries.playerId })
    .from(scoreEntries)
    .where(eq(scoreEntries.roundId, roundId));

  const playerIds = new Set(scores.map((s) => s.playerId));

  return { ...round, playerCount: playerIds.size };
}

export async function updateRound(roundId: string, data: UpdateRoundInput) {
  const [existing] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.id, roundId));

  if (!existing) return null;

  const editableStates: RoundStatus[] = ["scheduled", "in_progress"];
  if (!editableStates.includes(existing.status as RoundStatus)) {
    return {
      error: `Cannot update round in "${existing.status}" state`,
    };
  }

  const updateData: Record<string, unknown> = {};
  if (data.courseId !== undefined) updateData.courseId = data.courseId;
  if (data.roundDate !== undefined) updateData.roundDate = data.roundDate;
  if (data.format !== undefined) updateData.format = data.format;

  if (Object.keys(updateData).length === 0) {
    return { round: existing };
  }

  const [updated] = await db
    .update(rounds)
    .set(updateData)
    .where(eq(rounds.id, roundId))
    .returning();

  return { round: updated };
}

async function transitionRound(
  roundId: string,
  userId: string,
  newStatus: RoundStatus,
  eventType: string,
  description: string
) {
  const [existing] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.id, roundId));

  if (!existing) return { error: "Round not found" };

  const result = validateTransition(
    existing.status as RoundStatus,
    newStatus
  );
  if (!result.valid) return { error: result.reason };

  return db.transaction(async (tx) => {
    const setData: Record<string, unknown> = {
      status: newStatus,
      statusChangedAt: new Date(),
    };

    if (newStatus === "finalized") {
      setData.finalizedAt = new Date();
    }

    const [updated] = await tx
      .update(rounds)
      .set(setData)
      .where(eq(rounds.id, roundId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: existing.tripId,
      eventType,
      actorId: userId,
      description,
      metadata: {
        roundId,
        from: existing.status,
        to: newStatus,
      },
    });

    return { round: updated };
  });
}

export async function startRound(roundId: string, userId: string) {
  return transitionRound(
    roundId,
    userId,
    "in_progress",
    "round_started",
    "Round started"
  );
}

export async function completeRound(roundId: string, userId: string) {
  return transitionRound(
    roundId,
    userId,
    "completed",
    "round_completed",
    "Round completed"
  );
}

export async function finalizeRound(roundId: string, userId: string) {
  return transitionRound(
    roundId,
    userId,
    "finalized",
    "round_finalized",
    "Round finalized — scores are locked"
  );
}
