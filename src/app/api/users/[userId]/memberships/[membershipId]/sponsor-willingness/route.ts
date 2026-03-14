import { NextResponse } from "next/server";
import { requireSelf, errorResponse } from "@/lib/api-utils";
import * as membershipService from "@/services/identity/membership.service";

export async function PUT(
  _request: Request,
  {
    params,
  }: { params: Promise<{ userId: string; membershipId: string }> }
) {
  const { userId, membershipId } = await params;
  const { error: authError } = await requireSelf(userId);
  if (authError) return authError;

  const membership = await membershipService.toggleSponsorWillingness(
    membershipId,
    userId
  );
  if (!membership) return errorResponse("Membership not found", 404);

  return NextResponse.json({ membership });
}
