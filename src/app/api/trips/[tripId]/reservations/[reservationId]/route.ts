import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as reservationService from "@/services/booking/reservation.service";

type Params = { params: Promise<{ tripId: string; reservationId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, reservationId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const reservation = await reservationService.getReservation(reservationId);
  if (!reservation) return errorResponse("Reservation not found", 404);

  return NextResponse.json({ reservation });
}
