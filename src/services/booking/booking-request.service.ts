import { eq, and, ne, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookingRequests,
  bookingSlots,
  courseRules,
  activityFeedEntries,
  type NewBookingRequest,
} from "@/lib/db/schema";
import { getCourse } from "@/services/discovery/course.service";
import { validateTransition } from "./state-machines/booking-request-sm";
import { computePartySplit, computeTargetTimes } from "./party-split";
import { bookingQueue, JobNames } from "@/jobs/queues";
import type { BookingRequestStatus, BookingMode, AssignedToType } from "@/types";
import type { CreateBookingRequestInput } from "@/lib/validation/booking";

/**
 * Determine booking mode from course rule's booking channel.
 * If the channel is null or phone_only, use assisted mode.
 */
function determineMode(bookingChannel: string | null): BookingMode {
  if (!bookingChannel || bookingChannel === "phone_only") {
    return "assisted";
  }
  if (bookingChannel === "direct_api") {
    return "direct";
  }
  return "guided_checkout";
}

/**
 * Determine who/what handles booking based on mode.
 */
function determineAssignedToType(mode: BookingMode): AssignedToType {
  switch (mode) {
    case "assisted":
      return "concierge";
    case "direct":
      return "automation";
    case "guided_checkout":
      return "user";
  }
}

/**
 * Create a new booking request with party split and slots.
 */
export async function createRequest(
  tripId: string,
  userId: string,
  data: CreateBookingRequestInput
) {
  const course = await getCourse(data.courseId);
  if (!course) {
    return { error: "Course not found" };
  }

  // Get course rules for maxPlayers and bookingChannel
  const [rule] = await db
    .select()
    .from(courseRules)
    .where(eq(courseRules.courseId, data.courseId));

  const maxPlayers = rule?.maxPlayers ?? 4;
  const bookingChannel = rule?.bookingChannel ?? null;
  const mode = determineMode(bookingChannel);
  const assignedToType = determineAssignedToType(mode);

  // Compute party split and target times
  const groups = computePartySplit(data.numGolfers, maxPlayers);
  const baseTime = data.preferredTime ?? data.targetTimeRange.earliest;
  const targetTimes = computeTargetTimes(baseTime, groups);

  // Compute booking window opens date if booking window days is set
  let bookingWindowOpensAt: Date | null = null;
  if (rule?.bookingWindowDays) {
    const targetDate = new Date(data.targetDate + "T00:00:00Z");
    bookingWindowOpensAt = new Date(
      targetDate.getTime() - rule.bookingWindowDays * 24 * 60 * 60 * 1000
    );
  }

  return db.transaction(async (tx) => {
    const [request] = await tx
      .insert(bookingRequests)
      .values({
        tripId,
        courseId: data.courseId,
        targetDate: data.targetDate,
        targetTimeRange: data.targetTimeRange,
        preferredTime: data.preferredTime ?? null,
        numGolfers: data.numGolfers,
        partySplit: groups,
        mode,
        status: "candidate",
        bookingWindowOpensAt,
        createdBy: userId,
        assignedToType,
        notes: data.notes ?? null,
        statusChangedAt: new Date(),
      } satisfies NewBookingRequest)
      .returning();

    // Create booking slots for each group
    const slotValues = groups.map((_, index) => ({
      bookingRequestId: request.id,
      groupNum: index + 1,
      targetTime: targetTimes[index] ?? null,
      status: "pending" as const,
      assignedToType,
    }));

    const slots = await tx
      .insert(bookingSlots)
      .values(slotValues)
      .returning();

    // If assisted mode, queue an ops work item
    if (mode === "assisted") {
      await bookingQueue.add(JobNames.ASSISTED_BOOKING_PROCESS, {
        requestId: request.id,
        tripId,
        courseId: data.courseId,
        courseName: course.name,
        targetDate: data.targetDate,
        targetTimeRange: data.targetTimeRange,
        numGolfers: data.numGolfers,
        partySplit: groups,
      });
    }

    // Log to activity feed
    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "booking_request_created",
      actorId: userId,
      description: `Booking request created for ${course.name}`,
      metadata: {
        requestId: request.id,
        courseId: data.courseId,
        targetDate: data.targetDate,
        mode,
        partySplit: groups,
      },
    });

    return { request: { ...request, slots } };
  });
}

/**
 * Get a single booking request with its slots.
 */
export async function getRequest(requestId: string) {
  const [request] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.id, requestId));

  if (!request) return null;

  const slots = await db
    .select()
    .from(bookingSlots)
    .where(eq(bookingSlots.bookingRequestId, requestId));

  return { ...request, slots };
}

/**
 * List all booking requests for a trip, ordered by target date.
 */
export async function listRequests(tripId: string) {
  const requests = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.tripId, tripId))
    .orderBy(bookingRequests.targetDate);

  if (requests.length === 0) return [];

  // Batch-fetch all slots for these requests
  const requestIds = requests.map((r) => r.id);
  const slots = await db
    .select()
    .from(bookingSlots)
    .where(inArray(bookingSlots.bookingRequestId, requestIds));

  // Group slots by request ID
  const slotsByRequest = new Map<string, typeof slots>();
  for (const slot of slots) {
    const existing = slotsByRequest.get(slot.bookingRequestId) ?? [];
    existing.push(slot);
    slotsByRequest.set(slot.bookingRequestId, existing);
  }

  return requests.map((r) => ({
    ...r,
    slots: slotsByRequest.get(r.id) ?? [],
  }));
}

/**
 * Update a booking request (captain only, pre-booking states only).
 */
export async function updateRequest(
  requestId: string,
  data: Partial<CreateBookingRequestInput>
) {
  const [existing] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.id, requestId));

  if (!existing) return null;

  // Only allow updates in candidate or window_pending states
  const editableStates: BookingRequestStatus[] = [
    "candidate",
    "window_pending",
  ];
  if (!editableStates.includes(existing.status as BookingRequestStatus)) {
    return {
      error: `Cannot update booking request in "${existing.status}" state`,
    };
  }

  const updateData: Record<string, unknown> = {};
  if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;
  if (data.targetTimeRange !== undefined)
    updateData.targetTimeRange = data.targetTimeRange;
  if (data.preferredTime !== undefined)
    updateData.preferredTime = data.preferredTime;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // If numGolfers changed, recompute party split
  if (data.numGolfers !== undefined && data.numGolfers !== existing.numGolfers) {
    const [rule] = await db
      .select()
      .from(courseRules)
      .where(eq(courseRules.courseId, existing.courseId));

    const maxPlayers = rule?.maxPlayers ?? 4;
    const groups = computePartySplit(data.numGolfers, maxPlayers);
    updateData.numGolfers = data.numGolfers;
    updateData.partySplit = groups;
  }

  if (Object.keys(updateData).length === 0) {
    return { request: existing };
  }

  const [updated] = await db
    .update(bookingRequests)
    .set(updateData)
    .where(eq(bookingRequests.id, requestId))
    .returning();

  return { request: updated };
}

/**
 * Cancel a booking request with state-machine validation.
 */
export async function cancelRequest(requestId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.id, requestId));

  if (!existing) return { error: "Booking request not found" };

  const result = validateTransition(
    existing.status as BookingRequestStatus,
    "canceled"
  );
  if (!result.valid) return { error: result.reason };

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(bookingRequests)
      .set({
        status: "canceled",
        statusChangedAt: new Date(),
      })
      .where(eq(bookingRequests.id, requestId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: existing.tripId,
      eventType: "booking_request_canceled",
      actorId: userId,
      description: `Booking request canceled`,
      metadata: {
        requestId,
        previousStatus: existing.status,
      },
    });

    return { request: updated };
  });
}

/**
 * Get the booking room state for a trip.
 * Aggregates all active requests with their slots and computes countdowns.
 */
export async function getBookingRoomState(tripId: string) {
  const requests = await db
    .select()
    .from(bookingRequests)
    .where(
      and(
        eq(bookingRequests.tripId, tripId),
        ne(bookingRequests.status, "canceled"),
        ne(bookingRequests.status, "played")
      )
    )
    .orderBy(bookingRequests.targetDate);

  if (requests.length === 0) {
    return { requests: [], summary: { total: 0, booked: 0, pending: 0 } };
  }

  // Batch-fetch slots
  const requestIds = requests.map((r) => r.id);
  const allSlots = await db
    .select()
    .from(bookingSlots)
    .where(inArray(bookingSlots.bookingRequestId, requestIds));

  const slotsByRequest = new Map<string, typeof allSlots>();
  for (const slot of allSlots) {
    const existing = slotsByRequest.get(slot.bookingRequestId) ?? [];
    existing.push(slot);
    slotsByRequest.set(slot.bookingRequestId, existing);
  }

  const now = new Date();

  const enrichedRequests = requests.map((r) => {
    const slots = slotsByRequest.get(r.id) ?? [];

    // Compute countdown to booking window open
    let countdownSeconds: number | null = null;
    if (r.bookingWindowOpensAt) {
      const diff = r.bookingWindowOpensAt.getTime() - now.getTime();
      countdownSeconds = diff > 0 ? Math.floor(diff / 1000) : 0;
    }

    return {
      ...r,
      slots,
      countdownSeconds,
    };
  });

  const booked = enrichedRequests.filter((r) => r.status === "booked").length;
  const pending = enrichedRequests.filter(
    (r) => !["booked", "locked"].includes(r.status)
  ).length;

  return {
    requests: enrichedRequests,
    summary: {
      total: enrichedRequests.length,
      booked,
      pending,
    },
  };
}
