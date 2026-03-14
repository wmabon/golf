import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as itineraryService from "@/services/trip/itinerary.service";
import { createItineraryItemSchema } from "@/lib/validation/itinerary";

type Params = { params: Promise<{ tripId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, createItineraryItemSchema);
  if ("error" in parsed) return parsed.error;

  const item = await itineraryService.createItem(
    tripId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ item }, { status: 201 });
}
