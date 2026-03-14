import { NextResponse } from "next/server";
import { requireConcierge, parseBody, errorResponse } from "@/lib/api-utils";
import { assignRequestSchema } from "@/lib/validation/admin-booking";
import * as bookingOps from "@/services/admin/booking-ops.service";

type Params = { params: Promise<{ requestId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireConcierge();
  if (error) return error;

  const { requestId } = await params;

  const parsed = await parseBody(request, assignRequestSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const result = await bookingOps.assignRequest(
      requestId,
      parsed.data.assignedTo
    );
    if ("error" in result) return errorResponse(result.error as string, 400);

    return NextResponse.json({ request: result.request });
  } catch (err) {
    return errorResponse("Failed to assign booking request", 500);
  }
}
