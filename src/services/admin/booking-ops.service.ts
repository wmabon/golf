import { eq, and, isNull, sql, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookingRequests,
  bookingSlots,
  reservations,
  trips,
  courses,
  tripMembers,
  activityFeedEntries,
  feeCharges,
  feeSchedules,
} from "@/lib/db/schema";
import { validateTransition } from "@/services/booking/state-machines/booking-request-sm";
import type {
  AttachConfirmationInput,
  AddNoteInput,
} from "@/lib/validation/admin-booking";
import type { BookingRequestStatus } from "@/types";

// ---------------------------------------------------------------------------
// listPendingRequests
// ---------------------------------------------------------------------------

export async function listPendingRequests(filters?: {
  status?: string;
  assignedTo?: string;
}) {
  const conditions = [];

  if (filters?.status) {
    conditions.push(
      eq(bookingRequests.status, filters.status as BookingRequestStatus)
    );
  } else {
    // Default: show actionable requests (requested/partial_hold or anything assigned that isn't terminal)
    conditions.push(
      sql`(${bookingRequests.status} IN ('requested', 'partial_hold') OR (${bookingRequests.assignedTo} IS NOT NULL AND ${bookingRequests.status} NOT IN ('booked', 'canceled', 'played')))`
    );
  }

  if (filters?.assignedTo) {
    conditions.push(eq(bookingRequests.assignedTo, filters.assignedTo));
  }

  const rows = await db
    .select({
      id: bookingRequests.id,
      tripId: bookingRequests.tripId,
      courseId: bookingRequests.courseId,
      targetDate: bookingRequests.targetDate,
      targetTimeRange: bookingRequests.targetTimeRange,
      preferredTime: bookingRequests.preferredTime,
      numGolfers: bookingRequests.numGolfers,
      mode: bookingRequests.mode,
      status: bookingRequests.status,
      bookingWindowOpensAt: bookingRequests.bookingWindowOpensAt,
      assignedTo: bookingRequests.assignedTo,
      assignedToType: bookingRequests.assignedToType,
      notes: bookingRequests.notes,
      statusChangedAt: bookingRequests.statusChangedAt,
      createdAt: bookingRequests.createdAt,
      tripName: trips.name,
      tripDateStart: trips.dateStart,
      tripDateEnd: trips.dateEnd,
      courseName: courses.name,
      courseCity: courses.city,
      courseState: courses.state,
    })
    .from(bookingRequests)
    .innerJoin(trips, eq(bookingRequests.tripId, trips.id))
    .innerJoin(courses, eq(bookingRequests.courseId, courses.id))
    .where(and(...conditions))
    .orderBy(sql`${bookingRequests.bookingWindowOpensAt} ASC NULLS LAST`);

  return rows;
}

// ---------------------------------------------------------------------------
// getRequestDetail
// ---------------------------------------------------------------------------

export async function getRequestDetail(requestId: string) {
  // Fetch the booking request with trip and course context
  const [request] = await db
    .select({
      id: bookingRequests.id,
      tripId: bookingRequests.tripId,
      courseId: bookingRequests.courseId,
      targetDate: bookingRequests.targetDate,
      targetTimeRange: bookingRequests.targetTimeRange,
      preferredTime: bookingRequests.preferredTime,
      numGolfers: bookingRequests.numGolfers,
      partySplit: bookingRequests.partySplit,
      mode: bookingRequests.mode,
      status: bookingRequests.status,
      bookingWindowOpensAt: bookingRequests.bookingWindowOpensAt,
      createdBy: bookingRequests.createdBy,
      assignedTo: bookingRequests.assignedTo,
      assignedToType: bookingRequests.assignedToType,
      notes: bookingRequests.notes,
      statusChangedAt: bookingRequests.statusChangedAt,
      createdAt: bookingRequests.createdAt,
      updatedAt: bookingRequests.updatedAt,
      tripName: trips.name,
      tripDateStart: trips.dateStart,
      tripDateEnd: trips.dateEnd,
      tripStatus: trips.status,
      courseName: courses.name,
      courseCity: courses.city,
      courseState: courses.state,
      courseAccessType: courses.accessType,
    })
    .from(bookingRequests)
    .innerJoin(trips, eq(bookingRequests.tripId, trips.id))
    .innerJoin(courses, eq(bookingRequests.courseId, courses.id))
    .where(eq(bookingRequests.id, requestId));

  if (!request) return null;

  // Fetch all slots for this request
  const slots = await db
    .select()
    .from(bookingSlots)
    .where(eq(bookingSlots.bookingRequestId, requestId));

  // Fetch trip members for context
  const members = await db
    .select({
      id: tripMembers.id,
      userId: tripMembers.userId,
      role: tripMembers.role,
      responseStatus: tripMembers.responseStatus,
    })
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, request.tripId),
        eq(tripMembers.responseStatus, "accepted")
      )
    );

  return { ...request, slots, members };
}

// ---------------------------------------------------------------------------
// assignRequest
// ---------------------------------------------------------------------------

export async function assignRequest(requestId: string, conciergeId: string) {
  const [request] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.id, requestId));

  if (!request) return { error: "Booking request not found" };

  const now = new Date();
  const noteEntry = `[${now.toISOString()}] Assigned to concierge ${conciergeId}`;
  const existingNotes = request.notes ? `${request.notes}\n${noteEntry}` : noteEntry;

  // If status is still early-stage, transition to 'requested'
  const updates: Record<string, unknown> = {
    assignedTo: conciergeId,
    assignedToType: "concierge" as const,
    notes: existingNotes,
  };

  if (request.status === "candidate" || request.status === "window_pending") {
    const transition = validateTransition(request.status, "requested");
    if (!transition.valid) {
      return { error: transition.reason };
    }
    updates.status = "requested";
    updates.statusChangedAt = now;
  }

  const [updated] = await db
    .update(bookingRequests)
    .set(updates)
    .where(eq(bookingRequests.id, requestId))
    .returning();

  await db.insert(activityFeedEntries).values({
    tripId: request.tripId,
    eventType: "booking_request_assigned",
    actorId: conciergeId,
    description: `Booking request assigned to concierge`,
    metadata: {
      bookingRequestId: requestId,
      conciergeId,
      previousStatus: request.status,
      newStatus: updates.status ?? request.status,
    },
  } satisfies typeof activityFeedEntries.$inferInsert);

  return { request: updated };
}

// ---------------------------------------------------------------------------
// addNote
// ---------------------------------------------------------------------------

export async function addNote(
  requestId: string,
  conciergeId: string,
  data: AddNoteInput
) {
  const [request] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.id, requestId));

  if (!request) return { error: "Booking request not found" };

  const now = new Date();
  const noteEntry = `[${now.toISOString()}] (${conciergeId}) ${data.note}`;
  const existingNotes = request.notes
    ? `${request.notes}\n${noteEntry}`
    : noteEntry;

  const [updated] = await db
    .update(bookingRequests)
    .set({ notes: existingNotes })
    .where(eq(bookingRequests.id, requestId))
    .returning();

  await db.insert(activityFeedEntries).values({
    tripId: request.tripId,
    eventType: "booking_request_note_added",
    actorId: conciergeId,
    description: `Note added to booking request`,
    metadata: {
      bookingRequestId: requestId,
      notePreview: data.note.slice(0, 200),
    },
  } satisfies typeof activityFeedEntries.$inferInsert);

  return { request: updated };
}

// ---------------------------------------------------------------------------
// updateStatus
// ---------------------------------------------------------------------------

export async function updateStatus(
  requestId: string,
  conciergeId: string,
  newStatus: BookingRequestStatus
) {
  const [request] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.id, requestId));

  if (!request) return { error: "Booking request not found" };

  const transition = validateTransition(request.status, newStatus);
  if (!transition.valid) {
    return { error: transition.reason };
  }

  const now = new Date();
  const [updated] = await db
    .update(bookingRequests)
    .set({
      status: newStatus,
      statusChangedAt: now,
    })
    .where(eq(bookingRequests.id, requestId))
    .returning();

  await db.insert(activityFeedEntries).values({
    tripId: request.tripId,
    eventType: "booking_request_status_changed",
    actorId: conciergeId,
    description: `Booking request status changed from ${request.status} to ${newStatus}`,
    metadata: {
      bookingRequestId: requestId,
      previousStatus: request.status,
      newStatus,
    },
  } satisfies typeof activityFeedEntries.$inferInsert);

  return { request: updated };
}

// ---------------------------------------------------------------------------
// attachConfirmation  (CRITICAL - transactional)
// ---------------------------------------------------------------------------

export async function attachConfirmation(
  requestId: string,
  conciergeId: string,
  data: AttachConfirmationInput
) {
  const [request] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.id, requestId));

  if (!request) return { error: "Booking request not found" };

  if (request.status !== "requested" && request.status !== "partial_hold") {
    return {
      error: `Cannot attach confirmation to request in "${request.status}" state. Must be "requested" or "partial_hold".`,
    };
  }

  // Find the trip captain for fee charge
  const [captain] = await db
    .select({ userId: tripMembers.userId })
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, request.tripId),
        eq(tripMembers.role, "captain"),
        eq(tripMembers.responseStatus, "accepted")
      )
    );

  // Fall back to createdBy if no captain found
  const feeUserId = captain?.userId ?? request.createdBy;

  return db.transaction(async (tx) => {
    const createdReservations = [];

    for (const slotData of data.slots) {
      // Verify slot belongs to this request
      const [slot] = await tx
        .select()
        .from(bookingSlots)
        .where(
          and(
            eq(bookingSlots.id, slotData.slotId),
            eq(bookingSlots.bookingRequestId, requestId)
          )
        );

      if (!slot) {
        throw new Error(
          `Slot ${slotData.slotId} not found for request ${requestId}`
        );
      }

      // Update booking slot
      await tx
        .update(bookingSlots)
        .set({
          status: "confirmed",
          confirmationNumber: slotData.confirmationNumber,
          confirmedTeeTime: new Date(slotData.confirmedTeeTime),
        })
        .where(eq(bookingSlots.id, slotData.slotId));

      // Create reservation
      const [reservation] = await tx
        .insert(reservations)
        .values({
          bookingRequestId: requestId,
          bookingSlotId: slotData.slotId,
          tripId: request.tripId,
          courseId: request.courseId,
          confirmationNumber: slotData.confirmationNumber,
          teeTime: new Date(slotData.confirmedTeeTime),
          playerIds: slot.playerIds ?? [],
          costPerPlayer: slotData.costPerPlayer != null
            ? String(slotData.costPerPlayer)
            : null,
          totalCost: slotData.totalCost != null
            ? String(slotData.totalCost)
            : null,
          bookingSource: "assisted",
          status: "confirmed",
        } satisfies typeof reservations.$inferInsert)
        .returning();

      createdReservations.push(reservation);
    }

    // Check if ALL slots for this request are now confirmed
    const allSlots = await tx
      .select({ id: bookingSlots.id, status: bookingSlots.status })
      .from(bookingSlots)
      .where(eq(bookingSlots.bookingRequestId, requestId));

    const allConfirmed = allSlots.every((s) => s.status === "confirmed");
    const newStatus: BookingRequestStatus = allConfirmed
      ? "booked"
      : "partial_hold";

    // Update booking request status
    const now = new Date();
    const [updatedRequest] = await tx
      .update(bookingRequests)
      .set({
        status: newStatus,
        statusChangedAt: now,
      })
      .where(eq(bookingRequests.id, requestId))
      .returning();

    // Create fee charge based on active fee schedule
    const totalCostSum = data.slots.reduce(
      (sum, s) => sum + (s.totalCost ?? 0),
      0
    );

    if (totalCostSum > 0) {
      // Look up active fee schedule for tee_time_service
      const [schedule] = await tx
        .select()
        .from(feeSchedules)
        .where(
          and(
            eq(feeSchedules.feeType, "tee_time_service"),
            lte(feeSchedules.effectiveFrom, now),
            sql`(${feeSchedules.effectiveTo} IS NULL OR ${feeSchedules.effectiveTo} > ${now})`
          )
        )
        .orderBy(sql`${feeSchedules.effectiveFrom} DESC`)
        .limit(1);

      if (schedule) {
        let feeAmount: number;

        if (schedule.calculationMethod === "flat") {
          feeAmount = Number(schedule.flatAmount ?? 0);
        } else {
          // percentage
          feeAmount = totalCostSum * Number(schedule.percentageRate ?? 0);
          // Apply per-golfer cap if set
          if (schedule.perGolferCap != null) {
            const maxFee =
              Number(schedule.perGolferCap) * request.numGolfers;
            feeAmount = Math.min(feeAmount, maxFee);
          }
        }

        // Round to 2 decimal places
        feeAmount = Math.round(feeAmount * 100) / 100;

        if (feeAmount > 0) {
          await tx.insert(feeCharges).values({
            tripId: request.tripId,
            userId: feeUserId,
            feeType: "tee_time_service",
            sourceObjectType: "reservation",
            sourceObjectId: createdReservations[0].id,
            feeScheduleId: schedule.id,
            amount: String(feeAmount),
            status: "pending",
          } satisfies typeof feeCharges.$inferInsert);
        }
      }
    }

    // Log to activity feed
    await tx.insert(activityFeedEntries).values({
      tripId: request.tripId,
      eventType: "booking_confirmed",
      actorId: conciergeId,
      description: `Booking confirmed by concierge — ${createdReservations.length} slot(s) confirmed, status: ${newStatus}`,
      metadata: {
        bookingRequestId: requestId,
        reservationIds: createdReservations.map((r) => r.id),
        slotsConfirmed: data.slots.length,
        totalSlots: allSlots.length,
        newStatus,
        totalCost: totalCostSum,
      },
    } satisfies typeof activityFeedEntries.$inferInsert);

    return {
      request: updatedRequest,
      reservations: createdReservations,
    };
  });
}

// ---------------------------------------------------------------------------
// listEscalated
// ---------------------------------------------------------------------------

export async function listEscalated() {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: bookingRequests.id,
      tripId: bookingRequests.tripId,
      courseId: bookingRequests.courseId,
      targetDate: bookingRequests.targetDate,
      targetTimeRange: bookingRequests.targetTimeRange,
      numGolfers: bookingRequests.numGolfers,
      mode: bookingRequests.mode,
      status: bookingRequests.status,
      bookingWindowOpensAt: bookingRequests.bookingWindowOpensAt,
      notes: bookingRequests.notes,
      createdAt: bookingRequests.createdAt,
      tripName: trips.name,
      courseName: courses.name,
      courseCity: courses.city,
      courseState: courses.state,
    })
    .from(bookingRequests)
    .innerJoin(trips, eq(bookingRequests.tripId, trips.id))
    .innerJoin(courses, eq(bookingRequests.courseId, courses.id))
    .where(
      and(
        isNull(bookingRequests.assignedTo),
        eq(bookingRequests.status, "requested"),
        lte(bookingRequests.createdAt, fourHoursAgo)
      )
    )
    .orderBy(sql`${bookingRequests.createdAt} ASC`);

  return rows;
}
