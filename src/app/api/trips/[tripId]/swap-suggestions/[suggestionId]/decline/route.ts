import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as swapService from "@/services/optimization/swap-suggestion.service";
import { declineSwapSchema } from "@/lib/validation/optimization";

type Params = { params: Promise<{ tripId: string; suggestionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, suggestionId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain) return errorResponse("Only the captain can decline swaps", 403);

  const parsed = await parseBody(request, declineSwapSchema);
  if ("error" in parsed) return parsed.error;

  const result = await swapService.declineSuggestion(
    suggestionId,
    session!.user!.id!,
    parsed.data.reason
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json({ suggestion: result.suggestion });
}
