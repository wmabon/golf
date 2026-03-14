import { NextResponse } from "next/server";
import { requireAdmin, parseBody, errorResponse } from "@/lib/api-utils";
import * as courseService from "@/services/discovery/course.service";
import * as courseQualityService from "@/services/discovery/course-quality.service";
import { updateQualityScoresSchema } from "@/lib/validation/reviews";

type Params = { params: Promise<{ courseId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { courseId } = await params;

  const course = await courseService.getCourse(courseId);
  if (!course) return errorResponse("Course not found", 404);

  const parsed = await parseBody(request, updateQualityScoresSchema);
  if ("error" in parsed) return parsed.error;

  const composites = await courseQualityService.updateQualityScores(
    courseId,
    parsed.data
  );

  return NextResponse.json({ composites });
}
