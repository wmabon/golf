import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id").references(() => trips.id, {
      onDelete: "cascade",
    }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body").notNull(),
    linkUrl: varchar("link_url", { length: 500 }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_notifications_user_read").on(
      table.userId,
      table.readAt,
      table.createdAt
    ),
    index("idx_notifications_user_created").on(
      table.userId,
      table.createdAt
    ),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
