import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as betService from "@/services/rounds/bet.service";

type Params = {
  params: Promise<{ tripId: string; roundId: string; betId: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, betId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const result = await betService.acceptBet(betId, session!.user!.id!);
  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result);
}
