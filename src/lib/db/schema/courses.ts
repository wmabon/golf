import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { geography } from "../postgis";

export const courseAccessTypeEnum = pgEnum("course_access_type", [
  "public",
  "resort",
  "semi_private",
  "private",
  "unknown",
]);

export const courseAccessConfidenceEnum = pgEnum("course_access_confidence", [
  "verified",
  "unverified",
  "disputed",
]);

export const courseStatusEnum = pgEnum("course_status", [
  "draft",
  "active",
  "hidden",
  "archived",
]);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 2 }),
    location: geography("location").notNull(),
    accessType: courseAccessTypeEnum("access_type")
      .notNull()
      .default("public"),
    accessConfidence: courseAccessConfidenceEnum("access_confidence")
      .notNull()
      .default("unverified"),
    priceBandMin: decimal("price_band_min", { precision: 10, scale: 2 }),
    priceBandMax: decimal("price_band_max", { precision: 10, scale: 2 }),
    reasonsToPlay: text("reasons_to_play"),
    websiteUrl: varchar("website_url", { length: 500 }),
    phone: varchar("phone", { length: 20 }),
    amenities: jsonb("amenities").$type<{
      driving_range?: boolean;
      putting_green?: boolean;
      pro_shop?: boolean;
      restaurant?: boolean;
      lodging?: boolean;
      caddie_available?: boolean;
      walking_allowed?: boolean;
    }>(),
    photos: jsonb("photos").$type<string[]>(),
    status: courseStatusEnum("status").notNull().default("active"),
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
    // GIST index on location must be added manually to migration
    index("idx_courses_access_type").on(table.accessType),
    index("idx_courses_course_status").on(table.status),
    index("idx_courses_state").on(table.state),
    index("idx_courses_price_max").on(table.priceBandMax),
  ]
);

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
