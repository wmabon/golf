import { describe, it, expect } from "vitest";
import {
  updatePreferencesSchema,
  NOTIFICATION_EVENT_TYPES,
} from "@/lib/validation/notifications";

describe("NOTIFICATION_EVENT_TYPES", () => {
  it("contains all 10 required event types", () => {
    expect(NOTIFICATION_EVENT_TYPES).toHaveLength(10);
  });

  it("includes invite", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("invite");
  });

  it("includes vote_deadline", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("vote_deadline");
  });

  it("includes booking_window_open", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("booking_window_open");
  });

  it("includes booking_confirmation", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("booking_confirmation");
  });

  it("includes swap_suggestion", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("swap_suggestion");
  });

  it("includes fee_event", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("fee_event");
  });

  it("includes score_reminder", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("score_reminder");
  });

  it("includes photo_approval", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("photo_approval");
  });

  it("includes microsite_publish", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("microsite_publish");
  });

  it("includes itinerary_change", () => {
    expect(NOTIFICATION_EVENT_TYPES).toContain("itinerary_change");
  });
});

describe("updatePreferencesSchema", () => {
  it("accepts a valid single preference", () => {
    const result = updatePreferencesSchema.safeParse([
      { eventType: "invite", channel: "email", enabled: true },
    ]);
    expect(result.success).toBe(true);
  });

  it("accepts multiple preferences", () => {
    const result = updatePreferencesSchema.safeParse([
      { eventType: "invite", channel: "email", enabled: true },
      { eventType: "booking_confirmation", channel: "sms", enabled: false },
      { eventType: "score_reminder", channel: "in_app", enabled: true },
    ]);
    expect(result.success).toBe(true);
  });

  it("accepts empty array", () => {
    const result = updatePreferencesSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("accepts all three channels", () => {
    for (const channel of ["email", "in_app", "sms"]) {
      const result = updatePreferencesSchema.safeParse([
        { eventType: "invite", channel, enabled: true },
      ]);
      expect(result.success).toBe(true);
    }
  });

  it("accepts all event types", () => {
    for (const eventType of NOTIFICATION_EVENT_TYPES) {
      const result = updatePreferencesSchema.safeParse([
        { eventType, channel: "in_app", enabled: true },
      ]);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid channel", () => {
    const result = updatePreferencesSchema.safeParse([
      { eventType: "invite", channel: "push", enabled: true },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects invalid eventType", () => {
    const result = updatePreferencesSchema.safeParse([
      { eventType: "invalid_event", channel: "email", enabled: true },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean enabled", () => {
    const result = updatePreferencesSchema.safeParse([
      { eventType: "invite", channel: "email", enabled: "yes" },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects missing enabled field", () => {
    const result = updatePreferencesSchema.safeParse([
      { eventType: "invite", channel: "email" },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects missing channel field", () => {
    const result = updatePreferencesSchema.safeParse([
      { eventType: "invite", enabled: true },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects object instead of array", () => {
    const result = updatePreferencesSchema.safeParse({
      eventType: "invite",
      channel: "email",
      enabled: true,
    });
    expect(result.success).toBe(false);
  });
});
