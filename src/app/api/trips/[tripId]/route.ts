import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import { updateTripSchema } from "@/lib/validation/trips";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const trip = await tripService.getTrip(tripId);
  if (!trip) return errorResponse("Trip not found", 404);

  return NextResponse.json({ trip });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, updateTripSchema);
  if ("error" in parsed) return parsed.error;

  const trip = await tripService.updateTrip(tripId, parsed.data);
  if (!trip) return errorResponse("Trip not found", 404);

  return NextResponse.json({ trip });
}
