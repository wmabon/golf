import { NextResponse } from "next/server";
import { requireConcierge, errorResponse } from "@/lib/api-utils";
import * as bookingOps from "@/services/admin/booking-ops.service";

export async function GET(request: Request) {
  const { error } = await requireConcierge();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const assignedTo = searchParams.get("assignedTo") ?? undefined;

  try {
    const requests = await bookingOps.listPendingRequests({
      status,
      assignedTo,
    });
    return NextResponse.json({ requests });
  } catch (err) {
    return errorResponse("Failed to list booking requests", 500);
  }
}
