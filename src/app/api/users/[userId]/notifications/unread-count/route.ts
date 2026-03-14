import { NextResponse } from "next/server";
import { requireSelf } from "@/lib/api-utils";
import * as notificationService from "@/services/notification/notification.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error } = await requireSelf(userId);
  if (error) return error;

  const count = await notificationService.getUnreadCount(userId);

  return NextResponse.json({ count });
}
