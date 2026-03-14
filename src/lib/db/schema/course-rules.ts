import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";

export const courseRules = pgTable(
  "course_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" })
      .unique(),
    bookingWindowRule: text("booking_window_rule"),
    bookingWindowDays: integer("booking_window_days"),
    cancellationRule: text("cancellation_rule"),
    cancellationDeadlineHours: integer("cancellation_deadline_hours"),
    maxPlayers: integer("max_players"),
    publicTimesAvailable: boolean("public_times_available"),
    bookingChannel: varchar("booking_channel", { length: 50 }),
    cancellationPenaltyAmount: decimal("cancellation_penalty_amount", {
      precision: 10,
      scale: 2,
    }),
    rulesConfirmed: boolean("rules_confirmed").notNull().default(false),
    notes: text("notes"),
    source: varchar("source", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_course_rules_course").on(table.courseId)]
);

export type CourseRule = typeof courseRules.$inferSelect;
export type NewCourseRule = typeof courseRules.$inferInsert;
