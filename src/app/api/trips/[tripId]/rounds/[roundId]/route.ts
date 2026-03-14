import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as roundService from "@/services/rounds/round.service";
import { updateRoundSchema } from "@/lib/validation/rounds";

type Params = { params: Promise<{ tripId: string; roundId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const round = await roundService.getRound(roundId);
  if (!round) return errorResponse("Round not found", 404);

  return NextResponse.json({ round });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, updateRoundSchema);
  if ("error" in parsed) return parsed.error;

  const result = await roundService.updateRound(roundId, parsed.data);
  if (!result) return errorResponse("Round not found", 404);
  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result);
}
