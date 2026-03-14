import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
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

  const game = await gameService.getGame(gameId);
  if (!game) return errorResponse("Game not found", 404);

  return NextResponse.json({ game });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, gameId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const result = await gameService.updateGame(gameId, body as Parameters<typeof gameService.updateGame>[1]);
  if (!result) return errorResponse("Game not found", 404);

  return NextResponse.json(result);
}
