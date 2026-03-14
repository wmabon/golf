import {
  pgTable,
  uuid,
  varchar,
  decimal,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { bookingRequests } from "./booking-requests";
import { bookingSlots } from "./booking-slots";
import { trips } from "./trips";
import { courses } from "./courses";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "confirmed",
  "swappable",
  "locked",
  "played",
  "canceled",
  "no_show",
]);

export const bookingSourceEnum = pgEnum("booking_source", [
  "direct_api",
  "guided_checkout",
  "assisted",
  "external",
]);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingRequestId: uuid("booking_request_id")
      .notNull()
      .references(() => bookingRequests.id),
    bookingSlotId: uuid("booking_slot_id").references(() => bookingSlots.id),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    confirmationNumber: varchar("confirmation_number", { length: 255 }),
    teeTime: timestamp("tee_time", { withTimezone: true }).notNull(),
    playerIds: jsonb("player_ids").$type<string[]>().notNull(),
    costPerPlayer: decimal("cost_per_player", { precision: 10, scale: 2 }),
    totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
    bookingSource: bookingSourceEnum("booking_source").notNull(),
    status: reservationStatusEnum("status").notNull().default("confirmed"),
    cancellationDeadline: timestamp("cancellation_deadline", {
      withTimezone: true,
    }),
    cancellationPenaltyAmount: decimal("cancellation_penalty_amount", {
      precision: 10,
      scale: 2,
    }),
    feeState: varchar("fee_state", { length: 20 }),
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
    index("idx_reservations_trip").on(table.tripId),
    index("idx_reservations_course").on(table.courseId),
    index("idx_reservations_booking_request").on(table.bookingRequestId),
    index("idx_reservations_status").on(table.status),
  ]
);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
