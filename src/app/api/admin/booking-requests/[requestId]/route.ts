import { NextResponse } from "next/server";
import { requireConcierge, errorResponse } from "@/lib/api-utils";
import * as bookingOps from "@/services/admin/booking-ops.service";

type Params = { params: Promise<{ requestId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireConcierge();
  if (error) return error;

  const { requestId } = await params;

  try {
    const detail = await bookingOps.getRequestDetail(requestId);
    if (!detail) return errorResponse("Booking request not found", 404);

    return NextResponse.json({ request: detail });
  } catch (err) {
    return errorResponse("Failed to fetch booking request", 500);
  }
}
