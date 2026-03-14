import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as externalBookingService from "@/services/booking/external-booking.service";
import { captureExternalBookingSchema } from "@/lib/validation/booking";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const bookings = await externalBookingService.listExternalBookings(tripId);
  return NextResponse.json({ bookings });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, captureExternalBookingSchema);
  if ("error" in parsed) return parsed.error;

  const booking = await externalBookingService.createExternalBooking(
    tripId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ booking }, { status: 201 });
}
