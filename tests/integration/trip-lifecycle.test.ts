import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { setupTestDb, teardownTestDb, cleanTables, type TestDb } from "./setup";
import { users, trips, tripMembers, activityFeedEntries } from "@/lib/db/schema";
import bcrypt from "bcryptjs";

let db: TestDb;

beforeAll(async () => {
  db = await setupTestDb();
}, 60_000);

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await cleanTables();
});

async function createTestUser(
  db: TestDb,
  overrides: Partial<typeof users.$inferInsert> = {}
) {
  const [user] = await db
    .insert(users)
    .values({
      name: overrides.name ?? "Test User",
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash("testpass123", 4), // fast rounds for tests
      ...overrides,
    })
    .returning();
  return user;
}

describe("Trip Lifecycle (integration)", () => {
  it("creates a trip with the creator as captain", async () => {
    const user = await createTestUser(db);

    const [trip] = await db
      .insert(trips)
      .values({
        name: "Pinehurst 2026",
        dateStart: "2026-06-15",
        dateEnd: "2026-06-18",
        golferCount: 6,
        anchorType: "airport_code",
        anchorValue: "RDU",
        creatorId: user.id,
      })
      .returning();

    // Add creator as captain
    await db.insert(tripMembers).values({
      tripId: trip.id,
      userId: user.id,
      role: "captain",
      responseStatus: "accepted",
      invitedBy: user.id,
    });

    expect(trip.status).toBe("draft");
    expect(trip.golferCount).toBe(6);

    // Verify captain membership
    const [member] = await db
      .select()
      .from(tripMembers)
      .where(eq(tripMembers.tripId, trip.id));

    expect(member.role).toBe("captain");
    expect(member.responseStatus).toBe("accepted");
  });

  it("transitions through the full trip lifecycle", async () => {
    const user = await createTestUser(db);

    const [trip] = await db
      .insert(trips)
      .values({
        name: "Lifecycle Test",
        dateStart: "2026-07-01",
        dateEnd: "2026-07-03",
        anchorType: "city_region",
        anchorValue: "Scottsdale, AZ",
        creatorId: user.id,
      })
      .returning();

    expect(trip.status).toBe("draft");

    // Transition through each state
    const states = [
      "planning",
      "voting",
      "booking",
      "locked",
      "in_progress",
      "completed",
      "archived",
    ] as const;

    for (const nextStatus of states) {
      const [updated] = await db
        .update(trips)
        .set({ status: nextStatus, statusChangedAt: new Date() })
        .where(eq(trips.id, trip.id))
        .returning();

      expect(updated.status).toBe(nextStatus);
    }
  });

  it("handles member invitation and acceptance", async () => {
    const captain = await createTestUser(db, { name: "Captain" });
    const invitee = await createTestUser(db, {
      name: "Invitee",
      email: "invitee@test.com",
    });

    const [trip] = await db
      .insert(trips)
      .values({
        name: "Invite Test",
        dateStart: "2026-08-01",
        dateEnd: "2026-08-03",
        anchorType: "airport_code",
        anchorValue: "MCO",
        creatorId: captain.id,
      })
      .returning();

    // Captain joins
    await db.insert(tripMembers).values({
      tripId: trip.id,
      userId: captain.id,
      role: "captain",
      responseStatus: "accepted",
      invitedBy: captain.id,
    });

    // Invite member
    const [invite] = await db
      .insert(tripMembers)
      .values({
        tripId: trip.id,
        inviteEmail: "invitee@test.com",
        inviteToken: "test-token-123",
        inviteMethod: "email",
        invitedBy: captain.id,
      })
      .returning();

    expect(invite.responseStatus).toBe("pending");
    expect(invite.userId).toBeNull();

    // Accept invite — link user account
    const [accepted] = await db
      .update(tripMembers)
      .set({
        userId: invitee.id,
        responseStatus: "accepted",
        respondedAt: new Date(),
      })
      .where(eq(tripMembers.id, invite.id))
      .returning();

    expect(accepted.responseStatus).toBe("accepted");
    expect(accepted.userId).toBe(invitee.id);

    // Verify member count
    const members = await db
      .select()
      .from(tripMembers)
      .where(eq(tripMembers.tripId, trip.id));

    expect(members).toHaveLength(2);
  });

  it("logs activity feed entries", async () => {
    const user = await createTestUser(db);

    const [trip] = await db
      .insert(trips)
      .values({
        name: "Feed Test",
        dateStart: "2026-09-01",
        dateEnd: "2026-09-03",
        anchorType: "airport_code",
        anchorValue: "LAX",
        creatorId: user.id,
      })
      .returning();

    // Log creation event
    await db.insert(activityFeedEntries).values({
      tripId: trip.id,
      eventType: "trip_created",
      actorId: user.id,
      description: `Created trip "${trip.name}"`,
    });

    // Log state change
    await db.insert(activityFeedEntries).values({
      tripId: trip.id,
      eventType: "trip_state_changed",
      actorId: user.id,
      description: 'Trip moved to "planning"',
      metadata: { from: "draft", to: "planning" },
    });

    const entries = await db
      .select()
      .from(activityFeedEntries)
      .where(eq(activityFeedEntries.tripId, trip.id));

    expect(entries).toHaveLength(2);
    expect(entries[0].eventType).toBe("trip_created");
    expect(entries[1].eventType).toBe("trip_state_changed");
    expect(entries[1].metadata).toEqual({ from: "draft", to: "planning" });
  });

  it("enforces unique trip membership constraint", async () => {
    const user = await createTestUser(db);

    const [trip] = await db
      .insert(trips)
      .values({
        name: "Unique Test",
        dateStart: "2026-10-01",
        dateEnd: "2026-10-03",
        anchorType: "airport_code",
        anchorValue: "SFO",
        creatorId: user.id,
      })
      .returning();

    await db.insert(tripMembers).values({
      tripId: trip.id,
      userId: user.id,
      role: "captain",
      responseStatus: "accepted",
      invitedBy: user.id,
    });

    // Attempt duplicate membership — should throw
    await expect(
      db.insert(tripMembers).values({
        tripId: trip.id,
        userId: user.id,
        role: "collaborator",
        responseStatus: "accepted",
        invitedBy: user.id,
      })
    ).rejects.toThrow();
  });
});
