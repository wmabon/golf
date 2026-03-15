import { NextResponse } from "next/server";
import {
  requireConcierge,
  requireAdmin,
  errorResponse,
} from "@/lib/api-utils";
import * as courseService from "@/services/discovery/course.service";
import * as courseCuration from "@/services/admin/course-curation.service";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireConcierge();
  if (error) return error;

  const { courseId } = await params;

  try {
    const course = await courseService.getCourseById(courseId);
    if (!course) return errorResponse("Course not found", 404);

    return NextResponse.json({ course });
  } catch {
    return errorResponse("Failed to fetch course", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { courseId } = await params;

  try {
    const body = await request.json();

    const course = await courseCuration.updateCourse(courseId, body);
    if (!course) return errorResponse("Course not found", 404);

    return NextResponse.json({ course });
  } catch {
    return errorResponse("Failed to update course", 500);
  }
}
