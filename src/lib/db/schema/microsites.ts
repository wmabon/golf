import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trips";

export const micrositePublishStateEnum = pgEnum("microsite_publish_state", [
  "draft",
  "published",
  "unpublished",
]);

export const micrositeVisibilityEnum = pgEnum("microsite_visibility", [
  "unlisted",
  "public",
]);

export const microsites = pgTable(
  "microsites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .unique()
      .references(() => trips.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    selectedAssetIds: jsonb("selected_asset_ids")
      .$type<string[]>()
      .notNull(),
    content: jsonb("content"),
    publishState: micrositePublishStateEnum("publish_state")
      .notNull()
      .default("draft"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    visibilityMode: micrositeVisibilityEnum("visibility_mode")
      .notNull()
      .default("unlisted"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_microsites_slug").on(table.slug),
    index("idx_microsites_trip").on(table.tripId),
    index("idx_microsites_publish_state").on(table.publishState),
  ]
);

export type Microsite = typeof microsites.$inferSelect;
export type NewMicrosite = typeof microsites.$inferInsert;
