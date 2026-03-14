import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { users } from "./users";

export const reportTypeEnum = pgEnum("report_type", [
  "misclassified_access",
  "wrong_price",
  "closed_permanently",
  "duplicate",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewed",
  "resolved",
  "dismissed",
]);

export const courseReports = pgTable(
  "course_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),
    reportType: reportTypeEnum("report_type").notNull(),
    description: text("description").notNull(),
    status: reportStatusEnum("report_status").notNull().default("open"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_course_reports_course").on(table.courseId),
    index("idx_course_reports_status").on(table.status),
  ]
);

export type CourseReport = typeof courseReports.$inferSelect;
export type NewCourseReport = typeof courseReports.$inferInsert;
