import { NextResponse } from "next/server";
import { requireSelf, parseBody, errorResponse } from "@/lib/api-utils";
import * as membershipService from "@/services/identity/membership.service";
import { createMembershipSchema } from "@/lib/validation/users";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error } = await requireSelf(userId);
  if (error) return error;

  const memberships = await membershipService.listMemberships(userId);
  return NextResponse.json({ memberships });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error: authError } = await requireSelf(userId);
  if (authError) return authError;

  const parsed = await parseBody(request, createMembershipSchema);
  if ("error" in parsed) return parsed.error;

  const membership = await membershipService.createMembership(
    userId,
    parsed.data
  );

  return NextResponse.json({ membership }, { status: 201 });
}
