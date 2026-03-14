import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  date,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";

export const travelSourceEnum = pgEnum("travel_source", [
  "affiliate",
  "partner",
  "manual",
]);

export const lodgingOptions = pgTable(
  "lodging_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    source: travelSourceEnum("source").notNull().default("affiliate"),
    name: varchar("name", { length: 255 }).notNull(),
    location: jsonb("location").$type<{
      address?: string;
      city?: string;
      state?: string;
      lat?: number;
      lng?: number;
    }>(),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    guests: integer("guests").notNull(),
    pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
    bedrooms: integer("bedrooms"),
    linkUrl: varchar("link_url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    savedBy: uuid("saved_by")
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
  (table) => [index("idx_lodging_options_trip").on(table.tripId)]
);

export type LodgingOption = typeof lodgingOptions.$inferSelect;
export type NewLodgingOption = typeof lodgingOptions.$inferInsert;
