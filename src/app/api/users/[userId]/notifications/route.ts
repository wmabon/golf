import { NextResponse } from "next/server";
import { requireSelf } from "@/lib/api-utils";
import * as notificationService from "@/services/notification/notification.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { error } = await requireSelf(userId);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );

  const notifications = await notificationService.listNotifications(
    userId,
    page,
    pageSize
  );

  return NextResponse.json({ notifications, page, pageSize });
}
