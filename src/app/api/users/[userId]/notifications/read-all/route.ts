import { NextResponse } from "next/server";
import { requireSelf } from "@/lib/api-utils";
import * as notificationService from "@/services/notification/notification.service";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error } = await requireSelf(userId);
  if (error) return error;

  await notificationService.markAllRead(userId);

  return NextResponse.json({ ok: true });
}
