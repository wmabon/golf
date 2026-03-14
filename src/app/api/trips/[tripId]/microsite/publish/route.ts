import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as micrositeService from "@/services/media/microsite.service";

type Params = { params: Promise<{ tripId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain)
    return errorResponse("Only the captain can publish the microsite", 403);

  const result = await micrositeService.publishMicrosite(
    tripId,
    session!.user!.id!
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result);
}
