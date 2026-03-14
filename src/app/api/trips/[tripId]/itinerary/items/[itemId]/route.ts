import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as itineraryService from "@/services/trip/itinerary.service";
import { updateItineraryItemSchema } from "@/lib/validation/itinerary";

type Params = { params: Promise<{ tripId: string; itemId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, itemId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, updateItineraryItemSchema);
  if ("error" in parsed) return parsed.error;

  const updated = await itineraryService.updateItem(
    itemId,
    session!.user!.id!,
    parsed.data
  );
  if (!updated) return errorResponse("Itinerary item not found", 404);

  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, itemId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const deleted = await itineraryService.deleteItem(
    itemId,
    session!.user!.id!
  );
  if (!deleted) return errorResponse("Itinerary item not found", 404);

  return NextResponse.json({ success: true });
}
