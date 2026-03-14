import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { parseBody, errorResponse } from "@/lib/api-utils";
import * as userService from "@/services/identity/user.service";

export async function POST(request: Request) {
  const parsed = await parseBody(request, registerSchema);
  if ("error" in parsed) return parsed.error;

  const { name, email, password } = parsed.data;

  // Check if email already exists
  const existing = await userService.getUserByEmail(email);
  if (existing) {
    return errorResponse("An account with this email already exists", 409);
  }

  const user = await userService.createUser({ name, email, password });

  return NextResponse.json({ user }, { status: 201 });
}
