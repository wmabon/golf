import {
  pgTable,
  uuid,
  text,
  decimal,
  integer,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { reservations } from "./reservations";
import { users } from "./users";

export const swapApprovalStateEnum = pgEnum("swap_approval_state", [
  "suggested",
  "approved",
  "declined",
  "auto_approved",
  "expired",
]);

export const reservationSwaps = pgTable(
  "reservation_swaps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    oldReservationId: uuid("old_reservation_id")
      .notNull()
      .references(() => reservations.id),
    newReservationId: uuid("new_reservation_id").references(
      () => reservations.id
    ),
    recommendationReason: text("recommendation_reason").notNull(),
    approvalState: swapApprovalStateEnum("approval_state")
      .notNull()
      .default("suggested"),
    costDeltaPerGolfer: decimal("cost_delta_per_golfer", {
      precision: 10,
      scale: 2,
    }),
    qualityDelta: decimal("quality_delta", { precision: 5, scale: 2 }),
    driveTimeDelta: integer("drive_time_delta"),
    cancellationPenalty: decimal("cancellation_penalty", {
      precision: 10,
      scale: 2,
    }),
    suggestedAt: timestamp("suggested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: uuid("decided_by").references(() => users.id),
    declineReason: text("decline_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_reservation_swaps_trip").on(table.tripId),
    index("idx_reservation_swaps_old_res").on(table.oldReservationId),
    index("idx_reservation_swaps_state").on(table.approvalState),
  ]
);

export type ReservationSwap = typeof reservationSwaps.$inferSelect;
export type NewReservationSwap = typeof reservationSwaps.$inferInsert;
