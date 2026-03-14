import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as roundService from "@/services/rounds/round.service";

type Params = { params: Promise<{ tripId: string; roundId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain) return errorResponse("Only the captain can finalize a round", 403);

  const result = await roundService.finalizeRound(roundId, session!.user!.id!);
  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result);
}
