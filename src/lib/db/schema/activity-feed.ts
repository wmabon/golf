import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";

export const activityFeedEntries = pgTable(
  "activity_feed_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    actorId: uuid("actor_id").references(() => users.id),
    description: text("description").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_activity_trip_created").on(table.tripId, table.createdAt),
  ]
);

export type ActivityFeedEntry = typeof activityFeedEntries.$inferSelect;
export type NewActivityFeedEntry = typeof activityFeedEntries.$inferInsert;
