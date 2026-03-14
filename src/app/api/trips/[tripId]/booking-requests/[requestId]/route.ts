import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as bookingRequestService from "@/services/booking/booking-request.service";
import { updateBookingRequestSchema } from "@/lib/validation/booking";

type Params = { params: Promise<{ tripId: string; requestId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, requestId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const request = await bookingRequestService.getRequest(requestId);
  if (!request) return errorResponse("Booking request not found", 404);

  return NextResponse.json({ request });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, requestId } = await params;
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!isCaptain)
    return errorResponse("Only the captain can update booking requests", 403);

  const parsed = await parseBody(request, updateBookingRequestSchema);
  if ("error" in parsed) return parsed.error;

  const result = await bookingRequestService.updateRequest(
    requestId,
    parsed.data
  );
  if (!result) return errorResponse("Booking request not found", 404);
  if ("error" in result) return errorResponse(result.error as string, 409);

  return NextResponse.json(result);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, requestId } = await params;
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!isCaptain)
    return errorResponse("Only the captain can cancel booking requests", 403);

  const result = await bookingRequestService.cancelRequest(
    requestId,
    session!.user!.id!
  );
  if ("error" in result) return errorResponse(result.error as string, 409);

  return NextResponse.json(result);
}
