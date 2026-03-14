import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reservations, type NewReservation } from "@/lib/db/schema";
import { validateTransition } from "./state-machines/reservation-sm";
import type { ReservationStatus, BookingSource } from "@/types";

/**
 * Create a confirmed reservation.
 */
export async function createReservation(data: {
  bookingRequestId: string;
  bookingSlotId?: string;
  tripId: string;
  courseId: string;
  confirmationNumber?: string;
  teeTime: Date;
  playerIds: string[];
  costPerPlayer?: string;
  totalCost?: string;
  bookingSource: BookingSource;
  cancellationDeadline?: Date;
  cancellationPenaltyAmount?: string;
  feeState?: string;
}) {
  const [reservation] = await db
    .insert(reservations)
    .values({
      bookingRequestId: data.bookingRequestId,
      bookingSlotId: data.bookingSlotId ?? null,
      tripId: data.tripId,
      courseId: data.courseId,
      confirmationNumber: data.confirmationNumber ?? null,
      teeTime: data.teeTime,
      playerIds: data.playerIds,
      costPerPlayer: data.costPerPlayer ?? null,
      totalCost: data.totalCost ?? null,
      bookingSource: data.bookingSource,
      status: "confirmed",
      cancellationDeadline: data.cancellationDeadline ?? null,
      cancellationPenaltyAmount: data.cancellationPenaltyAmount ?? null,
      feeState: data.feeState ?? null,
      statusChangedAt: new Date(),
    } satisfies NewReservation)
    .returning();

  return reservation;
}

/**
 * List all reservations for a trip, ordered by tee time.
 */
export async function listReservations(tripId: string) {
  return db
    .select()
    .from(reservations)
    .where(eq(reservations.tripId, tripId))
    .orderBy(reservations.teeTime);
}

/**
 * Get a single reservation by ID.
 */
export async function getReservation(reservationId: string) {
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, reservationId));

  return reservation ?? null;
}

/**
 * Cancel a reservation with state-machine validation.
 *
 * IMPORTANT (FR-36): Never call this speculatively.
 * Only cancel after a replacement reservation has been confirmed.
 */
export async function cancelReservation(reservationId: string) {
  const [existing] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, reservationId));

  if (!existing) return { error: "Reservation not found" };

  const result = validateTransition(
    existing.status as ReservationStatus,
    "canceled"
  );
  if (!result.valid) return { error: result.reason };

  const [updated] = await db
    .update(reservations)
    .set({
      status: "canceled",
      statusChangedAt: new Date(),
    })
    .where(eq(reservations.id, reservationId))
    .returning();

  return { reservation: updated };
}
