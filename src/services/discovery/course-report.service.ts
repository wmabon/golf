import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseReports, type NewCourseReport } from "@/lib/db/schema";

export async function createReport(
  courseId: string,
  reporterId: string,
  data: { reportType: NewCourseReport["reportType"]; description: string }
) {
  const [report] = await db
    .insert(courseReports)
    .values({
      courseId,
      reporterId,
      reportType: data.reportType,
      description: data.description,
    })
    .returning();

  return report;
}

export async function listReportsForCourse(courseId: string) {
  return db
    .select()
    .from(courseReports)
    .where(eq(courseReports.courseId, courseId))
    .orderBy(desc(courseReports.createdAt));
}
