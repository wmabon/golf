import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "deactivated",
]);

export const systemRoleEnum = pgEnum("system_role", [
  "user",
  "admin",
  "concierge_ops",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  phone: varchar("phone", { length: 20 }),
  handicap: decimal("handicap", { precision: 3, scale: 1 }),
  homeAirport: varchar("home_airport", { length: 10 }),
  preferredLocation: varchar("preferred_location", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  status: userStatusEnum("status").notNull().default("active"),
  systemRole: systemRoleEnum("system_role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
