import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as betService from "@/services/rounds/bet.service";
import { createBetSchema } from "@/lib/validation/rounds";

type Params = { params: Promise<{ tripId: string; roundId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const bets = await betService.listBets(tripId, roundId);
  return NextResponse.json({ bets });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, createBetSchema);
  if ("error" in parsed) return parsed.error;

  // Default roundId from the URL if not provided in body
  const betData = {
    ...parsed.data,
    roundId: parsed.data.roundId ?? roundId,
  };

  const result = await betService.createBet(
    tripId,
    session!.user!.id!,
    betData
  );

  return NextResponse.json(result, { status: 201 });
}
