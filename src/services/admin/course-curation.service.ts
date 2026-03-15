import { eq, and, isNull, ilike, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  courses,
  courseRules,
  courseReports,
} from "@/lib/db/schema";
import type { CourseAccessType, CourseAccessConfidence, CourseStatus, ReportStatus } from "@/types";
import type { UpdateBookingRulesInput } from "@/lib/validation/admin-courses";

// ---------------------------------------------------------------------------
// listCourses
// ---------------------------------------------------------------------------

export async function listCourses(filters?: {
  search?: string;
  accessType?: string;
  status?: string;
}) {
  const conditions = [isNull(courses.deletedAt)];

  if (filters?.search) {
    conditions.push(ilike(courses.name, `%${filters.search}%`));
  }

  if (filters?.accessType) {
    conditions.push(
      eq(courses.accessType, filters.accessType as CourseAccessType)
    );
  }

  if (filters?.status) {
    conditions.push(eq(courses.status, filters.status as CourseStatus));
  }

  const rows = await db
    .select({
      id: courses.id,
      name: courses.name,
      city: courses.city,
      state: courses.state,
      accessType: courses.accessType,
      accessConfidence: courses.accessConfidence,
      priceBandMin: courses.priceBandMin,
      priceBandMax: courses.priceBandMax,
      status: courses.status,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .where(and(...conditions))
    .orderBy(courses.name);

  return rows;
}

// ---------------------------------------------------------------------------
// updateCourse
// ---------------------------------------------------------------------------

export async function updateCourse(
  courseId: string,
  data: Partial<{
    name: string;
    city: string;
    state: string;
    priceBandMin: string;
    priceBandMax: string;
    reasonsToPlay: string;
    websiteUrl: string;
    phone: string;
    status: CourseStatus;
  }>
) {
  const [updated] = await db
    .update(courses)
    .set(data)
    .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)))
    .returning();

  return updated ?? null;
}

// ---------------------------------------------------------------------------
// updateAccessClassification
// ---------------------------------------------------------------------------

export async function updateAccessClassification(
  courseId: string,
  accessType: CourseAccessType,
  accessConfidence: CourseAccessConfidence
) {
  const [updated] = await db
    .update(courses)
    .set({ accessType, accessConfidence })
    .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)))
    .returning();

  return updated ?? null;
}

// ---------------------------------------------------------------------------
// upsertBookingRules
// ---------------------------------------------------------------------------

export async function upsertBookingRules(
  courseId: string,
  rules: UpdateBookingRulesInput
) {
  // Check if rules already exist for this course
  const [existing] = await db
    .select({ id: courseRules.id })
    .from(courseRules)
    .where(eq(courseRules.courseId, courseId));

  const data: Record<string, unknown> = {};
  if (rules.bookingWindowDays !== undefined)
    data.bookingWindowDays = rules.bookingWindowDays;
  if (rules.cancellationDeadlineHours !== undefined)
    data.cancellationDeadlineHours = rules.cancellationDeadlineHours;
  if (rules.maxPlayers !== undefined) data.maxPlayers = rules.maxPlayers;
  if (rules.bookingChannel !== undefined)
    data.bookingChannel = rules.bookingChannel;
  if (rules.rulesConfirmed !== undefined)
    data.rulesConfirmed = rules.rulesConfirmed;
  if (rules.publicTimesAvailable !== undefined)
    data.publicTimesAvailable = rules.publicTimesAvailable;
  if (rules.bookingWindowRule !== undefined)
    data.bookingWindowRule = rules.bookingWindowRule;
  if (rules.cancellationRule !== undefined)
    data.cancellationRule = rules.cancellationRule;
  if (rules.cancellationPenaltyAmount !== undefined)
    data.cancellationPenaltyAmount = String(rules.cancellationPenaltyAmount);
  if (rules.notes !== undefined) data.notes = rules.notes;
  if (rules.source !== undefined) data.source = rules.source;

  if (existing) {
    const [updated] = await db
      .update(courseRules)
      .set(data)
      .where(eq(courseRules.id, existing.id))
      .returning();
    return updated;
  } else {
    const [inserted] = await db
      .insert(courseRules)
      .values({
        courseId,
        ...data,
      } as typeof courseRules.$inferInsert)
      .returning();
    return inserted;
  }
}

// ---------------------------------------------------------------------------
// listReports
// ---------------------------------------------------------------------------

export async function listReports(status?: string) {
  const conditions = [];

  if (status) {
    conditions.push(eq(courseReports.status, status as ReportStatus));
  }

  const rows = await db
    .select({
      id: courseReports.id,
      courseId: courseReports.courseId,
      reporterId: courseReports.reporterId,
      reportType: courseReports.reportType,
      description: courseReports.description,
      status: courseReports.status,
      reviewedBy: courseReports.reviewedBy,
      resolvedAt: courseReports.resolvedAt,
      createdAt: courseReports.createdAt,
      updatedAt: courseReports.updatedAt,
      courseName: courses.name,
      courseCity: courses.city,
      courseState: courses.state,
    })
    .from(courseReports)
    .innerJoin(courses, eq(courseReports.courseId, courses.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${courseReports.createdAt} DESC`);

  return rows;
}

// ---------------------------------------------------------------------------
// resolveReport
// ---------------------------------------------------------------------------

export async function resolveReport(
  reportId: string,
  adminId: string,
  newStatus: ReportStatus
) {
  const [updated] = await db
    .update(courseReports)
    .set({
      status: newStatus,
      reviewedBy: adminId,
      resolvedAt: newStatus === "resolved" ? new Date() : null,
    })
    .where(eq(courseReports.id, reportId))
    .returning();

  return updated ?? null;
}

// ---------------------------------------------------------------------------
// getReportsForCourse
// ---------------------------------------------------------------------------

export async function getReportsForCourse(courseId: string) {
  const rows = await db
    .select()
    .from(courseReports)
    .where(eq(courseReports.courseId, courseId))
    .orderBy(sql`${courseReports.createdAt} DESC`);

  return rows;
}

// ---------------------------------------------------------------------------
// getRulesForCourse
// ---------------------------------------------------------------------------

export async function getRulesForCourse(courseId: string) {
  const [rules] = await db
    .select()
    .from(courseRules)
    .where(eq(courseRules.courseId, courseId));

  return rules ?? null;
}
