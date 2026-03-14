import {
  pgTable,
  uuid,
  varchar,
  date,
  decimal,
  text,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { reservations } from "./reservations";
import { users } from "./users";

export const itineraryItemTypeEnum = pgEnum("itinerary_item_type", [
  "golf",
  "lodging",
  "flight",
  "dining",
  "transport",
  "note",
  "other",
]);

export const itineraryItemStatusEnum = pgEnum("itinerary_item_status", [
  "confirmed",
  "pending",
  "canceled",
  "completed",
]);

export const itineraryItemSourceEnum = pgEnum("itinerary_item_source", [
  "platform",
  "external",
  "manual",
]);

export const itineraryItems = pgTable(
  "itinerary_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    itemType: itineraryItemTypeEnum("item_type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    date: date("date").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),
    location: jsonb("location").$type<{
      address?: string;
      lat?: number;
      lng?: number;
    }>(),
    confirmationNumber: varchar("confirmation_number", { length: 255 }),
    bookingContact: varchar("booking_contact", { length: 255 }),
    participants: jsonb("participants").$type<string[]>(),
    contactNotes: text("contact_notes"),
    cost: decimal("cost", { precision: 10, scale: 2 }),
    notes: text("notes"),
    status: itineraryItemStatusEnum("status").notNull().default("confirmed"),
    source: itineraryItemSourceEnum("source").notNull().default("manual"),
    relatedReservationId: uuid("related_reservation_id").references(
      () => reservations.id
    ),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_itinerary_items_trip_date").on(table.tripId, table.date),
  ]
);

export type ItineraryItem = typeof itineraryItems.$inferSelect;
export type NewItineraryItem = typeof itineraryItems.$inferInsert;
