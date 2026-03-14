import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as courseQualityService from "@/services/discovery/course-quality.service";

type Params = { params: Promise<{ courseId: string; tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { courseId, tripId } = await params;

  // Verify user is a member of the trip
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Forbidden", 403);

  const result = await courseQualityService.computeTripFitScore(
    courseId,
    tripId
  );

  if (!result) return errorResponse("Course or trip not found", 404);

  return NextResponse.json(result);
}
