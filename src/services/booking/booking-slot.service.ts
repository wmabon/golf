import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookingSlots, type NewBookingSlot } from "@/lib/db/schema";
import type { BookingSlotStatus, AssignedToType } from "@/types";

/**
 * Create booking slots for each group in a party split.
 *
 * @param requestId - The booking request these slots belong to
 * @param groups - Array of group sizes from computePartySplit
 * @param targetTimes - Array of target times from computeTargetTimes
 * @param assignedToType - Who/what is responsible for booking each slot
 */
export async function createSlotsForRequest(
  requestId: string,
  groups: number[],
  targetTimes: string[],
  assignedToType?: AssignedToType
) {
  const slotValues: NewBookingSlot[] = groups.map((_, index) => ({
    bookingRequestId: requestId,
    groupNum: index + 1,
    targetTime: targetTimes[index] ?? null,
    status: "pending" as const,
    assignedToType: assignedToType ?? null,
  }));

  const inserted = await db
    .insert(bookingSlots)
    .values(slotValues)
    .returning();

  return inserted;
}

/**
 * Update a booking slot's status with state-machine validation.
 *
 * @param slotId - The slot to update
 * @param newStatus - Target status
 * @param updates - Additional fields to update alongside the status change
 */
export async function updateSlotStatus(
  slotId: string,
  newStatus: BookingSlotStatus,
  updates?: Partial<{
    assignedToType: AssignedToType;
    assignedToId: string;
    holdExpiresAt: Date;
    confirmationNumber: string;
    confirmedTeeTime: Date;
    playerIds: string[];
  }>
) {
  const [existing] = await db
    .select()
    .from(bookingSlots)
    .where(eq(bookingSlots.id, slotId));

  if (!existing) return { error: "Booking slot not found" };

  // Booking slot status uses a simplified validation:
  // pending -> attempting -> held -> confirmed
  // pending -> attempting -> failed
  // held -> released
  // Any non-terminal state -> failed
  const slotTransitions: Record<BookingSlotStatus, BookingSlotStatus[]> = {
    pending: ["attempting", "confirmed", "failed"],
    attempting: ["held", "confirmed", "failed"],
    held: ["confirmed", "released", "failed"],
    confirmed: [],
    failed: [],
    released: [],
  };

  const allowed = slotTransitions[existing.status as BookingSlotStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return {
      error: `Cannot transition slot from "${existing.status}" to "${newStatus}". Valid transitions: ${allowed.join(", ")}`,
    };
  }

  const [updated] = await db
    .update(bookingSlots)
    .set({
      status: newStatus,
      ...updates,
    })
    .where(eq(bookingSlots.id, slotId))
    .returning();

  return { slot: updated };
}

/**
 * Get all slots for a booking request.
 */
export async function getSlotsForRequest(requestId: string) {
  return db
    .select()
    .from(bookingSlots)
    .where(eq(bookingSlots.bookingRequestId, requestId));
}
