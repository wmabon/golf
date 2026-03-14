import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { users } from "./users";

export const publishStateEnum = pgEnum("publish_state", [
  "private",
  "review_pending",
  "publish_eligible",
  "published",
  "withdrawn",
]);

export const photoAssets = pgTable(
  "photo_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    uploaderId: uuid("uploader_id")
      .notNull()
      .references(() => users.id),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    thumbnailKey: varchar("thumbnail_key", { length: 500 }),
    caption: text("caption"),
    metadata: jsonb("metadata").$type<{
      takenAt?: string;
      location?: { lat: number; lng: number };
    }>(),
    publishState: publishStateEnum("publish_state")
      .notNull()
      .default("private"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_photo_assets_trip").on(table.tripId),
    index("idx_photo_assets_uploader").on(table.uploaderId),
    index("idx_photo_assets_publish_state").on(table.publishState),
  ]
);

export type PhotoAsset = typeof photoAssets.$inferSelect;
export type NewPhotoAsset = typeof photoAssets.$inferInsert;
