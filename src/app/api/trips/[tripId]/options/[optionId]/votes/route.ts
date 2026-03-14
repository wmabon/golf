import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as voteService from "@/services/trip/vote.service";
import { castVoteSchema } from "@/lib/validation/trips";

type Params = { params: Promise<{ tripId: string; optionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, optionId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, castVoteSchema);
  if ("error" in parsed) return parsed.error;

  const result = await voteService.castVote(
    optionId,
    session!.user!.id!,
    parsed.data
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json({ vote: result.vote }, { status: 201 });
}

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const { optionId } = await params;
  const votes = await voteService.listVotes(optionId);
  return NextResponse.json({ votes });
}
