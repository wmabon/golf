import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as taggingService from "@/services/media/tagging.service";
import { tagPhotoSchema } from "@/lib/validation/media";

type Params = { params: Promise<{ tripId: string; photoId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, photoId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, tagPhotoSchema);
  if ("error" in parsed) return parsed.error;

  const result = await taggingService.tagUsers(
    photoId,
    parsed.data.userIds,
    session!.user!.id!
  );

  return NextResponse.json(result, { status: 201 });
}
