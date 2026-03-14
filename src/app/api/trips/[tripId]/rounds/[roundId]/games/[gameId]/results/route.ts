import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as gameService from "@/services/rounds/game.service";

type Params = {
  params: Promise<{ tripId: string; roundId: string; gameId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, gameId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const result = await gameService.calculateResults(gameId);
  if ("error" in result) return errorResponse(result.error as string, 404);

  return NextResponse.json(result);
}
