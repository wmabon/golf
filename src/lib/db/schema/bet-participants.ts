import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { bets } from "./bets";
import { users } from "./users";

export const betParticipantStatusEnum = pgEnum("bet_participant_status", [
  "pending",
  "accepted",
  "declined",
]);

export const betParticipants = pgTable(
  "bet_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    betId: uuid("bet_id")
      .notNull()
      .references(() => bets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    side: varchar("side", { length: 100 }),
    status: betParticipantStatusEnum("status").notNull().default("pending"),
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
    unique("uq_bet_participants_bet_user").on(table.betId, table.userId),
    index("idx_bet_participants_bet").on(table.betId),
    index("idx_bet_participants_user").on(table.userId),
    index("idx_bet_participants_status").on(table.status),
  ]
);

export type BetParticipant = typeof betParticipants.$inferSelect;
export type NewBetParticipant = typeof betParticipants.$inferInsert;
