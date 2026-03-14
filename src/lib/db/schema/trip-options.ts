import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { courses } from "./courses";

export const tripOptionTypeEnum = pgEnum("trip_option_type", [
  "destination",
  "course",
  "itinerary",
]);

export const tripOptionStatusEnum = pgEnum("trip_option_status", [
  "proposed",
  "shortlisted",
  "voting",
  "finalized",
  "eliminated",
]);

export const tripOptions = pgTable(
  "trip_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    courseId: uuid("course_id").references(() => courses.id),
    type: tripOptionTypeEnum("type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    estimatedCostPerGolfer: decimal("estimated_cost_per_golfer", {
      precision: 10,
      scale: 2,
    }),
    fitScore: decimal("fit_score", { precision: 5, scale: 2 }),
    fitRationale: text("fit_rationale"),
    status: tripOptionStatusEnum("status").notNull().default("proposed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_trip_options_trip").on(table.tripId)]
);

export type TripOption = typeof tripOptions.$inferSelect;
export type NewTripOption = typeof tripOptions.$inferInsert;
