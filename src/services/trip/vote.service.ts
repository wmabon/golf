import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  votes,
  tripOptions,
  trips,
  activityFeedEntries,
  users,
} from "@/lib/db/schema";
import { tallyVotes, shouldEliminate } from "./vote-logic";
import type { CastVoteInput } from "@/lib/validation/trips";

export async function castVote(
  optionId: string,
  userId: string,
  data: CastVoteInput
) {
  // Check option exists and is not finalized/eliminated
  const [option] = await db
    .select()
    .from(tripOptions)
    .where(eq(tripOptions.id, optionId));

  if (!option) return { error: "Option not found" };
  if (option.status === "finalized")
    return { error: "Cannot vote on a finalized option" };
  if (option.status === "eliminated")
    return { error: "Cannot vote on an eliminated option" };

  // Upsert vote — ON CONFLICT (tripOptionId, userId) DO UPDATE
  const [vote] = await db
    .insert(votes)
    .values({
      tripOptionId: optionId,
      userId,
      voteValue: data.voteValue,
      comment: data.comment ?? null,
      budgetObjection: data.budgetObjection ?? false,
    })
    .onConflictDoUpdate({
      target: [votes.tripOptionId, votes.userId],
      set: {
        voteValue: data.voteValue,
        comment: data.comment ?? null,
        budgetObjection: data.budgetObjection ?? false,
      },
    })
    .returning();

  // Check if majority Out → auto-eliminate
  const allVotes = await db
    .select({ voteValue: votes.voteValue })
    .from(votes)
    .where(eq(votes.tripOptionId, optionId));

  const summary = tallyVotes(allVotes);

  if (shouldEliminate(summary)) {
    await db
      .update(tripOptions)
      .set({ status: "eliminated" })
      .where(eq(tripOptions.id, optionId));

    await db.insert(activityFeedEntries).values({
      tripId: option.tripId,
      eventType: "option_eliminated_votes",
      actorId: null,
      description: `Option "${option.title}" eliminated by votes`,
      metadata: {
        optionId: option.id,
        voteDistribution: { in: summary.in, fine: summary.fine, out: summary.out },
      },
    });
  }

  return { vote };
}

export async function listVotes(optionId: string) {
  return db
    .select({
      id: votes.id,
      userId: votes.userId,
      userName: users.name,
      voteValue: votes.voteValue,
      comment: votes.comment,
      budgetObjection: votes.budgetObjection,
      createdAt: votes.createdAt,
    })
    .from(votes)
    .leftJoin(users, eq(votes.userId, users.id))
    .where(eq(votes.tripOptionId, optionId));
}

export async function getVoteSummary(optionId: string) {
  const allVotes = await db
    .select({ voteValue: votes.voteValue })
    .from(votes)
    .where(eq(votes.tripOptionId, optionId));

  return tallyVotes(allVotes);
}

export async function captainOverride(
  tripId: string,
  optionId: string,
  captainId: string
) {
  return db.transaction(async (tx) => {
    // Get the option to finalize
    const [option] = await tx
      .select()
      .from(tripOptions)
      .where(
        and(eq(tripOptions.id, optionId), eq(tripOptions.tripId, tripId))
      );

    if (!option) return { error: "Option not found" };

    // Finalize this option
    const [finalized] = await tx
      .update(tripOptions)
      .set({ status: "finalized" })
      .where(eq(tripOptions.id, optionId))
      .returning();

    // Eliminate all other non-eliminated options for this trip
    await tx
      .update(tripOptions)
      .set({ status: "eliminated" })
      .where(
        and(
          eq(tripOptions.tripId, tripId),
          sql`${tripOptions.id} != ${optionId}`,
          sql`${tripOptions.status} != 'eliminated'`
        )
      );

    // Get vote summary snapshot
    const allVotes = await tx
      .select({ voteValue: votes.voteValue })
      .from(votes)
      .where(eq(votes.tripOptionId, optionId));

    const voteSummary = tallyVotes(allVotes);

    // Log to activity feed with full vote distribution for transparency (FR-27)
    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "captain_override",
      actorId: captainId,
      description: `Captain finalized option: "${finalized.title}"`,
      metadata: {
        optionId: finalized.id,
        optionTitle: finalized.title,
        voteDistribution: {
          in: voteSummary.in,
          fine: voteSummary.fine,
          out: voteSummary.out,
        },
        overrideBy: captainId,
      },
    });

    return { option: finalized, voteSummary };
  });
}

export async function setVotingDeadline(tripId: string, deadline: string) {
  const [updated] = await db
    .update(trips)
    .set({ votingDeadline: new Date(deadline) })
    .where(eq(trips.id, tripId))
    .returning();

  if (!updated) return { error: "Trip not found" };

  await db.insert(activityFeedEntries).values({
    tripId,
    eventType: "voting_deadline_set",
    actorId: null,
    description: `Voting deadline set to ${new Date(deadline).toLocaleDateString()}`,
    metadata: { deadline },
  });

  return { trip: updated };
}

export async function switchVotingMode(
  tripId: string,
  mode: "destination" | "course"
) {
  const [updated] = await db
    .update(trips)
    .set({ votingMode: mode })
    .where(eq(trips.id, tripId))
    .returning();

  if (!updated) return { error: "Trip not found" };

  await db.insert(activityFeedEntries).values({
    tripId,
    eventType: "voting_mode_changed",
    actorId: null,
    description: `Voting mode changed to "${mode}"`,
    metadata: { mode },
  });

  return { trip: updated };
}
