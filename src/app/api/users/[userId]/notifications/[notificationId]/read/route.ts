import { NextResponse } from "next/server";
import { requireSelf, errorResponse } from "@/lib/api-utils";
import * as notificationService from "@/services/notification/notification.service";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ userId: string; notificationId: string }> }
) {
  const { userId, notificationId } = await params;
  const { error } = await requireSelf(userId);
  if (error) return error;

  const notification = await notificationService.markRead(notificationId, userId);
  if (!notification) return errorResponse("Notification not found", 404);

  return NextResponse.json({ notification });
}
