import { sql, type SQL, type Column } from "drizzle-orm";

export const MILES_TO_METERS = 1609.344;

/** ST_DWithin radius filter — returns true if location is within radiusMiles */
export function withinRadius(
  locationCol: Column,
  lng: number,
  lat: number,
  radiusMiles: number
): SQL {
  const radiusMeters = radiusMiles * MILES_TO_METERS;
  return sql`ST_DWithin(${locationCol}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})`;
}

/** Distance in miles from a point */
export function distanceMiles(
  locationCol: Column,
  lng: number,
  lat: number
): SQL<number> {
  return sql<number>`ROUND((ST_Distance(${locationCol}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1609.344)::numeric, 1)`;
}

/** Extract latitude from geography column */
export function extractLat(locationCol: Column): SQL<number> {
  return sql<number>`ST_Y(${locationCol}::geometry)`;
}

/** Extract longitude from geography column */
export function extractLng(locationCol: Column): SQL<number> {
  return sql<number>`ST_X(${locationCol}::geometry)`;
}

/** Bounding box filter for map viewport */
export function withinBounds(
  locationCol: Column,
  sw: { lng: number; lat: number },
  ne: { lng: number; lat: number }
): SQL {
  return sql`${locationCol} && ST_MakeEnvelope(${sw.lng}, ${sw.lat}, ${ne.lng}, ${ne.lat}, 4326)::geography`;
}
