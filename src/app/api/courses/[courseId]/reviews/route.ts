import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as courseService from "@/services/discovery/course.service";
import * as courseReviewService from "@/services/discovery/course-review.service";
import { createReviewSchema } from "@/lib/validation/reviews";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize")) || 20)
  );

  const result = await courseReviewService.listReviews(courseId, page, pageSize);

  return NextResponse.json(result);
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId } = await params;

  const course = await courseService.getCourse(courseId);
  if (!course) return errorResponse("Course not found", 404);

  const parsed = await parseBody(request, createReviewSchema);
  if ("error" in parsed) return parsed.error;

  const review = await courseReviewService.createReview(
    courseId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ review }, { status: 201 });
}
