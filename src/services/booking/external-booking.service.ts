import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  externalBookings,
  activityFeedEntries,
  type NewExternalBooking,
} from "@/lib/db/schema";
import type { CaptureExternalBookingInput } from "@/lib/validation/booking";

/**
 * Create an external booking record (user-captured booking from outside the platform).
 */
export async function createExternalBooking(
  tripId: string,
  userId: string,
  data: CaptureExternalBookingInput
) {
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .insert(externalBookings)
      .values({
        tripId,
        type: data.type,
        source: data.source ?? null,
        confirmationNumber: data.confirmationNumber ?? null,
        date: data.date,
        time: data.time ?? null,
        cost: data.cost?.toString() ?? null,
        bookingContact: data.bookingContact ?? null,
        notes: data.notes ?? null,
        linkUrl: data.linkUrl ?? null,
        createdBy: userId,
      } satisfies NewExternalBooking)
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "external_booking_created",
      actorId: userId,
      description: `External ${data.type} booking added`,
      metadata: {
        bookingId: booking.id,
        type: data.type,
        date: data.date,
      },
    });

    return booking;
  });
}

/**
 * List all external bookings for a trip, ordered by date.
 */
export async function listExternalBookings(tripId: string) {
  return db
    .select()
    .from(externalBookings)
    .where(eq(externalBookings.tripId, tripId))
    .orderBy(externalBookings.date);
}

/**
 * Update an external booking. Only the creator can update.
 */
export async function updateExternalBooking(
  bookingId: string,
  userId: string,
  data: Partial<CaptureExternalBookingInput>
) {
  const [existing] = await db
    .select()
    .from(externalBookings)
    .where(
      and(
        eq(externalBookings.id, bookingId),
        eq(externalBookings.createdBy, userId)
      )
    );

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.source !== undefined) updateData.source = data.source;
  if (data.confirmationNumber !== undefined)
    updateData.confirmationNumber = data.confirmationNumber;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.time !== undefined) updateData.time = data.time;
  if (data.cost !== undefined)
    updateData.cost = data.cost?.toString() ?? null;
  if (data.bookingContact !== undefined)
    updateData.bookingContact = data.bookingContact;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const [updated] = await db
    .update(externalBookings)
    .set(updateData)
    .where(eq(externalBookings.id, bookingId))
    .returning();

  return updated;
}

/**
 * Delete an external booking. Only the creator can delete.
 */
export async function deleteExternalBooking(
  bookingId: string,
  userId: string
) {
  const [existing] = await db
    .select()
    .from(externalBookings)
    .where(
      and(
        eq(externalBookings.id, bookingId),
        eq(externalBookings.createdBy, userId)
      )
    );

  if (!existing) return null;

  await db
    .delete(externalBookings)
    .where(eq(externalBookings.id, bookingId));

  return existing;
}
