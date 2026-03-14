import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as courseService from "@/services/discovery/course.service";
import * as courseQualityService from "@/services/discovery/course-quality.service";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;

  const course = await courseService.getCourse(courseId);
  if (!course) return errorResponse("Course not found", 404);

  const breakdown = await courseQualityService.getQualityBreakdown(courseId);

  return NextResponse.json(breakdown);
}
