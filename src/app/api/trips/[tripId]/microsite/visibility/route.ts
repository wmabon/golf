import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as micrositeService from "@/services/media/microsite.service";
import { visibilitySchema } from "@/lib/validation/media";

type Params = { params: Promise<{ tripId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const captain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (!captain)
    return errorResponse(
      "Only the captain can change microsite visibility",
      403
    );

  const parsed = await parseBody(request, visibilitySchema);
  if ("error" in parsed) return parsed.error;

  const result = await micrositeService.setVisibility(
    tripId,
    parsed.data.mode
  );

  if ("error" in result) return errorResponse(result.error as string, 404);

  return NextResponse.json(result);
}
