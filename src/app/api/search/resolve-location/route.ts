import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as airportService from "@/services/discovery/airport.service";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || !query.trim()) {
    return errorResponse("Query parameter is required", 400);
  }

  const location = await airportService.resolveLocation(query);
  if (!location) {
    return errorResponse("Location not found", 404);
  }

  return NextResponse.json({ location });
}
