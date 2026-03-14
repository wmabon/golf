import { NextResponse } from "next/server";
import { requireConcierge, errorResponse } from "@/lib/api-utils";
import * as bookingOps from "@/services/admin/booking-ops.service";

export async function GET() {
  const { error } = await requireConcierge();
  if (error) return error;

  try {
    const requests = await bookingOps.listEscalated();
    return NextResponse.json({ requests });
  } catch (err) {
    return errorResponse("Failed to list escalated requests", 500);
  }
}
