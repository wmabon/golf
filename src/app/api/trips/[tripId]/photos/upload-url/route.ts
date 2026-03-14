import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as photoService from "@/services/media/photo.service";

type Params = { params: Promise<{ tripId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const result = await photoService.getPresignedUploadUrl(tripId);
  return NextResponse.json(result);
}
