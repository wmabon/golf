import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  itineraryItems,
  reservations,
  externalBookings,
  courses,
  activityFeedEntries,
  type NewItineraryItem,
} from "@/lib/db/schema";
import type {
  CreateItineraryItemInput,
  UpdateItineraryItemInput,
} from "@/lib/validation/itinerary";

// ---------- Canonical Itinerary Types ----------

export interface CanonicalItem {
  id: string;
  source: "platform" | "external" | "manual";
  itemType: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: { address?: string; lat?: number; lng?: number } | null;
  confirmationNumber: string | null;
  bookingContact: string | null;
  participants: string[] | null;
  contactNotes: string | null;
  cost: string | null;
  notes: string | null;
  status: string;
  sortOrder: number;
  sourceId: string;
}

export interface CanonicalDay {
  date: string;
  items: CanonicalItem[];
}

export interface CanonicalItinerary {
  days: CanonicalDay[];
}

// ---------- getCanonicalItinerary ----------

/**
 * Build a unified day-by-day itinerary by merging:
 * 1. Manual itinerary items (source='manual')
 * 2. Platform reservations (tee times booked through the app)
 * 3. External bookings (user-captured bookings from outside)
 *
 * Grouped by date, sorted within each day by startTime then sortOrder.
 */
export async function getCanonicalItinerary(
  tripId: string
): Promise<CanonicalItinerary> {
  // Fetch all three sources in parallel
  const [manualItems, tripReservations, tripExternalBookings] =
    await Promise.all([
      db
        .select()
        .from(itineraryItems)
        .where(eq(itineraryItems.tripId, tripId))
        .orderBy(itineraryItems.date, itineraryItems.sortOrder),

      db
        .select({
          reservation: reservations,
          courseName: courses.name,
        })
        .from(reservations)
        .innerJoin(courses, eq(reservations.courseId, courses.id))
        .where(eq(reservations.tripId, tripId))
        .orderBy(reservations.teeTime),

      db
        .select()
        .from(externalBookings)
        .where(eq(externalBookings.tripId, tripId))
        .orderBy(externalBookings.date),
    ]);

  // Map manual items
  const canonicalManual: CanonicalItem[] = manualItems.map((item) => ({
    id: item.id,
    source: item.source as "platform" | "external" | "manual",
    itemType: item.itemType,
    title: item.title,
    date: item.date,
    startTime: item.startTime?.toISOString() ?? null,
    endTime: item.endTime?.toISOString() ?? null,
    location: item.location ?? null,
    confirmationNumber: item.confirmationNumber ?? null,
    bookingContact: item.bookingContact ?? null,
    participants: item.participants ?? null,
    contactNotes: item.contactNotes ?? null,
    cost: item.cost ?? null,
    notes: item.notes ?? null,
    status: item.status,
    sortOrder: item.sortOrder,
    sourceId: item.id,
  }));

  // Map reservations to canonical format
  const canonicalReservations: CanonicalItem[] = tripReservations.map(
    ({ reservation, courseName }) => {
      const teeDate = reservation.teeTime.toISOString().split("T")[0];
      return {
        id: `reservation-${reservation.id}`,
        source: "platform" as const,
        itemType: "golf",
        title: courseName,
        date: teeDate,
        startTime: reservation.teeTime.toISOString(),
        endTime: null,
        location: null,
        confirmationNumber: reservation.confirmationNumber ?? null,
        bookingContact: null,
        participants: reservation.playerIds ?? null,
        contactNotes: null,
        cost: reservation.totalCost ?? null,
        notes: null,
        status: reservation.status,
        sortOrder: 0,
        sourceId: reservation.id,
      };
    }
  );

  // Map external bookings to canonical format
  const canonicalExternal: CanonicalItem[] = tripExternalBookings.map(
    (booking) => ({
      id: `external-${booking.id}`,
      source: "external" as const,
      itemType: booking.type,
      title: `${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}${booking.source ? ` (${booking.source})` : ""}`,
      date: booking.date,
      startTime: booking.time
        ? `${booking.date}T${booking.time}:00.000Z`
        : null,
      endTime: null,
      location: null,
      confirmationNumber: booking.confirmationNumber ?? null,
      bookingContact: booking.bookingContact ?? null,
      participants: null,
      contactNotes: null,
      cost: booking.cost ?? null,
      notes: booking.notes ?? null,
      status: "confirmed",
      sortOrder: 0,
      sourceId: booking.id,
    })
  );

  // Merge all items
  const allItems = [
    ...canonicalManual,
    ...canonicalReservations,
    ...canonicalExternal,
  ];

  // Group by date
  const dayMap = new Map<string, CanonicalItem[]>();
  for (const item of allItems) {
    const existing = dayMap.get(item.date);
    if (existing) {
      existing.push(item);
    } else {
      dayMap.set(item.date, [item]);
    }
  }

  // Sort within each day: by startTime (nulls last), then sortOrder
  for (const items of dayMap.values()) {
    items.sort((a, b) => {
      // Items with startTime come before those without
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      if (a.startTime && b.startTime) {
        const cmp = a.startTime.localeCompare(b.startTime);
        if (cmp !== 0) return cmp;
      }
      return a.sortOrder - b.sortOrder;
    });
  }

  // Sort days chronologically
  const sortedDates = [...dayMap.keys()].sort();
  const days: CanonicalDay[] = sortedDates.map((date) => ({
    date,
    items: dayMap.get(date)!,
  }));

  return { days };
}

// ---------- createItem ----------

export async function createItem(
  tripId: string,
  userId: string,
  data: CreateItineraryItemInput
) {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .insert(itineraryItems)
      .values({
        tripId,
        itemType: data.itemType,
        title: data.title,
        date: data.date,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        location: data.location ?? null,
        confirmationNumber: data.confirmationNumber ?? null,
        bookingContact: data.bookingContact ?? null,
        participants: data.participants ?? null,
        contactNotes: data.contactNotes ?? null,
        cost: data.cost?.toString() ?? null,
        notes: data.notes ?? null,
        sortOrder: data.sortOrder ?? 0,
        source: "manual",
        createdBy: userId,
      } satisfies NewItineraryItem)
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "itinerary_item_created",
      actorId: userId,
      description: `Added "${data.title}" to itinerary on ${data.date}`,
      metadata: {
        itemId: item.id,
        itemType: data.itemType,
        date: data.date,
      },
    });

    return item;
  });
}

// ---------- updateItem ----------

export async function updateItem(
  itemId: string,
  userId: string,
  data: UpdateItineraryItemInput
) {
  const [existing] = await db
    .select()
    .from(itineraryItems)
    .where(eq(itineraryItems.id, itemId));

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.itemType !== undefined) updateData.itemType = data.itemType;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.startTime !== undefined)
    updateData.startTime = data.startTime ? new Date(data.startTime) : null;
  if (data.endTime !== undefined)
    updateData.endTime = data.endTime ? new Date(data.endTime) : null;
  if (data.location !== undefined) updateData.location = data.location ?? null;
  if (data.confirmationNumber !== undefined)
    updateData.confirmationNumber = data.confirmationNumber;
  if (data.bookingContact !== undefined)
    updateData.bookingContact = data.bookingContact;
  if (data.participants !== undefined)
    updateData.participants = data.participants ?? null;
  if (data.contactNotes !== undefined)
    updateData.contactNotes = data.contactNotes;
  if (data.cost !== undefined)
    updateData.cost = data.cost?.toString() ?? null;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(itineraryItems)
      .set(updateData)
      .where(eq(itineraryItems.id, itemId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: existing.tripId,
      eventType: "itinerary_item_updated",
      actorId: userId,
      description: `Updated "${updated.title}" in itinerary`,
      metadata: {
        itemId: updated.id,
        fields: Object.keys(updateData),
      },
    });

    return updated;
  });
}

// ---------- deleteItem ----------

export async function deleteItem(itemId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(itineraryItems)
    .where(eq(itineraryItems.id, itemId));

  if (!existing) return null;

  return db.transaction(async (tx) => {
    await tx.delete(itineraryItems).where(eq(itineraryItems.id, itemId));

    await tx.insert(activityFeedEntries).values({
      tripId: existing.tripId,
      eventType: "itinerary_item_deleted",
      actorId: userId,
      description: `Removed "${existing.title}" from itinerary`,
      metadata: {
        itemId: existing.id,
        itemType: existing.itemType,
        date: existing.date,
      },
    });

    return existing;
  });
}
