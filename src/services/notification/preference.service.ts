import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  notificationPreferences,
  type NewNotificationPreference,
} from "@/lib/db/schema";
import type { NotificationChannel } from "@/types";

export async function getPreferences(userId: string) {
  return db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
}

export async function updatePreferences(
  userId: string,
  updates: { eventType: string; channel: NotificationChannel; enabled: boolean }[]
) {
  if (updates.length === 0) return [];

  const results = await Promise.all(
    updates.map((update) =>
      db
        .insert(notificationPreferences)
        .values({
          userId,
          eventType: update.eventType,
          channel: update.channel,
          enabled: update.enabled,
        } satisfies NewNotificationPreference)
        .onConflictDoUpdate({
          target: [
            notificationPreferences.userId,
            notificationPreferences.eventType,
            notificationPreferences.channel,
          ],
          set: {
            enabled: update.enabled,
            updatedAt: new Date(),
          },
        })
        .returning()
    )
  );

  return results.flat();
}

export async function isChannelEnabled(
  userId: string,
  eventType: string,
  channel: NotificationChannel
): Promise<boolean> {
  const [pref] = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.eventType, eventType),
        eq(notificationPreferences.channel, channel)
      )
    );
  // Default to enabled if no preference row exists (FR-73)
  return pref?.enabled ?? true;
}
