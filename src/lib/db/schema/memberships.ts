import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const verifiedStatusEnum = pgEnum("verified_status", [
  "unverified",
  "pending_verification",
  "verified",
  "rejected",
]);

export const membershipEntitlements = pgTable(
  "membership_entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clubName: varchar("club_name", { length: 255 }).notNull(),
    networkName: varchar("network_name", { length: 255 }),
    accessType: varchar("access_type", { length: 50 }).notNull(),
    verifiedStatus: verifiedStatusEnum("verified_status")
      .notNull()
      .default("unverified"),
    willingToSponsor: boolean("willing_to_sponsor").notNull().default(false),
    guestLimitNotes: text("guest_limit_notes"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_memberships_user_id").on(table.userId),
    index("idx_memberships_network").on(table.networkName),
  ]
);

export type MembershipEntitlement =
  typeof membershipEntitlements.$inferSelect;
export type NewMembershipEntitlement =
  typeof membershipEntitlements.$inferInsert;
