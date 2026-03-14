import { customType } from "drizzle-orm/pg-core";

export type GeoPoint = { lat: number; lng: number };

export const geography = customType<{
  data: GeoPoint;
  driverData: string;
}>({
  dataType() {
    return "geography(Point, 4326)";
  },
  toDriver(value: GeoPoint): string {
    // PostGIS uses longitude, latitude order
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(): GeoPoint {
    // Geography columns return WKB hex from the driver.
    // Always use ST_Y/ST_X in SQL select clauses instead.
    return { lat: 0, lng: 0 };
  },
});
