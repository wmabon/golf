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
import { trips } from "./trips";
import { users } from "./users";

export const expenseCategoryEnum = pgEnum("expense_category", [
  "tee_time",
  "lodging",
  "meal",
  "transport",
  "other",
]);

export const splitMethodEnum = pgEnum("split_method", [
  "equal",
  "custom",
  "exclude",
]);

export const tripExpenses = pgTable(
  "trip_expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    payerId: uuid("payer_id")
      .notNull()
      .references(() => users.id),
    description: varchar("description", { length: 500 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    category: expenseCategoryEnum("category").notNull(),
    splitMethod: splitMethodEnum("split_method").notNull().default("equal"),
    customSplits: jsonb("custom_splits").$type<
      { userId: string; amount: number }[]
    >(),
    excludedUserIds: jsonb("excluded_user_ids").$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_trip_expenses_trip").on(table.tripId),
    index("idx_trip_expenses_payer").on(table.payerId),
  ]
);

export type TripExpense = typeof tripExpenses.$inferSelect;
export type NewTripExpense = typeof tripExpenses.$inferInsert;
