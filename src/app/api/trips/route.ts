import { NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import { createTripSchema } from "@/lib/validation/trips";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const results = await tripService.listUserTrips(session!.user!.id!);
  const trips = results.map((r) => r.trip);
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = await parseBody(request, createTripSchema);
  if ("error" in parsed) return parsed.error;

  const trip = await tripService.createTrip(session!.user!.id!, parsed.data);
  return NextResponse.json({ trip }, { status: 201 });
}
