import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as externalBookingService from "@/services/booking/external-booking.service";
import { captureExternalBookingSchema } from "@/lib/validation/booking";

type Params = { params: Promise<{ tripId: string; bookingId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, bookingId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(
    request,
    captureExternalBookingSchema.partial()
  );
  if ("error" in parsed) return parsed.error;

  const booking = await externalBookingService.updateExternalBooking(
    bookingId,
    session!.user!.id!,
    parsed.data
  );
  if (!booking)
    return errorResponse(
      "External booking not found or you are not the creator",
      404
    );

  return NextResponse.json({ booking });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, bookingId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const deleted = await externalBookingService.deleteExternalBooking(
    bookingId,
    session!.user!.id!
  );
  if (!deleted)
    return errorResponse(
      "External booking not found or you are not the creator",
      404
    );

  return NextResponse.json({ success: true });
}
