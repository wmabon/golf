import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import { transitionStateSchema } from "@/lib/validation/trips";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!isCaptain) return errorResponse("Only the captain can change trip state", 403);

  const parsed = await parseBody(request, transitionStateSchema);
  if ("error" in parsed) return parsed.error;

  const result = await tripService.transitionState(
    tripId,
    session!.user!.id!,
    parsed.data.status
  );

  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json({ trip: result.trip });
}
