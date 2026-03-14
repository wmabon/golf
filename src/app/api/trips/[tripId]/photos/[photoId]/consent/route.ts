import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as consentService from "@/services/media/consent.service";
import { consentSchema } from "@/lib/validation/media";

type Params = { params: Promise<{ tripId: string; photoId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, photoId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, consentSchema);
  if ("error" in parsed) return parsed.error;

  const result = await consentService.submitConsent(
    photoId,
    session!.user!.id!,
    parsed.data.decision
  );

  if ("error" in result) {
    const status =
      result.error === "No consent record found for this user" ? 404 : 409;
    return errorResponse(result.error as string, status);
  }

  return NextResponse.json(result);
}
