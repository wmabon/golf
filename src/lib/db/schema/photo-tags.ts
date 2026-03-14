import {
  pgTable,
  uuid,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { photoAssets } from "./photo-assets";
import { users } from "./users";

export const photoTags = pgTable(
  "photo_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photoAssetId: uuid("photo_asset_id")
      .notNull()
      .references(() => photoAssets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    taggedById: uuid("tagged_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_photo_tags_photo_user").on(table.photoAssetId, table.userId),
    index("idx_photo_tags_photo_asset").on(table.photoAssetId),
    index("idx_photo_tags_user").on(table.userId),
  ]
);

export type PhotoTag = typeof photoTags.$inferSelect;
export type NewPhotoTag = typeof photoTags.$inferInsert;
