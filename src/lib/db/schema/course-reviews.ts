import {
  pgTable,
  uuid,
  integer,
  decimal,
  text,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { users } from "./users";

export const courseReviews = pgTable(
  "course_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roundId: uuid("round_id"), // FK to rounds table added when rounds schema exists
    conditioning: integer("conditioning").notNull(), // 1-5
    layout: integer("layout").notNull(),
    value: integer("value").notNull(),
    pace: integer("pace").notNull(),
    service: integer("service").notNull(),
    vibe: integer("vibe").notNull(),
    overallScore: decimal("overall_score", { precision: 3, scale: 1 }).notNull(),
    text: text("text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_course_reviews_course").on(table.courseId),
    index("idx_course_reviews_user").on(table.userId),
    unique("uq_course_review_per_user").on(table.courseId, table.userId),
  ]
);

export type CourseReview = typeof courseReviews.$inferSelect;
export type NewCourseReview = typeof courseReviews.$inferInsert;
