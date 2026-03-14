import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, type NewNotification } from "@/lib/db/schema";

export async function listNotifications(
  userId: string,
  page: number,
  pageSize: number
) {
  const offset = (page - 1) * pageSize;
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(offset);
}

export async function getUnreadCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt))
    );
  return row?.count ?? 0;
}

export async function markRead(notificationId: string, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
    )
    .returning();
  return updated ?? null;
}

export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt))
    );
}

export async function createNotification(data: {
  userId: string;
  tripId?: string;
  eventType: string;
  title: string;
  body: string;
  linkUrl?: string;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      tripId: data.tripId ?? null,
      eventType: data.eventType,
      title: data.title,
      body: data.body,
      linkUrl: data.linkUrl ?? null,
    } satisfies NewNotification)
    .returning();
  return notification;
}
