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
import { rounds } from "./rounds";
import { gameTemplates } from "./game-templates";

export const gameStatusEnum = pgEnum("game_status", [
  "created",
  "in_play",
  "completed",
]);

export const games = pgTable(
  "games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => gameTemplates.id),
    name: varchar("name", { length: 255 }).notNull(),
    teams: jsonb("teams")
      .$type<{ name: string; playerIds: string[] }[]>()
      .notNull(),
    stakesPerPlayer: decimal("stakes_per_player", {
      precision: 10,
      scale: 2,
    }),
    results: jsonb("results"),
    status: gameStatusEnum("status").notNull().default("created"),
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
    index("idx_games_round").on(table.roundId),
    index("idx_games_status").on(table.status),
  ]
);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
