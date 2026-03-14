import { NextResponse } from "next/server";
import { requireSelf, parseBody, errorResponse } from "@/lib/api-utils";
import * as membershipService from "@/services/identity/membership.service";
import { updateMembershipSchema } from "@/lib/validation/users";

type Params = { params: Promise<{ userId: string; membershipId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { userId, membershipId } = await params;
  const { error: authError } = await requireSelf(userId);
  if (authError) return authError;

  const parsed = await parseBody(request, updateMembershipSchema);
  if ("error" in parsed) return parsed.error;

  const membership = await membershipService.updateMembership(
    membershipId,
    userId,
    parsed.data
  );
  if (!membership) return errorResponse("Membership not found", 404);

  return NextResponse.json({ membership });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { userId, membershipId } = await params;
  const { error: authError } = await requireSelf(userId);
  if (authError) return authError;

  const deleted = await membershipService.deleteMembership(
    membershipId,
    userId
  );
  if (!deleted) return errorResponse("Membership not found", 404);

  return NextResponse.json({ success: true });
}
