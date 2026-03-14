import { NextResponse } from "next/server";
import { requireSelf, parseBody } from "@/lib/api-utils";
import * as preferenceService from "@/services/notification/preference.service";
import { updatePreferencesSchema } from "@/lib/validation/notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error } = await requireSelf(userId);
  if (error) return error;

  const preferences = await preferenceService.getPreferences(userId);

  return NextResponse.json({ preferences });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error } = await requireSelf(userId);
  if (error) return error;

  const parsed = await parseBody(request, updatePreferencesSchema);
  if ("error" in parsed) return parsed.error;

  const preferences = await preferenceService.updatePreferences(
    userId,
    parsed.data
  );

  return NextResponse.json({ preferences });
}
