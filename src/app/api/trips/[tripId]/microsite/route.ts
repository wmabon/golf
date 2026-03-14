import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as micrositeService from "@/services/media/microsite.service";
import { updateMicrositeSchema } from "@/lib/validation/media";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const microsite = await micrositeService.getMicrosite(tripId);
  return NextResponse.json({ microsite });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain)
    return errorResponse("Only the captain can update the microsite", 403);

  const parsed = await parseBody(request, updateMicrositeSchema);
  if ("error" in parsed) return parsed.error;

  const microsite = await micrositeService.createOrUpdateMicrosite(
    tripId,
    parsed.data
  );

  return NextResponse.json({ microsite });
}
