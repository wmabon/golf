import { NextResponse } from "next/server";
import { requireAdmin, parseBody, errorResponse } from "@/lib/api-utils";
import { resolveReportSchema } from "@/lib/validation/admin-courses";
import * as courseCuration from "@/services/admin/course-curation.service";

type Params = { params: Promise<{ reportId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { reportId } = await params;

  const parsed = await parseBody(request, resolveReportSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const report = await courseCuration.resolveReport(
      reportId,
      session!.user!.id!,
      parsed.data.status
    );
    if (!report) return errorResponse("Report not found", 404);

    return NextResponse.json({ report });
  } catch {
    return errorResponse("Failed to resolve report", 500);
  }
}
