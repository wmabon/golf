import {
  pgTable,
  uuid,
  decimal,
  integer,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";

export const courseComposites = pgTable(
  "course_composites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" })
      .unique(),
    editorialScore: decimal("editorial_score", { precision: 5, scale: 2 }),
    externalRankScore: decimal("external_rank_score", {
      precision: 5,
      scale: 2,
    }),
    valueScore: decimal("value_score", { precision: 5, scale: 2 }),
    communityAverageScore: decimal("community_average_score", {
      precision: 5,
      scale: 2,
    }),
    reviewCount: integer("review_count").notNull().default(0),
    tripFitInputs: jsonb("trip_fit_inputs").$type<Record<string, number>>(),
    valueLabel: varchar("value_label", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_course_composites_course").on(table.courseId)]
);

export type CourseComposite = typeof courseComposites.$inferSelect;
export type NewCourseComposite = typeof courseComposites.$inferInsert;
