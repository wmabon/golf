import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";
import { travelSourceEnum } from "./lodging-options";

export const flightOptions = pgTable(
  "flight_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    source: travelSourceEnum("source").notNull().default("affiliate"),
    airline: varchar("airline", { length: 100 }),
    departureAirport: varchar("departure_airport", { length: 10 }).notNull(),
    arrivalAirport: varchar("arrival_airport", { length: 10 }).notNull(),
    departureTime: timestamp("departure_time", { withTimezone: true }).notNull(),
    arrivalTime: timestamp("arrival_time", { withTimezone: true }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }),
    passengers: integer("passengers").notNull().default(1),
    linkUrl: varchar("link_url", { length: 500 }),
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
  (table) => [index("idx_flight_options_trip").on(table.tripId)]
);

export type FlightOption = typeof flightOptions.$inferSelect;
export type NewFlightOption = typeof flightOptions.$inferInsert;
