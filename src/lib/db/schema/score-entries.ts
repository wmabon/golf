import {
  pgTable,
  uuid,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { rounds } from "./rounds";
import { users } from "./users";

export const scoreEntries = pgTable(
  "score_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => users.id),
    holeNumber: integer("hole_number").notNull(),
    strokes: integer("strokes").notNull(),
    netStrokes: integer("net_strokes"),
    clientTimestamp: timestamp("client_timestamp", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_score_entries_round_player_hole").on(
      table.roundId,
      table.playerId,
      table.holeNumber
    ),
    index("idx_score_entries_round").on(table.roundId),
    index("idx_score_entries_player").on(table.playerId),
  ]
);

export type ScoreEntry = typeof scoreEntries.$inferSelect;
export type NewScoreEntry = typeof scoreEntries.$inferInsert;
