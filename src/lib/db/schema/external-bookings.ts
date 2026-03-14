import {
  pgTable,
  uuid,
  varchar,
  decimal,
  date,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";

export const externalBookingTypeEnum = pgEnum("external_booking_type", [
  "golf",
  "lodging",
  "flight",
  "other",
]);

export const externalBookings = pgTable(
  "external_bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    type: externalBookingTypeEnum("type").notNull(),
    source: varchar("source", { length: 255 }),
    confirmationNumber: varchar("confirmation_number", { length: 255 }),
    date: date("date").notNull(),
    time: varchar("time", { length: 10 }),
    cost: decimal("cost", { precision: 10, scale: 2 }),
    bookingContact: varchar("booking_contact", { length: 255 }),
    notes: text("notes"),
    linkUrl: varchar("link_url", { length: 500 }),
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
  (table) => [index("idx_external_bookings_trip").on(table.tripId)]
);

export type ExternalBooking = typeof externalBookings.$inferSelect;
export type NewExternalBooking = typeof externalBookings.$inferInsert;
