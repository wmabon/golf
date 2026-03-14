import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { geography } from "../postgis";

export const airports = pgTable(
  "airports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    iataCode: varchar("iata_code", { length: 10 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 2 }),
    location: geography("location").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // GIST index on location must be added manually to migration
    index("idx_airports_iata_code").on(table.iataCode),
  ]
);

export type Airport = typeof airports.$inferSelect;
export type NewAirport = typeof airports.$inferInsert;
