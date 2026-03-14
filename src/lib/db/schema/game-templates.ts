import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const gameFormatEnum = pgEnum("game_format", [
  "stroke_play",
  "best_ball",
  "skins",
  "nassau",
  "custom",
]);

export const gameTemplates = pgTable("game_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  format: gameFormatEnum("format").notNull(),
  rulesDescription: text("rules_description"),
  automated: boolean("automated").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type GameTemplate = typeof gameTemplates.$inferSelect;
export type NewGameTemplate = typeof gameTemplates.$inferInsert;
