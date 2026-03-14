import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as bookingRequestService from "@/services/booking/booking-request.service";
import { createBookingRequestSchema } from "@/lib/validation/booking";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const requests = await bookingRequestService.listRequests(tripId);
  return NextResponse.json({ requests });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, createBookingRequestSchema);
  if ("error" in parsed) return parsed.error;

  const result = await bookingRequestService.createRequest(
    tripId,
    session!.user!.id!,
    parsed.data
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result, { status: 201 });
}
