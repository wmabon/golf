import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { tripOptions } from "./trip-options";

export const voteValueEnum = pgEnum("vote_value", ["in", "fine", "out"]);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripOptionId: uuid("trip_option_id")
      .notNull()
      .references(() => tripOptions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    voteValue: voteValueEnum("vote_value").notNull(),
    comment: text("comment"),
    budgetObjection: boolean("budget_objection").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_votes_option").on(table.tripOptionId),
    index("idx_votes_user").on(table.userId),
    unique("uq_vote_per_option").on(table.tripOptionId, table.userId),
  ]
);

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
