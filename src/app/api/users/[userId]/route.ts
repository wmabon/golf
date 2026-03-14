import { NextResponse } from "next/server";
import { requireAuth, requireSelf, parseBody, errorResponse } from "@/lib/api-utils";
import * as userService from "@/services/identity/user.service";
import { updateProfileSchema } from "@/lib/validation/users";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { userId } = await params;
  const user = await userService.getUserById(userId);
  if (!user) return errorResponse("User not found", 404);

  return NextResponse.json({ user });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error: authError } = await requireSelf(userId);
  if (authError) return authError;

  const parsed = await parseBody(request, updateProfileSchema);
  if ("error" in parsed) return parsed.error;

  const user = await userService.updateUser(userId, {
    ...parsed.data,
    handicap:
      parsed.data.handicap !== undefined
        ? parsed.data.handicap?.toString() ?? null
        : undefined,
  });
  if (!user) return errorResponse("User not found", 404);

  return NextResponse.json({ user });
}
