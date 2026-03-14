import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as swapService from "@/services/optimization/swap-suggestion.service";

type Params = { params: Promise<{ tripId: string; suggestionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, suggestionId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain) return errorResponse("Only the captain can approve swaps", 403);

  const result = await swapService.approveSuggestion(
    suggestionId,
    session!.user!.id!
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json({ suggestion: result.suggestion });
}
