import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tripMembers } from "@/lib/db/schema";
import * as notificationService from "./notification.service";
import * as preferenceService from "./preference.service";
import type { NotificationChannel } from "@/types";

const CHANNELS: NotificationChannel[] = ["email", "in_app", "sms"];

export async function dispatchNotification(params: {
  userId: string;
  tripId?: string;
  eventType: string;
  title: string;
  body: string;
  linkUrl?: string;
}) {
  const channelEnabled: Record<NotificationChannel, boolean> = {
    email: false,
    in_app: false,
    sms: false,
  };

  await Promise.all(
    CHANNELS.map(async (channel) => {
      channelEnabled[channel] = await preferenceService.isChannelEnabled(
        params.userId,
        params.eventType,
        channel
      );
    })
  );

  if (channelEnabled.in_app) {
    await notificationService.createNotification({
      userId: params.userId,
      tripId: params.tripId,
      eventType: params.eventType,
      title: params.title,
      body: params.body,
      linkUrl: params.linkUrl,
    });
  }

  if (channelEnabled.email) {
    console.log(
      `[dispatch] would send email to user=${params.userId} event=${params.eventType} title="${params.title}"`
    );
  }

  if (channelEnabled.sms) {
    console.log(
      `[dispatch] would send SMS to user=${params.userId} event=${params.eventType} title="${params.title}"`
    );
  }

  return {
    dispatched: {
      in_app: channelEnabled.in_app,
      email: channelEnabled.email,
      sms: channelEnabled.sms,
    },
  };
}

export async function dispatchToTripMembers(params: {
  tripId: string;
  eventType: string;
  title: string;
  body: string;
  linkUrl?: string;
  excludeUserId?: string;
}) {
  const members = await db
    .select()
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, params.tripId),
        eq(tripMembers.responseStatus, "accepted")
      )
    );

  const eligible = params.excludeUserId
    ? members.filter((m) => m.userId !== params.excludeUserId)
    : members;

  let count = 0;
  await Promise.all(
    eligible
      .filter((m) => m.userId !== null)
      .map(async (m) => {
        await dispatchNotification({
          userId: m.userId!,
          tripId: params.tripId,
          eventType: params.eventType,
          title: params.title,
          body: params.body,
          linkUrl: params.linkUrl,
        });
        count++;
      })
  );

  return { dispatched: count };
}
