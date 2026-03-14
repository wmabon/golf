import { eq, ilike, sql, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { airports } from "@/lib/db/schema";
import { extractLat, extractLng } from "@/lib/db/spatial-helpers";

export async function getAirportByCode(iataCode: string) {
  const [airport] = await db
    .select({
      iataCode: airports.iataCode,
      name: airports.name,
      city: airports.city,
      state: airports.state,
      lat: extractLat(airports.location),
      lng: extractLng(airports.location),
    })
    .from(airports)
    .where(eq(airports.iataCode, iataCode.toUpperCase()));

  return airport ?? null;
}

export async function searchAirports(query: string, limit = 10) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // If query is 2-4 chars, prioritize IATA prefix match then fallback to name
  if (trimmed.length >= 2 && trimmed.length <= 4) {
    const results = await db
      .select({
        iataCode: airports.iataCode,
        name: airports.name,
        city: airports.city,
        state: airports.state,
      })
      .from(airports)
      .where(
        or(
          ilike(airports.iataCode, `${trimmed}%`),
          ilike(airports.name, `%${trimmed}%`),
          ilike(airports.city, `%${trimmed}%`)
        )
      )
      .orderBy(
        // Prioritize exact IATA prefix matches
        sql`CASE WHEN ${airports.iataCode} ILIKE ${trimmed + "%"} THEN 0 ELSE 1 END`,
        airports.iataCode
      )
      .limit(limit);

    return results;
  }

  // General search by name or city
  const results = await db
    .select({
      iataCode: airports.iataCode,
      name: airports.name,
      city: airports.city,
      state: airports.state,
    })
    .from(airports)
    .where(
      or(
        ilike(airports.name, `%${trimmed}%`),
        ilike(airports.city, `%${trimmed}%`)
      )
    )
    .orderBy(airports.iataCode)
    .limit(limit);

  return results;
}

export async function resolveLocation(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // First try exact IATA match if query is 3 uppercase chars
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    const airport = await getAirportByCode(trimmed.toUpperCase());
    if (airport) {
      return {
        type: "airport" as const,
        lat: airport.lat,
        lng: airport.lng,
        displayName: `${airport.name} (${airport.iataCode})`,
      };
    }
  }

  // Then try city match
  const [cityMatch] = await db
    .select({
      iataCode: airports.iataCode,
      name: airports.name,
      city: airports.city,
      state: airports.state,
      lat: extractLat(airports.location),
      lng: extractLng(airports.location),
    })
    .from(airports)
    .where(ilike(airports.city, `%${trimmed}%`))
    .limit(1);

  if (cityMatch) {
    return {
      type: "city" as const,
      lat: cityMatch.lat,
      lng: cityMatch.lng,
      displayName: `${cityMatch.city}, ${cityMatch.state}`,
    };
  }

  return null;
}
