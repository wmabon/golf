import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { photoAssets } from "./photo-assets";
import { users } from "./users";

export const consentStateEnum = pgEnum("consent_state", [
  "pending",
  "approved",
  "vetoed",
]);

export const photoConsents = pgTable(
  "photo_consents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photoAssetId: uuid("photo_asset_id")
      .notNull()
      .references(() => photoAssets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    consentState: consentStateEnum("consent_state")
      .notNull()
      .default("pending"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_photo_consents_photo_user").on(
      table.photoAssetId,
      table.userId
    ),
    index("idx_photo_consents_photo_asset").on(table.photoAssetId),
    index("idx_photo_consents_status").on(table.consentState),
  ]
);

export type PhotoConsent = typeof photoConsents.$inferSelect;
export type NewPhotoConsent = typeof photoConsents.$inferInsert;
