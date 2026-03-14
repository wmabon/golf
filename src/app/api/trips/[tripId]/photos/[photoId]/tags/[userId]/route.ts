import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as taggingService from "@/services/media/tagging.service";

type Params = {
  params: Promise<{ tripId: string; photoId: string; userId: string }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, photoId, userId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const result = await taggingService.removeTag(photoId, userId);
  if ("error" in result) return errorResponse(result.error as string, 404);

  return NextResponse.json(result);
}
