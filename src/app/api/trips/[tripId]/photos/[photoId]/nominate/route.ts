import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as consentService from "@/services/media/consent.service";

type Params = { params: Promise<{ tripId: string; photoId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, photoId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const result = await consentService.nominateForPublication(
    photoId,
    session!.user!.id!
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result);
}
