import { eq, and, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  reservationSwaps,
  reservations,
  trips,
  activityFeedEntries,
  type NewReservationSwap,
} from "@/lib/db/schema";
import type { SwapApprovalState, SwapPolicy } from "@/types";

/**
 * List all swap suggestions for a trip, ordered by most recent first.
 */
export async function listSuggestions(tripId: string) {
  return db
    .select()
    .from(reservationSwaps)
    .where(eq(reservationSwaps.tripId, tripId))
    .orderBy(desc(reservationSwaps.suggestedAt));
}

/**
 * Get a single swap suggestion by ID, with old and new reservation details.
 */
export async function getSuggestion(suggestionId: string) {
  const [swap] = await db
    .select()
    .from(reservationSwaps)
    .where(eq(reservationSwaps.id, suggestionId));

  if (!swap) return null;

  // Fetch old reservation details
  const [oldReservation] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, swap.oldReservationId));

  // Fetch new reservation details if present
  let newReservation = null;
  if (swap.newReservationId) {
    const [res] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, swap.newReservationId));
    newReservation = res ?? null;
  }

  return {
    ...swap,
    oldReservation: oldReservation ?? null,
    newReservation,
  };
}

/**
 * Create a new swap suggestion.
 *
 * Inserts a reservation_swap row with approval_state='suggested'
 * and logs to the activity feed.
 *
 * NOTE (FR-36): This only creates a *suggestion*. The old reservation
 * is NOT canceled here. Cancellation only happens after the captain
 * approves and the rebooking-execute job confirms the replacement.
 */
export async function createSuggestion(
  tripId: string,
  oldReservationId: string,
  data: {
    newReservationId?: string;
    recommendationReason: string;
    costDeltaPerGolfer?: string;
    qualityDelta?: string;
    driveTimeDelta?: number;
    cancellationPenalty?: string;
  }
) {
  return db.transaction(async (tx) => {
    const [swap] = await tx
      .insert(reservationSwaps)
      .values({
        tripId,
        oldReservationId,
        newReservationId: data.newReservationId ?? null,
        recommendationReason: data.recommendationReason,
        approvalState: "suggested",
        costDeltaPerGolfer: data.costDeltaPerGolfer ?? null,
        qualityDelta: data.qualityDelta ?? null,
        driveTimeDelta: data.driveTimeDelta ?? null,
        cancellationPenalty: data.cancellationPenalty ?? null,
      } satisfies NewReservationSwap)
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "swap_suggested",
      description: `Swap suggested: ${data.recommendationReason}`,
      metadata: {
        swapId: swap.id,
        oldReservationId,
        costDeltaPerGolfer: data.costDeltaPerGolfer ?? null,
        qualityDelta: data.qualityDelta ?? null,
      },
    });

    return swap;
  });
}

/**
 * Approve a swap suggestion (captain action).
 *
 * NOTE (FR-36): Approval does NOT cancel the old reservation.
 * The rebooking-execute job handles the actual swap after confirming
 * the replacement booking.
 */
export async function approveSuggestion(
  suggestionId: string,
  captainId: string
) {
  const [existing] = await db
    .select()
    .from(reservationSwaps)
    .where(eq(reservationSwaps.id, suggestionId));

  if (!existing) return { error: "Swap suggestion not found" };

  if (existing.approvalState !== "suggested") {
    return {
      error: `Cannot approve swap in "${existing.approvalState}" state. Only "suggested" swaps can be approved.`,
    };
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(reservationSwaps)
      .set({
        approvalState: "approved",
        decidedBy: captainId,
        decidedAt: new Date(),
      })
      .where(eq(reservationSwaps.id, suggestionId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: existing.tripId,
      eventType: "swap_approved",
      actorId: captainId,
      description: `Swap approved: ${existing.recommendationReason}`,
      metadata: {
        swapId: suggestionId,
        oldReservationId: existing.oldReservationId,
      },
    });

    return { suggestion: updated };
  });
}

/**
 * Decline a swap suggestion (captain action).
 */
export async function declineSuggestion(
  suggestionId: string,
  captainId: string,
  reason?: string
) {
  const [existing] = await db
    .select()
    .from(reservationSwaps)
    .where(eq(reservationSwaps.id, suggestionId));

  if (!existing) return { error: "Swap suggestion not found" };

  if (existing.approvalState !== "suggested") {
    return {
      error: `Cannot decline swap in "${existing.approvalState}" state. Only "suggested" swaps can be declined.`,
    };
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(reservationSwaps)
      .set({
        approvalState: "declined",
        decidedBy: captainId,
        decidedAt: new Date(),
        declineReason: reason ?? null,
      })
      .where(eq(reservationSwaps.id, suggestionId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: existing.tripId,
      eventType: "swap_declined",
      actorId: captainId,
      description: `Swap declined${reason ? `: ${reason}` : ""}`,
      metadata: {
        swapId: suggestionId,
        oldReservationId: existing.oldReservationId,
        declineReason: reason ?? null,
      },
    });

    return { suggestion: updated };
  });
}

/**
 * Get the swap policy for a trip.
 * Default is "captain_approval" (PRD Section 8.7).
 */
export async function getSwapPolicy(tripId: string) {
  const [trip] = await db
    .select({ swapPolicy: trips.swapPolicy })
    .from(trips)
    .where(eq(trips.id, tripId));

  if (!trip) return { error: "Trip not found" };

  return { swapPolicy: trip.swapPolicy as SwapPolicy };
}

/**
 * Update the swap policy for a trip (captain action).
 */
export async function updateSwapPolicy(tripId: string, policy: SwapPolicy) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(trips)
      .set({ swapPolicy: policy })
      .where(eq(trips.id, tripId))
      .returning();

    if (!updated) return { error: "Trip not found" };

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "swap_policy_changed",
      description: `Swap policy changed to "${policy}"`,
      metadata: { policy },
    });

    return { swapPolicy: updated.swapPolicy as SwapPolicy };
  });
}

/**
 * Get the freeze date for a trip.
 * After this date, no more swap suggestions will be generated.
 * Default: T-7 days before trip start (FR-35).
 */
export async function getFreezeDate(tripId: string) {
  const [trip] = await db
    .select({ freezeDate: trips.freezeDate, dateStart: trips.dateStart })
    .from(trips)
    .where(eq(trips.id, tripId));

  if (!trip) return { error: "Trip not found" };

  return {
    freezeDate: trip.freezeDate,
    dateStart: trip.dateStart,
  };
}

/**
 * Update the freeze date for a trip (captain action).
 */
export async function updateFreezeDate(tripId: string, freezeDate: string) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(trips)
      .set({ freezeDate })
      .where(eq(trips.id, tripId))
      .returning();

    if (!updated) return { error: "Trip not found" };

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "freeze_date_changed",
      description: `Freeze date set to ${freezeDate}`,
      metadata: { freezeDate },
    });

    return {
      freezeDate: updated.freezeDate,
      dateStart: updated.dateStart,
    };
  });
}

/**
 * Get the rebooking timeline for a trip (FR-39).
 *
 * Shows all approved/auto_approved swaps with before/after details
 * and rationale, ordered by decision date.
 */
export async function getRebookingTimeline(tripId: string) {
  // Get all executed swaps (approved or auto_approved)
  const swaps = await db
    .select()
    .from(reservationSwaps)
    .where(
      and(
        eq(reservationSwaps.tripId, tripId),
        inArray(reservationSwaps.approvalState, ["approved", "auto_approved"])
      )
    )
    .orderBy(desc(reservationSwaps.decidedAt));

  // Collect all reservation IDs for batch lookup
  const reservationIds = new Set<string>();
  for (const swap of swaps) {
    reservationIds.add(swap.oldReservationId);
    if (swap.newReservationId) {
      reservationIds.add(swap.newReservationId);
    }
  }

  // Batch fetch reservations
  let reservationMap: Record<string, typeof reservations.$inferSelect> = {};
  if (reservationIds.size > 0) {
    const allReservations = await db
      .select()
      .from(reservations)
      .where(inArray(reservations.id, Array.from(reservationIds)));

    reservationMap = Object.fromEntries(
      allReservations.map((r) => [r.id, r])
    );
  }

  // Build timeline entries with before/after details
  return swaps.map((swap) => ({
    id: swap.id,
    approvalState: swap.approvalState,
    recommendationReason: swap.recommendationReason,
    costDeltaPerGolfer: swap.costDeltaPerGolfer,
    qualityDelta: swap.qualityDelta,
    driveTimeDelta: swap.driveTimeDelta,
    cancellationPenalty: swap.cancellationPenalty,
    decidedAt: swap.decidedAt,
    decidedBy: swap.decidedBy,
    before: reservationMap[swap.oldReservationId] ?? null,
    after: swap.newReservationId
      ? reservationMap[swap.newReservationId] ?? null
      : null,
  }));
}
