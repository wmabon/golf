import { z } from "zod/v4";

export const NOTIFICATION_EVENT_TYPES = [
  "invite",
  "vote_deadline",
  "booking_window_open",
  "booking_confirmation",
  "swap_suggestion",
  "fee_event",
  "score_reminder",
  "photo_approval",
  "microsite_publish",
  "itinerary_change",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const updatePreferencesSchema = z.array(
  z.object({
    eventType: z.enum(NOTIFICATION_EVENT_TYPES),
    channel: z.enum(["email", "in_app", "sms"]),
    enabled: z.boolean(),
  })
);

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
