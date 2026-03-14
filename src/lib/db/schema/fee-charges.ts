import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";
import { feeTypeEnum } from "./fee-schedules";
import { feeSchedules } from "./fee-schedules";

export const feeChargeStatusEnum = pgEnum("fee_charge_status", [
  "pending",
  "collectible",
  "charged",
  "refunded",
  "waived",
]);

export const feeCharges = pgTable(
  "fee_charges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    feeType: feeTypeEnum("fee_type").notNull(),
    sourceObjectType: varchar("source_object_type", { length: 50 }).notNull(),
    sourceObjectId: uuid("source_object_id").notNull(),
    feeScheduleId: uuid("fee_schedule_id").references(() => feeSchedules.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
    status: feeChargeStatusEnum("status").notNull().default("pending"),
    paymentReference: varchar("payment_reference", { length: 255 }),
    disclosedAt: timestamp("disclosed_at", { withTimezone: true }),
    chargedAt: timestamp("charged_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
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
    index("idx_fee_charges_trip_id").on(table.tripId),
    index("idx_fee_charges_user_id").on(table.userId),
    index("idx_fee_charges_status").on(table.status),
    index("idx_fee_charges_source_object_id").on(table.sourceObjectId),
  ]
);

export type FeeCharge = typeof feeCharges.$inferSelect;
export type NewFeeCharge = typeof feeCharges.$inferInsert;
