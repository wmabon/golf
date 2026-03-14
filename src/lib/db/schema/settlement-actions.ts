import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { users } from "./users";

export const settlementStatusEnum = pgEnum("settlement_status", [
  "pending",
  "confirmed",
]);

export const settlementActions = pgTable(
  "settlement_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    method: varchar("method", { length: 50 }),
    deepLinkUrl: varchar("deep_link_url", { length: 500 }),
    status: settlementStatusEnum("status").notNull().default("pending"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_settlement_actions_trip").on(table.tripId),
    index("idx_settlement_actions_from_user").on(table.fromUserId),
    index("idx_settlement_actions_to_user").on(table.toUserId),
    index("idx_settlement_actions_status").on(table.status),
  ]
);

export type SettlementAction = typeof settlementActions.$inferSelect;
export type NewSettlementAction = typeof settlementActions.$inferInsert;
