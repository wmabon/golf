import {
  pgTable,
  uuid,
  varchar,
  integer,
  date,
  text,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";
import { courses } from "./courses";

export const bookingRequestStatusEnum = pgEnum("booking_request_status", [
  "candidate",
  "window_pending",
  "requested",
  "partial_hold",
  "booked",
  "swappable",
  "locked",
  "played",
  "canceled",
]);

export const bookingModeEnum = pgEnum("booking_mode", [
  "direct",
  "guided_checkout",
  "assisted",
]);

export const assignedToTypeEnum = pgEnum("assigned_to_type", [
  "user",
  "automation",
  "concierge",
]);

export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    targetDate: date("target_date").notNull(),
    targetTimeRange: jsonb("target_time_range")
      .$type<{ earliest: string; latest: string }>()
      .notNull(),
    preferredTime: varchar("preferred_time", { length: 10 }),
    numGolfers: integer("num_golfers").notNull(),
    partySplit: jsonb("party_split").$type<number[]>(),
    mode: bookingModeEnum("mode").notNull(),
    status: bookingRequestStatusEnum("status")
      .notNull()
      .default("candidate"),
    bookingWindowOpensAt: timestamp("booking_window_opens_at", {
      withTimezone: true,
    }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    assignedTo: uuid("assigned_to").references(() => users.id),
    assignedToType: assignedToTypeEnum("assigned_to_type"),
    notes: text("notes"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_booking_requests_trip").on(table.tripId),
    index("idx_booking_requests_course").on(table.courseId),
    index("idx_booking_requests_status").on(table.status),
  ]
);

export type BookingRequest = typeof bookingRequests.$inferSelect;
export type NewBookingRequest = typeof bookingRequests.$inferInsert;
