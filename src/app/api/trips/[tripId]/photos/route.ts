import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as photoService from "@/services/media/photo.service";
import { uploadPhotoSchema } from "@/lib/validation/media";
import type { PublishState } from "@/types";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const url = new URL(request.url);
  const publishState = url.searchParams.get("publishState") as PublishState | null;

  const photos = await photoService.listPhotos(
    tripId,
    publishState ? { publishState } : undefined
  );
  return NextResponse.json({ photos });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, uploadPhotoSchema);
  if ("error" in parsed) return parsed.error;

  const photo = await photoService.uploadPhoto(
    tripId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ photo }, { status: 201 });
}
