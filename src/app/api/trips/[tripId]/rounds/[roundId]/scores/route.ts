import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as scoreService from "@/services/rounds/score.service";
import { batchScoreSchema } from "@/lib/validation/rounds";

type Params = { params: Promise<{ tripId: string; roundId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const scores = await scoreService.getScores(roundId);
  return NextResponse.json({ scores });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, roundId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, batchScoreSchema);
  if ("error" in parsed) return parsed.error;

  const scores = await scoreService.batchUpsertScores(
    roundId,
    parsed.data.playerId,
    parsed.data.entries
  );

  return NextResponse.json({ scores });
}
