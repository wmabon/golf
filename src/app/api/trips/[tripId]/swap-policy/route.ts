import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as swapService from "@/services/optimization/swap-suggestion.service";
import { updateSwapPolicySchema } from "@/lib/validation/optimization";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const result = await swapService.getSwapPolicy(tripId);
  if ("error" in result) return errorResponse(result.error as string, 404);

  return NextResponse.json(result);
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain)
    return errorResponse("Only the captain can change swap policy", 403);

  const parsed = await parseBody(request, updateSwapPolicySchema);
  if ("error" in parsed) return parsed.error;

  const result = await swapService.updateSwapPolicy(tripId, parsed.data.policy);
  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json(result);
}
