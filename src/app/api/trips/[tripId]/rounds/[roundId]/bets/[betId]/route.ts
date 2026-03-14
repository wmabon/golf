import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as betService from "@/services/rounds/bet.service";

type Params = {
  params: Promise<{ tripId: string; roundId: string; betId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, betId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const bet = await betService.getBet(betId);
  if (!bet) return errorResponse("Bet not found", 404);

  return NextResponse.json({ bet });
}
