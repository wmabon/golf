import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as optionService from "@/services/trip/option.service";
import { updateOptionSchema } from "@/lib/validation/trips";

type Params = { params: Promise<{ tripId: string; optionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, optionId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const option = await optionService.getOption(optionId);
  if (!option) return errorResponse("Option not found", 404);

  return NextResponse.json({ option });
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, optionId } = await params;
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!isCaptain) return errorResponse("Only the captain can update options", 403);

  const parsed = await parseBody(request, updateOptionSchema);
  if ("error" in parsed) return parsed.error;

  const option = await optionService.updateOption(optionId, parsed.data);
  if (!option) return errorResponse("Option not found", 404);

  return NextResponse.json({ option });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, optionId } = await params;
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!isCaptain) return errorResponse("Only the captain can delete options", 403);

  const deleted = await optionService.deleteOption(
    tripId,
    optionId,
    session!.user!.id!
  );
  if (!deleted) return errorResponse("Option not found", 404);

  return NextResponse.json({ success: true });
}
