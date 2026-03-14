import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as courseService from "@/services/discovery/course.service";
import * as courseReportService from "@/services/discovery/course-report.service";
import { createReportSchema } from "@/lib/validation/courses";

type Params = { params: Promise<{ courseId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;

  const course = await courseService.getCourse(courseId);
  if (!course) return errorResponse("Course not found", 404);

  const parsed = await parseBody(request, createReportSchema);
  if ("error" in parsed) return parsed.error;

  const report = await courseReportService.createReport(
    courseId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ report }, { status: 201 });
}
