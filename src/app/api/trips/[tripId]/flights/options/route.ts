import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as travelService from "@/services/travel/travel.service";
import { saveFlightOptionSchema } from "@/lib/validation/travel";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const options = await travelService.listFlightOptions(tripId);
  return NextResponse.json({ options });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, saveFlightOptionSchema);
  if ("error" in parsed) return parsed.error;

  const option = await travelService.saveFlightOption(
    tripId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ option }, { status: 201 });
}
