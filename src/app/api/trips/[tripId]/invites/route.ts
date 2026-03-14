import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as invitationService from "@/services/trip/invitation.service";
import { sendInvitesSchema } from "@/lib/validation/trips";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const invites = await invitationService.listInvites(tripId);
  return NextResponse.json({ invites });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, sendInvitesSchema);
  if ("error" in parsed) return parsed.error;

  const results = await invitationService.sendInvites(
    tripId,
    session!.user!.id!,
    parsed.data.emails
  );

  return NextResponse.json({ results }, { status: 201 });
}
