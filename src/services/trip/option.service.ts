import { eq, and, desc, sql, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  tripOptions,
  activityFeedEntries,
  tripMembers,
  votes,
} from "@/lib/db/schema";
import { tallyVotes, countBudgetViolations } from "./vote-logic";
import type { CreateOptionInput } from "@/lib/validation/trips";

export async function createOption(
  tripId: string,
  userId: string,
  data: CreateOptionInput
) {
  return db.transaction(async (tx) => {
    const [option] = await tx
      .insert(tripOptions)
      .values({
        tripId,
        type: data.type,
        title: data.title,
        estimatedCostPerGolfer: data.estimatedCostPerGolfer?.toString(),
        fitScore: data.fitScore?.toString(),
        fitRationale: data.fitRationale,
        status: "proposed",
      })
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "option_added",
      actorId: userId,
      description: `Option added: "${option.title}"`,
      metadata: { optionId: option.id, type: option.type },
    });

    return option;
  });
}

export async function listOptions(tripId: string) {
  const options = await db
    .select()
    .from(tripOptions)
    .where(eq(tripOptions.tripId, tripId));

  // Fetch all votes for these options in a single query
  const optionIds = options.map((o) => o.id);
  const allVotes =
    optionIds.length > 0
      ? await db
          .select({
            tripOptionId: votes.tripOptionId,
            voteValue: votes.voteValue,
          })
          .from(votes)
          .where(sql`${votes.tripOptionId} IN ${optionIds}`)
      : [];

  // Group votes by option
  const votesByOption = new Map<
    string,
    { voteValue: string }[]
  >();
  for (const v of allVotes) {
    const existing = votesByOption.get(v.tripOptionId) ?? [];
    existing.push({ voteValue: v.voteValue });
    votesByOption.set(v.tripOptionId, existing);
  }

  // Attach vote summaries
  const enriched = options.map((option) => {
    const optionVotes = votesByOption.get(option.id) ?? [];
    const summary = tallyVotes(optionVotes);
    return { ...option, voteSummary: summary };
  });

  // Sort: finalized first, then by net score (in - out DESC), then fitScore DESC NULLS LAST
  enriched.sort((a, b) => {
    // Finalized first
    const aFinalized = a.status === "finalized" ? 0 : 1;
    const bFinalized = b.status === "finalized" ? 0 : 1;
    if (aFinalized !== bFinalized) return aFinalized - bFinalized;

    // Then by net score (in - out) DESC
    const aNet = a.voteSummary.in - a.voteSummary.out;
    const bNet = b.voteSummary.in - b.voteSummary.out;
    if (aNet !== bNet) return bNet - aNet;

    // Then by fitScore DESC NULLS LAST
    const aFit = a.fitScore != null ? Number(a.fitScore) : -Infinity;
    const bFit = b.fitScore != null ? Number(b.fitScore) : -Infinity;
    return bFit - aFit;
  });

  return enriched;
}

export async function getOption(optionId: string) {
  const [option] = await db
    .select()
    .from(tripOptions)
    .where(eq(tripOptions.id, optionId));

  if (!option) return null;

  const optionVotes = await db
    .select({ voteValue: votes.voteValue })
    .from(votes)
    .where(eq(votes.tripOptionId, optionId));

  return { ...option, voteSummary: tallyVotes(optionVotes) };
}

export async function updateOption(
  optionId: string,
  data: Partial<CreateOptionInput>
) {
  const setData: Record<string, unknown> = {};
  if (data.type !== undefined) setData.type = data.type;
  if (data.title !== undefined) setData.title = data.title;
  if (data.estimatedCostPerGolfer !== undefined)
    setData.estimatedCostPerGolfer = data.estimatedCostPerGolfer?.toString();
  if (data.fitScore !== undefined)
    setData.fitScore = data.fitScore?.toString();
  if (data.fitRationale !== undefined) setData.fitRationale = data.fitRationale;

  const [updated] = await db
    .update(tripOptions)
    .set(setData)
    .where(eq(tripOptions.id, optionId))
    .returning();

  return updated ?? null;
}

export async function deleteOption(
  tripId: string,
  optionId: string,
  actorId: string
) {
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(tripOptions)
      .where(
        and(eq(tripOptions.id, optionId), eq(tripOptions.tripId, tripId))
      )
      .returning();

    if (!deleted) return null;

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "option_removed",
      actorId,
      description: `Option removed: "${deleted.title}"`,
      metadata: { optionId: deleted.id },
    });

    return deleted;
  });
}

export async function generateShortlist(tripId: string) {
  // Simple heuristic placeholder: mark top 3-5 proposed options by fitScore as shortlisted
  const proposed = await db
    .select()
    .from(tripOptions)
    .where(
      and(
        eq(tripOptions.tripId, tripId),
        eq(tripOptions.status, "proposed")
      )
    )
    .orderBy(desc(tripOptions.fitScore))
    .limit(5);

  if (proposed.length === 0) return [];

  // Take at least 3, up to 5
  const toShortlist = proposed.slice(0, Math.max(3, proposed.length));
  const shortlistedIds = toShortlist.map((o) => o.id);

  await db
    .update(tripOptions)
    .set({ status: "shortlisted" })
    .where(sql`${tripOptions.id} IN ${shortlistedIds}`);

  await db.insert(activityFeedEntries).values({
    tripId,
    eventType: "shortlist_generated",
    actorId: null,
    description: `Shortlist generated with ${shortlistedIds.length} options`,
    metadata: { optionIds: shortlistedIds },
  });

  // Return the shortlisted options with updated status
  return toShortlist.map((o) => ({ ...o, status: "shortlisted" as const }));
}

export async function eliminateByConstraints(tripId: string) {
  // FR-26: Get all accepted members' hard constraints
  const members = await db
    .select({
      hardConstraints: tripMembers.hardConstraints,
    })
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.responseStatus, "accepted")
      )
    );

  const memberBudgets = members
    .map((m) => m.hardConstraints?.maxBudgetPerRound)
    .filter((b): b is number => b != null);

  if (memberBudgets.length === 0) return 0;

  // Get all non-eliminated, non-finalized options with a cost
  const options = await db
    .select()
    .from(tripOptions)
    .where(
      and(
        eq(tripOptions.tripId, tripId),
        isNotNull(tripOptions.estimatedCostPerGolfer)
      )
    );

  const activeOptions = options.filter(
    (o) => o.status !== "eliminated" && o.status !== "finalized"
  );

  let eliminatedCount = 0;

  for (const option of activeOptions) {
    const cost = Number(option.estimatedCostPerGolfer);
    const violations = countBudgetViolations(cost, memberBudgets);

    // Only eliminate if more than 1 member has constraint violated
    if (violations > 1) {
      await db
        .update(tripOptions)
        .set({ status: "eliminated" })
        .where(eq(tripOptions.id, option.id));

      // Log elimination without identifying which members caused it (privacy per FR-26)
      await db.insert(activityFeedEntries).values({
        tripId,
        eventType: "option_eliminated_constraints",
        actorId: null,
        description: `Option "${option.title}" eliminated due to budget constraints`,
        metadata: { optionId: option.id, violationCount: violations },
      });

      eliminatedCount++;
    }
  }

  return eliminatedCount;
}
