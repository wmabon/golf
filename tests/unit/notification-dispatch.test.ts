import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module so no real DB is needed
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock preference service to control channel enablement
vi.mock("@/services/notification/preference.service", () => ({
  isChannelEnabled: vi.fn(),
}));

// Mock notification service to spy on createNotification
vi.mock("@/services/notification/notification.service", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

import * as preferenceService from "@/services/notification/preference.service";
import * as notificationService from "@/services/notification/notification.service";
import { dispatchNotification } from "@/services/notification/dispatch.service";

const mockIsChannelEnabled = vi.mocked(preferenceService.isChannelEnabled);
const mockCreateNotification = vi.mocked(notificationService.createNotification);

const BASE_PARAMS = {
  userId: "user-123",
  tripId: "trip-456",
  eventType: "booking_confirmation",
  title: "Your booking is confirmed",
  body: "Tee time at 8am confirmed.",
  linkUrl: "/trips/trip-456",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("dispatchNotification", () => {
  it("creates in-app notification when in_app channel is enabled", async () => {
    mockIsChannelEnabled.mockImplementation(async (_userId, _eventType, channel) =>
      channel === "in_app"
    );

    const result = await dispatchNotification(BASE_PARAMS);

    expect(mockCreateNotification).toHaveBeenCalledOnce();
    expect(mockCreateNotification).toHaveBeenCalledWith({
      userId: BASE_PARAMS.userId,
      tripId: BASE_PARAMS.tripId,
      eventType: BASE_PARAMS.eventType,
      title: BASE_PARAMS.title,
      body: BASE_PARAMS.body,
      linkUrl: BASE_PARAMS.linkUrl,
    });
    expect(result.dispatched.in_app).toBe(true);
    expect(result.dispatched.email).toBe(false);
    expect(result.dispatched.sms).toBe(false);
  });

  it("does not create in-app notification when in_app channel is disabled", async () => {
    mockIsChannelEnabled.mockResolvedValue(false);

    const result = await dispatchNotification(BASE_PARAMS);

    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(result.dispatched.in_app).toBe(false);
  });

  it("reports email dispatched when email channel is enabled", async () => {
    mockIsChannelEnabled.mockImplementation(async (_userId, _eventType, channel) =>
      channel === "email"
    );

    const result = await dispatchNotification(BASE_PARAMS);

    expect(result.dispatched.email).toBe(true);
    expect(result.dispatched.in_app).toBe(false);
    expect(result.dispatched.sms).toBe(false);
    // No in-app notification created
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("reports sms dispatched when sms channel is enabled", async () => {
    mockIsChannelEnabled.mockImplementation(async (_userId, _eventType, channel) =>
      channel === "sms"
    );

    const result = await dispatchNotification(BASE_PARAMS);

    expect(result.dispatched.sms).toBe(true);
    expect(result.dispatched.email).toBe(false);
    expect(result.dispatched.in_app).toBe(false);
  });

  it("dispatches all three channels when all are enabled", async () => {
    mockIsChannelEnabled.mockResolvedValue(true);

    const result = await dispatchNotification(BASE_PARAMS);

    expect(result.dispatched.in_app).toBe(true);
    expect(result.dispatched.email).toBe(true);
    expect(result.dispatched.sms).toBe(true);
    expect(mockCreateNotification).toHaveBeenCalledOnce();
  });

  it("checks preferences for all three channels", async () => {
    mockIsChannelEnabled.mockResolvedValue(false);

    await dispatchNotification(BASE_PARAMS);

    expect(mockIsChannelEnabled).toHaveBeenCalledWith(
      BASE_PARAMS.userId,
      BASE_PARAMS.eventType,
      "email"
    );
    expect(mockIsChannelEnabled).toHaveBeenCalledWith(
      BASE_PARAMS.userId,
      BASE_PARAMS.eventType,
      "in_app"
    );
    expect(mockIsChannelEnabled).toHaveBeenCalledWith(
      BASE_PARAMS.userId,
      BASE_PARAMS.eventType,
      "sms"
    );
  });

  it("works without optional tripId and linkUrl", async () => {
    mockIsChannelEnabled.mockImplementation(async (_u, _e, channel) =>
      channel === "in_app"
    );

    const result = await dispatchNotification({
      userId: "user-123",
      eventType: "score_reminder",
      title: "Time to log your score",
      body: "Don't forget to log your score from yesterday.",
    });

    expect(result.dispatched.in_app).toBe(true);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: undefined, linkUrl: undefined })
    );
  });

  it("returns dispatched object with all keys", async () => {
    mockIsChannelEnabled.mockResolvedValue(false);

    const result = await dispatchNotification(BASE_PARAMS);

    expect(result).toHaveProperty("dispatched");
    expect(result.dispatched).toHaveProperty("in_app");
    expect(result.dispatched).toHaveProperty("email");
    expect(result.dispatched).toHaveProperty("sms");
  });
});
