import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as photoService from "@/services/media/photo.service";

type Params = { params: Promise<{ tripId: string; photoId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, photoId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const result = await photoService.getPhoto(photoId);
  if (!result) return errorResponse("Photo not found", 404);

  return NextResponse.json(result);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, photoId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  // Captain can delete any photo
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (captain) {
    const result = await photoService.deletePhotoAsCaptain(photoId);
    if ("error" in result) return errorResponse(result.error as string, 404);
    return NextResponse.json(result);
  }

  // Otherwise, only the uploader can delete
  const result = await photoService.deletePhoto(photoId, session!.user!.id!);
  if ("error" in result) {
    const status = result.error === "Photo not found" ? 404 : 403;
    return errorResponse(result.error as string, status);
  }

  return NextResponse.json(result);
}
