import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { trips } from "./trips";

export const tripRoleEnum = pgEnum("trip_role", ["collaborator", "captain"]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
]);

export const inviteMethodEnum = pgEnum("invite_method", [
  "email",
  "share_link",
  "sms",
]);

export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    role: tripRoleEnum("role").notNull().default("collaborator"),
    responseStatus: inviteStatusEnum("response_status")
      .notNull()
      .default("pending"),
    inviteEmail: varchar("invite_email", { length: 255 }),
    inviteMethod: inviteMethodEnum("invite_method"),
    inviteToken: varchar("invite_token", { length: 64 }).unique(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id),
    hardConstraints: jsonb("hard_constraints").$type<{
      maxBudgetPerRound?: number;
      travelWindowStart?: string;
      travelWindowEnd?: string;
      preferredAirport?: string;
      willingPrivateRounds?: boolean;
    }>(),
    softPreferences: jsonb("soft_preferences").$type<{
      preferredTeeTime?: string;
      notes?: string;
    }>(),
    invitedAt: timestamp("invited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_trip_members_trip").on(table.tripId),
    index("idx_trip_members_user").on(table.userId),
    index("idx_trip_members_token").on(table.inviteToken),
    unique("uq_trip_member").on(table.tripId, table.userId),
  ]
);

export type TripMember = typeof tripMembers.$inferSelect;
export type NewTripMember = typeof tripMembers.$inferInsert;
