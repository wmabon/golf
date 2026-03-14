import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as betService from "@/services/rounds/bet.service";
import { resolveBetSchema } from "@/lib/validation/rounds";

type Params = {
  params: Promise<{ tripId: string; roundId: string; betId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, betId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain) return errorResponse("Only the captain can resolve bets", 403);

  const parsed = await parseBody(request, resolveBetSchema);
  if ("error" in parsed) return parsed.error;

  const result = await betService.resolveBet(
    betId,
    session!.user!.id!,
    parsed.data.outcome
  );
  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result);
}
