import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as voteService from "@/services/trip/vote.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; optionId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, optionId } = await params;
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!isCaptain)
    return errorResponse("Only the captain can override voting", 403);

  const result = await voteService.captainOverride(
    tripId,
    optionId,
    session!.user!.id!
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json({
    option: result.option,
    voteSummary: result.voteSummary,
  });
}
