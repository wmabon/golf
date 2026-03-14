import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  lodgingOptions,
  flightOptions,
  type NewLodgingOption,
  type NewFlightOption,
} from "@/lib/db/schema";
import type { SearchLodgingInput, SearchFlightsInput, SaveLodgingOptionInput, SaveFlightOptionInput } from "@/lib/validation/travel";

/**
 * Search lodging — returns affiliate deep-links for Airbnb / VRBO.
 * This is a STUB; real API integration comes when partner agreements are signed.
 */
export async function searchLodging(_tripId: string, params: SearchLodgingInput) {
  const location = encodeURIComponent(params.location ?? "");

  return [
    {
      source: "affiliate" as const,
      provider: "Airbnb",
      searchUrl: `https://www.airbnb.com/s/${location}/homes?checkin=${params.checkIn}&checkout=${params.checkOut}&adults=${params.guests}`,
    },
    {
      source: "affiliate" as const,
      provider: "VRBO",
      searchUrl: `https://www.vrbo.com/search?destination=${location}&startDate=${params.checkIn}&endDate=${params.checkOut}&adults=${params.guests}`,
    },
  ];
}

/**
 * Search flights — returns affiliate deep-links for Google Flights / Kayak.
 * This is a STUB; real API integration comes when partner agreements are signed.
 */
export async function searchFlights(_tripId: string, params: SearchFlightsInput) {
  const departure = encodeURIComponent(params.departureAirport);
  const arrival = encodeURIComponent(params.arrivalAirport);

  return [
    {
      source: "affiliate" as const,
      provider: "Google Flights",
      searchUrl: `https://www.google.com/travel/flights?q=flights+from+${departure}+to+${arrival}+on+${params.departureDate}`,
    },
    {
      source: "affiliate" as const,
      provider: "Kayak",
      searchUrl: `https://www.kayak.com/flights/${departure}-${arrival}/${params.departureDate}`,
    },
  ];
}

/**
 * Save a lodging option that a user found via affiliate search.
 */
export async function saveLodgingOption(
  tripId: string,
  userId: string,
  data: SaveLodgingOptionInput
) {
  const [option] = await db
    .insert(lodgingOptions)
    .values({
      tripId,
      name: data.name,
      location: data.location ?? null,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      pricePerNight: data.pricePerNight?.toString() ?? null,
      totalPrice: data.totalPrice?.toString() ?? null,
      bedrooms: data.bedrooms ?? null,
      linkUrl: data.linkUrl,
      thumbnailUrl: data.thumbnailUrl ?? null,
      savedBy: userId,
    } satisfies NewLodgingOption)
    .returning();

  return option;
}

/**
 * List all saved lodging options for a trip, ordered by most recent first.
 */
export async function listLodgingOptions(tripId: string) {
  return db
    .select()
    .from(lodgingOptions)
    .where(eq(lodgingOptions.tripId, tripId))
    .orderBy(lodgingOptions.createdAt);
}

/**
 * Save a flight option that a user found via affiliate search.
 */
export async function saveFlightOption(
  tripId: string,
  userId: string,
  data: SaveFlightOptionInput
) {
  const [option] = await db
    .insert(flightOptions)
    .values({
      tripId,
      airline: data.airline ?? null,
      departureAirport: data.departureAirport,
      arrivalAirport: data.arrivalAirport,
      departureTime: new Date(data.departureTime),
      arrivalTime: new Date(data.arrivalTime),
      price: data.price?.toString() ?? null,
      passengers: data.passengers ?? 1,
      linkUrl: data.linkUrl ?? null,
      savedBy: userId,
    } satisfies NewFlightOption)
    .returning();

  return option;
}

/**
 * List all saved flight options for a trip, ordered by departure time.
 */
export async function listFlightOptions(tripId: string) {
  return db
    .select()
    .from(flightOptions)
    .where(eq(flightOptions.tripId, tripId))
    .orderBy(flightOptions.departureTime);
}
