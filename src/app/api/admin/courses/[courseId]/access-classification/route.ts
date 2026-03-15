import { NextResponse } from "next/server";
import { requireAdmin, parseBody, errorResponse } from "@/lib/api-utils";
import { updateAccessSchema } from "@/lib/validation/admin-courses";
import * as courseCuration from "@/services/admin/course-curation.service";

type Params = { params: Promise<{ courseId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { courseId } = await params;

  const parsed = await parseBody(request, updateAccessSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const course = await courseCuration.updateAccessClassification(
      courseId,
      parsed.data.accessType,
      parsed.data.accessConfidence
    );
    if (!course) return errorResponse("Course not found", 404);

    return NextResponse.json({ course });
  } catch {
    return errorResponse("Failed to update access classification", 500);
  }
}
