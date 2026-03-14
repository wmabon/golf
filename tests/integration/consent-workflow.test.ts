import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { setupTestDb, teardownTestDb, cleanTables, type TestDb } from "./setup";
import {
  users, trips, tripMembers,
  photoAssets, photoTags, photoConsents,
  microsites, activityFeedEntries,
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
    name: overrides.name ?? "Photo Test Trip",
    dateStart: overrides.dateStart ?? "2026-08-01",
    dateEnd: overrides.dateEnd ?? "2026-08-04",
    golferCount: overrides.golferCount ?? 4,
    anchorType: overrides.anchorType ?? "airport_code",
    anchorValue: overrides.anchorValue ?? "MCO",
    creatorId, ...overrides,
  }).returning();
  await db.insert(tripMembers).values({
    tripId: trip.id, userId: creatorId, role: "captain",
    responseStatus: "accepted", invitedBy: creatorId,
  });
  return trip;
}

async function createTestPhoto(
  db: TestDb, tripId: string, uploaderId: string,
  overrides: Partial<typeof photoAssets.$inferInsert> = {}
) {
  const [photo] = await db.insert(photoAssets).values({
    tripId, uploaderId,
    storageKey: overrides.storageKey ?? "photos/"+Date.now()+"-test.jpg",
    ...overrides,
  }).returning();
  return photo;
}


describe("Photo Consent Workflow (integration)", () => {
  it("FR-57: creates a photo in private state", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const photo = await createTestPhoto(db, trip.id, user.id);
    expect(photo.publishState).toBe("private");
    expect(photo.tripId).toBe(trip.id);
    expect(photo.uploaderId).toBe(user.id);
  });

  it("FR-58: tags a user and creates pending consent", async () => {
    const uploader = await createTestUser(db, { name: "Uploader" });
    const tagged = await createTestUser(db, { name: "Tagged User" });
    const trip = await createTestTrip(db, uploader.id);
    await db.insert(tripMembers).values({
      tripId: trip.id, userId: tagged.id,
      role: "collaborator", responseStatus: "accepted", invitedBy: uploader.id,
    });
    const photo = await createTestPhoto(db, trip.id, uploader.id);
    const [tag] = await db.insert(photoTags).values({
      photoAssetId: photo.id, userId: tagged.id, taggedById: uploader.id,
    }).returning();
    expect(tag.userId).toBe(tagged.id);
    const [consent] = await db.insert(photoConsents).values({
      photoAssetId: photo.id, userId: tagged.id,
    }).returning();
    expect(consent.consentState).toBe("pending");
  });

  it("FR-58: transitions photo to review_pending on nomination", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const photo = await createTestPhoto(db, trip.id, user.id);
    const [updated] = await db.update(photoAssets)
      .set({ publishState: "review_pending", statusChangedAt: new Date() })
      .where(eq(photoAssets.id, photo.id)).returning();
    expect(updated.publishState).toBe("review_pending");
  });

  it("FR-58: approves consent and transitions to publish_eligible", async () => {
    const uploader = await createTestUser(db, { name: "Uploader" });
    const tagged = await createTestUser(db, { name: "Tagged" });
    const trip = await createTestTrip(db, uploader.id);
    await db.insert(tripMembers).values({
      tripId: trip.id, userId: tagged.id,
      role: "collaborator", responseStatus: "accepted", invitedBy: uploader.id,
    });
    const photo = await createTestPhoto(db, trip.id, uploader.id, { publishState: "review_pending" });
    const [consent] = await db.insert(photoConsents).values({
      photoAssetId: photo.id, userId: tagged.id,
    }).returning();
    await db.update(photoConsents).set({
      consentState: "approved", decidedAt: new Date(), statusChangedAt: new Date(),
    }).where(eq(photoConsents.id, consent.id));
    const [eligible] = await db.update(photoAssets)
      .set({ publishState: "publish_eligible", statusChangedAt: new Date() })
      .where(eq(photoAssets.id, photo.id)).returning();
    expect(eligible.publishState).toBe("publish_eligible");
  });


  it("FR-58: veto immediately transitions photo to withdrawn", async () => {
    const uploader = await createTestUser(db, { name: "Uploader" });
    const user1 = await createTestUser(db, { name: "User 1" });
    const user2 = await createTestUser(db, { name: "User 2" });
    const trip = await createTestTrip(db, uploader.id);
    await db.insert(tripMembers).values({
      tripId: trip.id, userId: user1.id,
      role: "collaborator", responseStatus: "accepted", invitedBy: uploader.id,
    });
    await db.insert(tripMembers).values({
      tripId: trip.id, userId: user2.id,
      role: "collaborator", responseStatus: "accepted", invitedBy: uploader.id,
    });
    const photo = await createTestPhoto(db, trip.id, uploader.id, { publishState: "review_pending" });
    const [c1] = await db.insert(photoConsents).values({ photoAssetId: photo.id, userId: user1.id }).returning();
    const [c2] = await db.insert(photoConsents).values({ photoAssetId: photo.id, userId: user2.id }).returning();
    await db.update(photoConsents).set({
      consentState: "approved", decidedAt: new Date(), statusChangedAt: new Date(),
    }).where(eq(photoConsents.id, c1.id));
    const [vetoed] = await db.update(photoConsents).set({
      consentState: "vetoed", decidedAt: new Date(), statusChangedAt: new Date(),
    }).where(eq(photoConsents.id, c2.id)).returning();
    expect(vetoed.consentState).toBe("vetoed");
    const [withdrawn] = await db.update(photoAssets)
      .set({ publishState: "withdrawn", statusChangedAt: new Date() })
      .where(eq(photoAssets.id, photo.id)).returning();
    expect(withdrawn.publishState).toBe("withdrawn");
    const [fetched] = await db.select().from(photoAssets).where(eq(photoAssets.id, photo.id));
    expect(fetched.publishState).toBe("withdrawn");
  });

  it("FR-61: published photo can be taken down", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const photo = await createTestPhoto(db, trip.id, user.id, {
      publishState: "published", publishedAt: new Date(),
    });
    const [withdrawn] = await db.update(photoAssets)
      .set({ publishState: "withdrawn", statusChangedAt: new Date() })
      .where(eq(photoAssets.id, photo.id)).returning();
    expect(withdrawn.publishState).toBe("withdrawn");
  });

  it("FR-60: microsite links to published photos", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const photo = await createTestPhoto(db, trip.id, user.id, {
      publishState: "published", publishedAt: new Date(),
    });
    const [microsite] = await db.insert(microsites).values({
      tripId: trip.id, slug: "pinehurst-2026-" + Date.now(),
      selectedAssetIds: [photo.id],
    }).returning();
    expect(microsite.selectedAssetIds).toEqual([photo.id]);
    expect(microsite.publishState).toBe("draft");
  });

  it("FR-60: microsite default unlisted/noindex (derived)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const [microsite] = await db.insert(microsites).values({
      tripId: trip.id, slug: "test-ms-" + Date.now(), selectedAssetIds: [],
    }).returning();
    expect(microsite.visibilityMode).toBe("unlisted");
  });

  it("FR-58: enforces unique consent per user per photo", async () => {
    const uploader = await createTestUser(db, { name: "Uploader" });
    const tagged = await createTestUser(db, { name: "Tagged" });
    const trip = await createTestTrip(db, uploader.id);
    const photo = await createTestPhoto(db, trip.id, uploader.id);
    await db.insert(photoConsents).values({ photoAssetId: photo.id, userId: tagged.id });
    await expect(
      db.insert(photoConsents).values({ photoAssetId: photo.id, userId: tagged.id })
    ).rejects.toThrow();
  });

  it("FR-58: enforces unique tag per user per photo (derived)", async () => {
    const uploader = await createTestUser(db, { name: "Uploader" });
    const tagged = await createTestUser(db, { name: "Tagged" });
    const trip = await createTestTrip(db, uploader.id);
    const photo = await createTestPhoto(db, trip.id, uploader.id);
    await db.insert(photoTags).values({
      photoAssetId: photo.id, userId: tagged.id, taggedById: uploader.id,
    });
    await expect(
      db.insert(photoTags).values({
        photoAssetId: photo.id, userId: tagged.id, taggedById: uploader.id,
      })
    ).rejects.toThrow();
  });

  it("FR-57: photo publish state lifecycle (derived)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    const photo = await createTestPhoto(db, trip.id, user.id);
    expect(photo.publishState).toBe("private");
    for (const s of ["review_pending", "publish_eligible", "published"] as const) {
      const pa = s === "published" ? new Date() : undefined;
      const [u] = await db.update(photoAssets).set({
        publishState: s, statusChangedAt: new Date(),
        ...(pa ? { publishedAt: pa } : {}),
      }).where(eq(photoAssets.id, photo.id)).returning();
      expect(u.publishState).toBe(s);
    }
  });

  it("FR-60: microsite unique per trip (derived)", async () => {
    const user = await createTestUser(db);
    const trip = await createTestTrip(db, user.id);
    await db.insert(microsites).values({
      tripId: trip.id, slug: "first-" + Date.now(), selectedAssetIds: [],
    });
    await expect(
      db.insert(microsites).values({
        tripId: trip.id, slug: "second-" + Date.now(), selectedAssetIds: [],
      })
    ).rejects.toThrow();
  });

});
