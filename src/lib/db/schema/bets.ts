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
import { rounds } from "./rounds";
import { users } from "./users";

export const betStatusEnum = pgEnum("bet_status", [
  "proposed",
  "accepted",
  "declined",
  "resolved",
  "voided",
  "expired",
]);

export const bets = pgTable(
  "bets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    roundId: uuid("round_id").references(() => rounds.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }),
    amount: decimal("amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    triggerDescription: text("trigger_description").notNull(),
    status: betStatusEnum("status").notNull().default("proposed"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    outcome: text("outcome"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_bets_trip").on(table.tripId),
    index("idx_bets_round").on(table.roundId),
    index("idx_bets_status").on(table.status),
  ]
);

export type Bet = typeof bets.$inferSelect;
export type NewBet = typeof bets.$inferInsert;
