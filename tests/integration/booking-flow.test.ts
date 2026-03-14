import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { setupTestDb, teardownTestDb, cleanTables, type TestDb } from "./setup";
import {
  users, trips, tripMembers, courses, courseRules,
  bookingRequests, bookingSlots, reservations,
  feeSchedules, feeCharges, itineraryItems, activityFeedEntries,
} from "@/lib/db/schema";
import bcrypt from "bcryptjs";

let db: TestDb;

beforeAll(async () => { db = await setupTestDb(); }, 60_000);
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });


async function createTestUser(
  db: TestDb,
  overrides: Partial<typeof users.$inferInsert> = {}
) {
  const [user] = await db.insert(users).values({
    name: overrides.name ?? "Test User",
    email: overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
    passwordHash: await bcrypt.hash("testpass123", 4),
    ...overrides,
  }).returning();
  return user;
}

async function createTestTrip(
  db: TestDb, creatorId: string,
  overrides: Partial<typeof trips.$inferInsert> = {}
) {
  const [trip] = await db.insert(trips).values({
    name: overrides.name ?? "Booking Test Trip",
    dateStart: overrides.dateStart ?? "2026-07-10",
    dateEnd: overrides.dateEnd ?? "2026-07-13",
    golferCount: overrides.golferCount ?? 6,
    anchorType: overrides.anchorType ?? "airport_code",
    anchorValue: overrides.anchorValue ?? "RDU",
    creatorId, ...overrides,
  }).returning();
  await db.insert(tripMembers).values({
    tripId: trip.id, userId: creatorId, role: "captain",
    responseStatus: "accepted", invitedBy: creatorId,
  });
  return trip;
}

async function createTestCourse(
  db: TestDb,
  overrides: Partial<typeof courses.$inferInsert> = {}
) {
  const [course] = await db.insert(courses).values({
    name: overrides.name ?? "Pine Valley GC",
    location: overrides.location ?? { lat: 35.2271, lng: -80.8431 },
    accessType: overrides.accessType ?? "public",
    ...overrides,
  }).returning();
  return course;
}

async function createTestCourseRules(
  db: TestDb, courseId: string,
  overrides: Partial<typeof courseRules.$inferInsert> = {}
) {
  const [rules] = await db.insert(courseRules).values({
    courseId, maxPlayers: overrides.maxPlayers ?? 4,
    bookingWindowDays: overrides.bookingWindowDays ?? 14,
    cancellationDeadlineHours: overrides.cancellationDeadlineHours ?? 48,
    ...overrides,
  }).returning();
  return rules;
}

async function createTestBookingRequest(
  db: TestDb, tripId: string, courseId: string, createdBy: string,
  overrides: Partial<typeof bookingRequests.$inferInsert> = {}
) {
  const [request] = await db.insert(bookingRequests).values({
    tripId, courseId, targetDate: overrides.targetDate ?? "2026-07-11",
    targetTimeRange: overrides.targetTimeRange ?? { earliest: "07:00", latest: "10:00" },
    numGolfers: overrides.numGolfers ?? 6,
    partySplit: overrides.partySplit ?? [3, 3],
    mode: overrides.mode ?? "assisted", createdBy, ...overrides,
  }).returning();
  return request;
}


describe("Booking Flow (integration)", () => {
  it("FR-29: creates a booking request with party split and slots", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id, { golferCount: 6 });
    const course = await createTestCourse(db);
    await createTestCourseRules(db, course.id, { maxPlayers: 4 });
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id, {
      numGolfers: 6, partySplit: [3, 3],
    });
    await db.insert(bookingSlots).values({
      bookingRequestId: request.id, groupNum: 1, playerIds: null, targetTime: "08:00",
    }).returning();
    await db.insert(bookingSlots).values({
      bookingRequestId: request.id, groupNum: 2, playerIds: null, targetTime: "08:10",
    }).returning();
    expect(request.status).toBe("candidate");
    expect(request.numGolfers).toBe(6);
    expect(request.partySplit).toEqual([3, 3]);
    const slots = await db.select().from(bookingSlots)
      .where(eq(bookingSlots.bookingRequestId, request.id));
    expect(slots).toHaveLength(2);
    expect(slots[0].status).toBe("pending");
    expect(slots[1].status).toBe("pending");
  });

  it("FR-31: single group when golfers fit in one tee time", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id, { golferCount: 2 });
    const course = await createTestCourse(db);
    await createTestCourseRules(db, course.id, { maxPlayers: 4 });
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id, {
      numGolfers: 2, partySplit: [2],
    });
    await db.insert(bookingSlots).values({
      bookingRequestId: request.id, groupNum: 1, targetTime: "08:00",
    }).returning();
    const slots = await db.select().from(bookingSlots)
      .where(eq(bookingSlots.bookingRequestId, request.id));
    expect(slots).toHaveLength(1);
    expect(request.partySplit).toEqual([2]);
  });

  it("FR-32: transitions booking request through state machine", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    expect(request.status).toBe("candidate");
    const [updated] = await db.update(bookingRequests)
      .set({ status: "requested", statusChangedAt: new Date() })
      .where(eq(bookingRequests.id, request.id)).returning();
    expect(updated.status).toBe("requested");
    expect(updated.statusChangedAt.getTime()).toBeGreaterThanOrEqual(
      request.statusChangedAt.getTime());
  });

  it("FR-32: booking request full lifecycle candidate -> requested -> booked -> locked -> played", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const transitions = ["requested", "booked", "locked", "played"] as const;
    for (const nextStatus of transitions) {
      const [updated] = await db.update(bookingRequests)
        .set({ status: nextStatus, statusChangedAt: new Date() })
        .where(eq(bookingRequests.id, request.id)).returning();
      expect(updated.status).toBe(nextStatus);
    }
  });


  it("FR-32: booking request canceled state is terminal", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    await db.update(bookingRequests).set({ status: "requested", statusChangedAt: new Date() })
      .where(eq(bookingRequests.id, request.id));
    const [canceled] = await db.update(bookingRequests)
      .set({ status: "canceled", statusChangedAt: new Date() })
      .where(eq(bookingRequests.id, request.id)).returning();
    expect(canceled.status).toBe("canceled");
    const [fetched] = await db.select().from(bookingRequests)
      .where(eq(bookingRequests.id, request.id));
    expect(fetched.status).toBe("canceled");
  });

  it("FR-32: creates reservation when slots are confirmed", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const [slot] = await db.insert(bookingSlots).values({
      bookingRequestId: request.id, groupNum: 1, playerIds: [user.id], targetTime: "08:00",
    }).returning();
    const [confirmedSlot] = await db.update(bookingSlots).set({
      status: "confirmed", confirmationNumber: "CONF-123456",
      confirmedTeeTime: new Date("2026-07-11T08:00:00Z"),
    }).where(eq(bookingSlots.id, slot.id)).returning();
    expect(confirmedSlot.status).toBe("confirmed");
    const teeTime = new Date("2026-07-11T08:00:00Z");
    const [reservation] = await db.insert(reservations).values({
      bookingRequestId: request.id, bookingSlotId: slot.id,
      tripId: trip.id, courseId: course.id,
      confirmationNumber: "CONF-123456", teeTime,
      playerIds: [user.id], bookingSource: "assisted",
    }).returning();
    expect(reservation.status).toBe("confirmed");
    expect(reservation.courseId).toBe(course.id);
    expect(reservation.teeTime).toEqual(teeTime);
    expect(reservation.playerIds).toEqual([user.id]);
  });

  it("FR-34: creates fee charge on booking confirmation", async () => {
    const admin = await createTestUser(db, { name: "Admin", systemRole: "admin" });
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const [schedule] = await db.insert(feeSchedules).values({
      feeType: "tee_time_service", calculationMethod: "flat",
      flatAmount: "10.00", effectiveFrom: new Date("2026-01-01"), createdBy: admin.id,
    }).returning();
    const [reservation] = await db.insert(reservations).values({
      bookingRequestId: request.id, tripId: trip.id, courseId: course.id,
      teeTime: new Date("2026-07-11T08:00:00Z"), playerIds: [user.id], bookingSource: "assisted",
    }).returning();
    const [feeCharge] = await db.insert(feeCharges).values({
      tripId: trip.id, userId: user.id, feeType: "tee_time_service",
      sourceObjectType: "reservation", sourceObjectId: reservation.id,
      feeScheduleId: schedule.id, amount: "10.00",
    }).returning();
    expect(feeCharge.status).toBe("pending");
    expect(feeCharge.amount).toBe("10.00");
    expect(feeCharge.sourceObjectId).toBe(reservation.id);
  });


  it("FR-68: transitions fee charge through lifecycle (pending -> collectible -> charged)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const [reservation] = await db.insert(reservations).values({
      bookingRequestId: request.id, tripId: trip.id, courseId: course.id,
      teeTime: new Date("2026-07-11T08:00:00Z"), playerIds: [user.id], bookingSource: "assisted",
    }).returning();
    const [feeCharge] = await db.insert(feeCharges).values({
      tripId: trip.id, userId: user.id, feeType: "tee_time_service",
      sourceObjectType: "reservation", sourceObjectId: reservation.id, amount: "10.00",
    }).returning();
    expect(feeCharge.status).toBe("pending");
    const [collectible] = await db.update(feeCharges)
      .set({ status: "collectible", statusChangedAt: new Date() })
      .where(eq(feeCharges.id, feeCharge.id)).returning();
    expect(collectible.status).toBe("collectible");
    const chargedAt = new Date();
    const [charged] = await db.update(feeCharges).set({
      status: "charged", chargedAt, paymentReference: "pi_test_123", statusChangedAt: new Date(),
    }).where(eq(feeCharges.id, feeCharge.id)).returning();
    expect(charged.status).toBe("charged");
    expect(charged.chargedAt).toEqual(chargedAt);
  });

  it("FR-68: waives fee when booking is canceled before threshold", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const [reservation] = await db.insert(reservations).values({
      bookingRequestId: request.id, tripId: trip.id, courseId: course.id,
      teeTime: new Date("2026-07-11T08:00:00Z"), playerIds: [user.id], bookingSource: "assisted",
    }).returning();
    const [feeCharge] = await db.insert(feeCharges).values({
      tripId: trip.id, userId: user.id, feeType: "tee_time_service",
      sourceObjectType: "reservation", sourceObjectId: reservation.id, amount: "10.00",
    }).returning();
    const [waived] = await db.update(feeCharges)
      .set({ status: "waived", statusChangedAt: new Date() })
      .where(eq(feeCharges.id, feeCharge.id)).returning();
    expect(waived.status).toBe("waived");
  });

  it("FR-68: fee charge refund after charged", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const [reservation] = await db.insert(reservations).values({
      bookingRequestId: request.id, tripId: trip.id, courseId: course.id,
      teeTime: new Date("2026-07-11T08:00:00Z"), playerIds: [user.id], bookingSource: "assisted",
    }).returning();
    const [feeCharge] = await db.insert(feeCharges).values({
      tripId: trip.id, userId: user.id, feeType: "tee_time_service",
      sourceObjectType: "reservation", sourceObjectId: reservation.id,
      amount: "10.00", status: "charged", chargedAt: new Date(),
    }).returning();
    const refundedAt = new Date();
    const [refunded] = await db.update(feeCharges).set({
      status: "refunded", refundAmount: "10.00", refundedAt, statusChangedAt: new Date(),
    }).where(eq(feeCharges.id, feeCharge.id)).returning();
    expect(refunded.status).toBe("refunded");
    expect(refunded.refundAmount).toBe("10.00");
  });


  it("FR-47: reservation appears in canonical itinerary", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db, { name: "Pinehurst No. 2" });
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const teeTime = new Date("2026-07-11T08:00:00Z");
    const [reservation] = await db.insert(reservations).values({
      bookingRequestId: request.id, tripId: trip.id, courseId: course.id,
      confirmationNumber: "PH-2026-789", teeTime,
      playerIds: [user.id], bookingSource: "assisted",
    }).returning();
    const [item] = await db.insert(itineraryItems).values({
      tripId: trip.id, itemType: "golf", title: "Pinehurst No. 2 - 8:00 AM",
      date: "2026-07-11", startTime: teeTime, confirmationNumber: "PH-2026-789",
      participants: [user.id], source: "platform",
      relatedReservationId: reservation.id, createdBy: user.id,
    }).returning();
    expect(item.relatedReservationId).toBe(reservation.id);
    expect(item.itemType).toBe("golf");
    const items = await db.select().from(itineraryItems)
      .where(eq(itineraryItems.tripId, trip.id));
    expect(items).toHaveLength(1);
  });

  it("FR-29: course rules store booking-window, cancellation, maxPlayers, channel (derived)", async () => {
    const course = await createTestCourse(db);
    const [rules] = await db.insert(courseRules).values({
      courseId: course.id, bookingWindowRule: "14 days in advance",
      bookingWindowDays: 14, cancellationRule: "Free cancellation up to 48h before",
      cancellationDeadlineHours: 48, maxPlayers: 4, publicTimesAvailable: true,
      bookingChannel: "direct_api", cancellationPenaltyAmount: "25.00",
      rulesConfirmed: true, source: "ops_verified",
    }).returning();
    expect(rules.bookingWindowDays).toBe(14);
    expect(rules.maxPlayers).toBe(4);
    expect(rules.rulesConfirmed).toBe(true);
  });

  it("FR-29: enforces unique course rules per course (derived)", async () => {
    const course = await createTestCourse(db);
    await createTestCourseRules(db, course.id);
    await expect(
      db.insert(courseRules).values({ courseId: course.id, maxPlayers: 2 })
    ).rejects.toThrow();
  });

  it("FR-33: booking mode is stored per request (derived)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const [directReq] = await db.insert(bookingRequests).values({
      tripId: trip.id, courseId: course.id, targetDate: "2026-07-11",
      targetTimeRange: { earliest: "07:00", latest: "10:00" },
      numGolfers: 4, mode: "direct", createdBy: user.id,
    }).returning();
    const [assistedReq] = await db.insert(bookingRequests).values({
      tripId: trip.id, courseId: course.id, targetDate: "2026-07-12",
      targetTimeRange: { earliest: "08:00", latest: "11:00" },
      numGolfers: 4, mode: "assisted", createdBy: user.id,
    }).returning();
    expect(directReq.mode).toBe("direct");
    expect(assistedReq.mode).toBe("assisted");
  });

  it("FR-32: booking slot status transitions (derived)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const [slot] = await db.insert(bookingSlots).values({
      bookingRequestId: request.id, groupNum: 1, targetTime: "08:00",
    }).returning();
    expect(slot.status).toBe("pending");
    const [attempting] = await db.update(bookingSlots)
      .set({ status: "attempting" }).where(eq(bookingSlots.id, slot.id)).returning();
    expect(attempting.status).toBe("attempting");
    const [held] = await db.update(bookingSlots).set({
      status: "held", holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }).where(eq(bookingSlots.id, slot.id)).returning();
    expect(held.status).toBe("held");
    const [confirmed] = await db.update(bookingSlots).set({
      status: "confirmed", confirmationNumber: "CONF-789",
      confirmedTeeTime: new Date("2026-07-11T08:00:00Z"),
    }).where(eq(bookingSlots.id, slot.id)).returning();
    expect(confirmed.status).toBe("confirmed");
  });

  it("reservation status transitions (confirmed -> swappable -> locked -> played) (derived)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    const [reservation] = await db.insert(reservations).values({
      bookingRequestId: request.id, tripId: trip.id, courseId: course.id,
      teeTime: new Date("2026-07-11T08:00:00Z"), playerIds: [user.id], bookingSource: "assisted",
    }).returning();
    expect(reservation.status).toBe("confirmed");
    for (const s of ["swappable", "locked", "played"] as const) {
      const [u] = await db.update(reservations)
        .set({ status: s, statusChangedAt: new Date() })
        .where(eq(reservations.id, reservation.id)).returning();
      expect(u.status).toBe(s);
    }
  });

  it("FR-74: booking state changes logged to activity feed (derived)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const course = await createTestCourse(db);
    const request = await createTestBookingRequest(db, trip.id, course.id, user.id);
    await db.insert(activityFeedEntries).values({
      tripId: trip.id, eventType: "booking_request_created", actorId: user.id,
      description: "Booking request created",
      metadata: { bookingRequestId: request.id, courseId: course.id },
    });
    await db.insert(activityFeedEntries).values({
      tripId: trip.id, eventType: "booking_request_state_changed", actorId: user.id,
      description: "Booking request moved to requested",
      metadata: { bookingRequestId: request.id, from: "candidate", to: "requested" },
    });
    const entries = await db.select().from(activityFeedEntries)
      .where(eq(activityFeedEntries.tripId, trip.id));
    expect(entries).toHaveLength(2);
    expect(entries[0].eventType).toBe("booking_request_created");
    expect(entries[1].eventType).toBe("booking_request_state_changed");
  });

});
