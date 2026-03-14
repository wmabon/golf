import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as roundService from "@/services/rounds/round.service";
import { createRoundSchema } from "@/lib/validation/rounds";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const rounds = await roundService.listRounds(tripId);
  return NextResponse.json({ rounds });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, createRoundSchema);
  if ("error" in parsed) return parsed.error;

  const round = await roundService.createRound(
    tripId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ round }, { status: 201 });
}
