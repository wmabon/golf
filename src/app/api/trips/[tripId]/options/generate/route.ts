import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as optionService from "@/services/trip/option.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const options = await optionService.generateShortlist(tripId);
  return NextResponse.json({ options });
}
