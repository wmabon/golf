import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as courseReviewService from "@/services/discovery/course-review.service";
import { updateReviewSchema } from "@/lib/validation/reviews";

type Params = { params: Promise<{ courseId: string; reviewId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { reviewId } = await params;

  const parsed = await parseBody(request, updateReviewSchema);
  if ("error" in parsed) return parsed.error;

  const review = await courseReviewService.updateReview(
    reviewId,
    session!.user!.id!,
    parsed.data
  );

  if (!review) return errorResponse("Review not found", 404);

  return NextResponse.json({ review });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { reviewId } = await params;

  const deleted = await courseReviewService.deleteReview(
    reviewId,
    session!.user!.id!
  );

  if (!deleted) return errorResponse("Review not found", 404);

  return NextResponse.json({ success: true });
}
