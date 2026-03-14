import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-utils";
import * as airportService from "@/services/discovery/airport.service";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limitParam = searchParams.get("limit");

  if (!q || !q.trim()) {
    return errorResponse("Query parameter 'q' is required", 400);
  }

  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 50) : 10;

  const suggestions = await airportService.searchAirports(q, limit);
  return NextResponse.json({ suggestions });
}
