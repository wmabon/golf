import { NextResponse } from "next/server";
import { requireAdmin, parseBody, errorResponse } from "@/lib/api-utils";
import { updateBookingRulesSchema } from "@/lib/validation/admin-courses";
import * as courseCuration from "@/services/admin/course-curation.service";

type Params = { params: Promise<{ courseId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { courseId } = await params;

  const parsed = await parseBody(request, updateBookingRulesSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const rules = await courseCuration.upsertBookingRules(
      courseId,
      parsed.data
    );

    return NextResponse.json({ rules });
  } catch {
    return errorResponse("Failed to update booking rules", 500);
  }
}
