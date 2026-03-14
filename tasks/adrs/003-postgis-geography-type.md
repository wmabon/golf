# ADR 003: PostGIS geography(Point, 4326) for All Spatial Columns

## Status

Accepted

## Context

Course discovery (FR-11, FR-12) requires radius search, bounding-box filtering, KNN ordering, and distance display across the continental U.S. plus Hawaii. The app stores locations for courses and airports, with trip anchors resolved to coordinates for spatial joins. Key findings from the PostGIS spike (`tasks/spikes/postgis-findings.md`):

- Flat-plane geometry calculations produce significant distance errors at continental scale (e.g., MCO to LAX)
- Drive-time filtering is needed (FR-12, FR-37) but pre-computed isochrones are too expensive and brittle
- The `<->` KNN operator requires a geometry cast but is accurate enough for regional ordering
- `ST_DWithin` must be used instead of `ST_Distance < threshold` to enable GIST index usage

## Decision

Use **`geography(Point, 4326)`** for all spatial columns (courses, airports, trip anchors). Use a **runtime driving-directions API with caching** for drive-time queries instead of pre-computed isochrones.

- Column type defined via `customType` in `src/lib/db/postgis.ts` with `dataType() { return "geography(Point, 4326)" }`
- Coordinate convention: **longitude first** everywhere, matching PostGIS `ST_MakePoint(lng, lat)` and GeoJSON spec
- `toDriver` serializes as `SRID=4326;POINT(lng lat)` EWKT
- `fromDriver` returns sentinel `{ lat: 0, lng: 0 }` -- never used directly; always use `ST_Y`/`ST_X` via `extractLat`/`extractLng` in `src/lib/db/spatial-helpers.ts`
- All distances are in meters internally (PostGIS native unit for geography), converted to miles for display via `MILES_TO_METERS = 1609.344` constant

## Consequences

**What we gained:**

- Accurate great-circle distance calculations on the WGS84 ellipsoid without manual projection math
- SRID 4326 is the web mapping standard (Google Maps, Mapbox, Leaflet), eliminating coordinate system mismatches
- `ST_DWithin(geography, geography, meters)` uses GIST index automatically for radius queries
- Performance validated in spike: sub-15ms for all query patterns at 50,000 courses
- Partial GIST index on playable courses (`access_type IN ('public', 'resort', 'semi_private') AND status = 'active'`) narrows the default discovery query at the index level

**What we gave up:**

- GIST indexes must be added manually to migration files; Drizzle cannot generate them from schema code (documented in `src/lib/db/schema/courses.ts` line 75)
- KNN ordering requires `location::geometry <-> point::geometry` cast, producing approximate Cartesian ordering. Acceptable for regional queries but not geodesically exact for cross-country KNN
- The `fromDriver` sentinel pattern means any code that accidentally reads the geography column directly (instead of using `ST_Y`/`ST_X`) will silently get `{ lat: 0, lng: 0 }`. This is a footgun documented in `src/lib/db/postgis.ts` lines 16-20.
- Drive-time API calls add 100-300ms latency per call. Mitigated by caching with 7-30 day TTL and pre-filtering candidates with a generous `ST_DWithin` radius before making API calls.

**Risks:**

- Longitude-first convention (`lng, lat`) is the opposite of colloquial order (`lat, lng`) and Google Maps URL format. This will cause bugs if not enforced consistently. The `withinRadius` and `distanceMiles` helpers in `src/lib/db/spatial-helpers.ts` accept `(lng, lat)` to enforce the convention.
- `PostGIS` extension must be created in the first migration before any geography columns exist.
