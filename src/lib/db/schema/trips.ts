import {
  pgTable,
  uuid,
  varchar,
  integer,
  date,
  decimal,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { tripSeries } from "./trip-series";

export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "planning",
  "voting",
  "booking",
  "locked",
  "in_progress",
  "completed",
  "archived",
]);

export const anchorTypeEnum = pgEnum("anchor_type", [
  "airport_code",
  "city_region",
  "map_area",
]);

export const swapPolicyEnum = pgEnum("swap_policy", [
  "notify_only",
  "captain_approval",
  "auto_upgrade",
]);

export const votingModeEnum = pgEnum("voting_mode", [
  "destination",
  "course",
]);

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    dateStart: date("date_start").notNull(),
    dateEnd: date("date_end").notNull(),
    golferCount: integer("golfer_count").notNull().default(4),
    anchorType: anchorTypeEnum("anchor_type").notNull(),
    anchorValue: varchar("anchor_value", { length: 255 }).notNull(),
    anchorLat: decimal("anchor_lat", { precision: 10, scale: 7 }),
    anchorLng: decimal("anchor_lng", { precision: 10, scale: 7 }),
    budgetSettings: jsonb("budget_settings").$type<{
      perRoundMin?: number;
      perRoundMax?: number;
    }>(),
    status: tripStatusEnum("status").notNull().default("draft"),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id),
    seriesId: uuid("series_id").references(() => tripSeries.id),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    freezeDate: date("freeze_date"),
    swapPolicy: swapPolicyEnum("swap_policy")
      .notNull()
      .default("captain_approval"),
    votingDeadline: timestamp("voting_deadline", { withTimezone: true }),
    votingMode: votingModeEnum("voting_mode").notNull().default("destination"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_trips_creator").on(table.creatorId),
    index("idx_trips_status").on(table.status),
  ]
);

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
