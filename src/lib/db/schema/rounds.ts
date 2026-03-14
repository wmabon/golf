import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { courses } from "./courses";

export const roundStatusEnum = pgEnum("round_status", [
  "scheduled",
  "in_progress",
  "completed",
  "finalized",
  "canceled",
]);

export const rounds = pgTable(
  "rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    roundDate: date("round_date").notNull(),
    format: varchar("format", { length: 50 }),
    status: roundStatusEnum("status").notNull().default("scheduled"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_rounds_trip").on(table.tripId),
    index("idx_rounds_course").on(table.courseId),
    index("idx_rounds_status").on(table.status),
  ]
);

export type Round = typeof rounds.$inferSelect;
export type NewRound = typeof rounds.$inferInsert;
