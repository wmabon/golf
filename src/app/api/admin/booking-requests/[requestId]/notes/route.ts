import { NextResponse } from "next/server";
import {
  requireConcierge,
  parseBody,
  errorResponse,
} from "@/lib/api-utils";
import { addNoteSchema } from "@/lib/validation/admin-booking";
import * as bookingOps from "@/services/admin/booking-ops.service";

type Params = { params: Promise<{ requestId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireConcierge();
  if (error) return error;

  const { requestId } = await params;

  const parsed = await parseBody(request, addNoteSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const result = await bookingOps.addNote(
      requestId,
      session!.user!.id!,
      parsed.data
    );
    if ("error" in result) return errorResponse(result.error as string, 400);

    return NextResponse.json({ request: result.request });
  } catch (err) {
    return errorResponse("Failed to add note", 500);
  }
}
