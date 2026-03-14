import {
  pgTable,
  uuid,
  decimal,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const feeTypeEnum = pgEnum("fee_type", [
  "tee_time_service",
  "bet_fee",
  "lodging_service",
  "air_service",
  "cancellation_penalty",
  "pass_through",
]);

export const feeCalculationMethodEnum = pgEnum("fee_calculation_method", [
  "flat",
  "percentage",
]);

export const feeSchedules = pgTable(
  "fee_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    feeType: feeTypeEnum("fee_type").notNull(),
    calculationMethod: feeCalculationMethodEnum("calculation_method").notNull(),
    flatAmount: decimal("flat_amount", { precision: 10, scale: 2 }),
    percentageRate: decimal("percentage_rate", { precision: 5, scale: 4 }),
    perGolferCap: decimal("per_golfer_cap", { precision: 10, scale: 2 }),
    effectiveFrom: timestamp("effective_from", {
      withTimezone: true,
    }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_fee_schedules_fee_type").on(table.feeType),
    index("idx_fee_schedules_effective_from").on(table.effectiveFrom),
  ]
);

export type FeeSchedule = typeof feeSchedules.$inferSelect;
export type NewFeeSchedule = typeof feeSchedules.$inferInsert;
