import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as invitationService from "@/services/trip/invitation.service";
import { transferCaptainSchema } from "@/lib/validation/trips";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string; userId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const currentUserId = session!.user!.id!;

  const isCaptain = await tripService.isCaptain(tripId, currentUserId);
  if (!isCaptain)
    return errorResponse("Only the captain can transfer the role", 403);

  const parsed = await parseBody(request, transferCaptainSchema);
  if ("error" in parsed) return parsed.error;

  // Verify new captain is a member
  const newCaptainMember = await tripService.isTripMember(
    tripId,
    parsed.data.newCaptainId
  );
  if (!newCaptainMember)
    return errorResponse("Target user is not a member of this trip", 400);

  await invitationService.transferCaptain(
    tripId,
    currentUserId,
    parsed.data.newCaptainId
  );

  return NextResponse.json({ success: true });
}
