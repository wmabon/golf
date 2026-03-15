import { NextResponse } from "next/server";
import { requireConcierge, requireAdmin, errorResponse } from "@/lib/api-utils";
import * as courseCuration from "@/services/admin/course-curation.service";

export async function GET(request: Request) {
  const { error } = await requireConcierge();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const filters: Record<string, string> = {};

    const search = searchParams.get("search");
    if (search) filters.search = search;

    const accessType = searchParams.get("accessType");
    if (accessType) filters.accessType = accessType;

    const status = searchParams.get("status");
    if (status) filters.status = status;

    const courses = await courseCuration.listCourses(filters);
    return NextResponse.json({ courses });
  } catch {
    return errorResponse("Failed to list courses", 500);
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    // Minimal validation — admin is trusted, but require name
    if (!body.name || typeof body.name !== "string") {
      return errorResponse("Course name is required", 400);
    }

    // Delegate to the existing DB insert pattern
    const { db } = await import("@/lib/db");
    const { courses } = await import("@/lib/db/schema");

    const [course] = await db
      .insert(courses)
      .values({
        name: body.name,
        city: body.city ?? null,
        state: body.state ?? null,
        location: body.location ?? { lat: 0, lng: 0 },
        accessType: body.accessType ?? "unknown",
        accessConfidence: body.accessConfidence ?? "unverified",
        priceBandMin: body.priceBandMin ?? null,
        priceBandMax: body.priceBandMax ?? null,
        reasonsToPlay: body.reasonsToPlay ?? null,
        websiteUrl: body.websiteUrl ?? null,
        phone: body.phone ?? null,
        status: body.status ?? "draft",
      })
      .returning();

    return NextResponse.json({ course }, { status: 201 });
  } catch {
    return errorResponse("Failed to create course", 500);
  }
}
