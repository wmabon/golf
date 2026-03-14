import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as airportService from "@/services/discovery/airport.service";
import * as courseSearchService from "@/services/discovery/course-search.service";
import { searchCoursesSchema } from "@/lib/validation/courses";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = await parseBody(request, searchCoursesSchema);
  if ("error" in parsed) return parsed.error;

  const { anchor, radiusMiles, priceBand, accessTypes, includePrivate, tripId, sortBy, page, pageSize } = parsed.data;

  // Handle bounds search separately
  if (anchor.type === "bounds") {
    const results = await courseSearchService.searchCoursesByBounds({
      sw: anchor.value.sw,
      ne: anchor.value.ne,
      priceBand,
      accessTypes,
      includePrivate,
      tripId,
      sortBy,
    });
    return NextResponse.json(results);
  }

  // Resolve anchor to lat/lng
  let lat: number;
  let lng: number;

  if (anchor.type === "coordinates") {
    lat = anchor.value.lat;
    lng = anchor.value.lng;
  } else if (anchor.type === "airport") {
    const airport = await airportService.getAirportByCode(anchor.value);
    if (!airport) {
      return errorResponse(`Airport not found: ${anchor.value}`, 404);
    }
    lat = airport.lat;
    lng = airport.lng;
  } else {
    // city
    const location = await airportService.resolveLocation(anchor.value);
    if (!location) {
      return errorResponse(`Location not found: ${anchor.value}`, 404);
    }
    lat = location.lat;
    lng = location.lng;
  }

  void session; // authenticated but userId not needed for search

  const results = await courseSearchService.searchCourses({
    lat,
    lng,
    radiusMiles,
    priceBand,
    accessTypes,
    includePrivate,
    tripId,
    sortBy,
    page,
    pageSize,
  });

  return NextResponse.json(results);
}
