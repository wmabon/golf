import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as gameService from "@/services/rounds/game.service";
import { createGameSchema } from "@/lib/validation/rounds";

type Params = { params: Promise<{ tripId: string; roundId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const games = await gameService.listGames(roundId);
  return NextResponse.json({ games });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, createGameSchema);
  if ("error" in parsed) return parsed.error;

  const result = await gameService.createGame(
    roundId,
    session!.user!.id!,
    parsed.data
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result, { status: 201 });
}
