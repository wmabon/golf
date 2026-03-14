import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { z } from "zod/v4";
import * as userService from "@/services/identity/user.service";

/** Standard JSON error response */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse and validate request body against a Zod schema */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        error: NextResponse.json(
          { error: "Validation failed", details: result.error.issues },
          { status: 400 }
        ),
      };
    }
    return { data: result.data };
  } catch {
    return { error: errorResponse("Invalid JSON", 400) };
  }
}

/** Get the authenticated session or return 401 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: errorResponse("Unauthorized", 401) };
  }
  return { session, error: null };
}

/** Check if the authenticated user matches the requested userId */
export async function requireSelf(userId: string) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  if (session!.user?.id !== userId) {
    return { session: null, error: errorResponse("Forbidden", 403) };
  }
  return { session, error: null };
}

/** Require admin role — checks JWT token first, falls back to DB lookup */
export async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  const user = await userService.getUserById(session!.user!.id!);
  if (!user || user.systemRole !== "admin") {
    return {
      session: null,
      error: errorResponse("Admin access required", 403),
    };
  }
  return { session, error: null };
}

/** Require admin or concierge_ops role */
export async function requireConcierge() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  const user = await userService.getUserById(session!.user!.id!);
  if (
    !user ||
    (user.systemRole !== "admin" && user.systemRole !== "concierge_ops")
  ) {
    return {
      session: null,
      error: errorResponse("Ops access required", 403),
    };
  }
  return { session, error: null };
}
