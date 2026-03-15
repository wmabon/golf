import { NextResponse } from "next/server";
import { requireConcierge, errorResponse } from "@/lib/api-utils";
import * as courseCuration from "@/services/admin/course-curation.service";

export async function GET(request: Request) {
  const { error } = await requireConcierge();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    const reports = await courseCuration.listReports(status);
    return NextResponse.json({ reports });
  } catch {
    return errorResponse("Failed to list reports", 500);
  }
}
