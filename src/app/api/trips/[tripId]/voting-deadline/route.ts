import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as voteService from "@/services/trip/vote.service";
import { setVotingDeadlineSchema } from "@/lib/validation/trips";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!isCaptain)
    return errorResponse("Only the captain can set the voting deadline", 403);

  const parsed = await parseBody(request, setVotingDeadlineSchema);
  if ("error" in parsed) return parsed.error;

  const result = await voteService.setVotingDeadline(
    tripId,
    parsed.data.deadline
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json({ trip: result.trip });
}
