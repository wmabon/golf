import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { bookingRequests, assignedToTypeEnum } from "./booking-requests";

export const bookingSlotStatusEnum = pgEnum("booking_slot_status", [
  "pending",
  "attempting",
  "held",
  "confirmed",
  "failed",
  "released",
]);

export const bookingSlots = pgTable(
  "booking_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingRequestId: uuid("booking_request_id")
      .notNull()
      .references(() => bookingRequests.id, { onDelete: "cascade" }),
    groupNum: integer("group_num").notNull(),
    playerIds: jsonb("player_ids").$type<string[]>(),
    targetTime: varchar("target_time", { length: 10 }),
    status: bookingSlotStatusEnum("status").notNull().default("pending"),
    assignedToType: assignedToTypeEnum("assigned_to_type"),
    assignedToId: uuid("assigned_to_id"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    confirmationNumber: varchar("confirmation_number", { length: 255 }),
    confirmedTeeTime: timestamp("confirmed_tee_time", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_booking_slots_request").on(table.bookingRequestId),
  ]
);

export type BookingSlot = typeof bookingSlots.$inferSelect;
export type NewBookingSlot = typeof bookingSlots.$inferInsert;
