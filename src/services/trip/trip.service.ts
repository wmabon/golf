import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  trips,
  tripMembers,
  activityFeedEntries,
  type NewTrip,
} from "@/lib/db/schema";
import { validateTransition } from "./state-machine";
import type { TripStatus } from "@/types";

export async function createTrip(
  creatorId: string,
  data: {
    name: string;
    dateStart: string;
    dateEnd: string;
    golferCount?: number;
    anchorType: "airport_code" | "city_region" | "map_area";
    anchorValue: string;
    budgetSettings?: { perRoundMin?: number; perRoundMax?: number };
  }
) {
  return db.transaction(async (tx) => {
    const [trip] = await tx
      .insert(trips)
      .values({
        name: data.name,
        dateStart: data.dateStart,
        dateEnd: data.dateEnd,
        golferCount: data.golferCount ?? 4,
        anchorType: data.anchorType,
        anchorValue: data.anchorValue,
        budgetSettings: data.budgetSettings ?? null,
        creatorId,
      } satisfies NewTrip)
      .returning();

    // Add creator as captain with accepted status
    await tx.insert(tripMembers).values({
      tripId: trip.id,
      userId: creatorId,
      role: "captain",
      responseStatus: "accepted",
      invitedBy: creatorId,
    });

    // Log activity
    await tx.insert(activityFeedEntries).values({
      tripId: trip.id,
      eventType: "trip_created",
      actorId: creatorId,
      description: `Created trip "${trip.name}"`,
    });

    return trip;
  });
}

export async function getTrip(tripId: string) {
  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, tripId));

  return trip ?? null;
}

export async function listUserTrips(userId: string) {
  return db
    .select({ trip: trips })
    .from(trips)
    .innerJoin(tripMembers, eq(trips.id, tripMembers.tripId))
    .where(eq(tripMembers.userId, userId))
    .orderBy(desc(trips.createdAt));
}

export async function updateTrip(
  tripId: string,
  data: Partial<{
    name: string;
    dateStart: string;
    dateEnd: string;
    golferCount: number;
    anchorType: "airport_code" | "city_region" | "map_area";
    anchorValue: string;
    budgetSettings: { perRoundMin?: number; perRoundMax?: number } | null;
  }>
) {
  const [trip] = await db
    .update(trips)
    .set(data)
    .where(eq(trips.id, tripId))
    .returning();

  return trip ?? null;
}

export async function transitionState(
  tripId: string,
  actorId: string,
  newStatus: TripStatus
) {
  const trip = await getTrip(tripId);
  if (!trip) return { error: "Trip not found" };

  const result = validateTransition(trip.status as TripStatus, newStatus);
  if (!result.valid) return { error: result.reason };

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(trips)
      .set({
        status: newStatus,
        statusChangedAt: new Date(),
      })
      .where(eq(trips.id, tripId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "trip_state_changed",
      actorId,
      description: `Trip moved to "${newStatus}"`,
      metadata: {
        from: trip.status,
        to: newStatus,
      },
    });

    return { trip: updated };
  });
}

export async function getActivityFeed(
  tripId: string,
  limit = 50,
  offset = 0
) {
  return db
    .select()
    .from(activityFeedEntries)
    .where(eq(activityFeedEntries.tripId, tripId))
    .orderBy(desc(activityFeedEntries.createdAt))
    .limit(limit)
    .offset(offset);
}

/** Check if user is a member of the trip */
export async function isTripMember(tripId: string, userId: string) {
  const [member] = await db
    .select()
    .from(tripMembers)
    .where(
      and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId))
    );

  return member ?? null;
}

/** Check if user is the captain of the trip */
export async function isCaptain(tripId: string, userId: string) {
  const member = await isTripMember(tripId, userId);
  return member?.role === "captain";
}
