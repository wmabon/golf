# PostGIS Spike Findings

**Date**: 2026-03-13
**Spike objective**: Validate spatial query patterns, column types, indexing strategy, and performance expectations for the golf trip app's course discovery feature.

## 1. Geography vs. Geometry: Confirmed Recommendation

**Use `geography(Point, 4326)` for both airports and courses.**

Rationale:
- The `geography` type computes distances on the WGS84 ellipsoid, giving accurate results in meters/miles without projection math. For a U.S.-only app spanning coast-to-coast, this matters: a naive `geometry` distance calculation between MCO and LAX would be significantly wrong because flat-plane math fails at continental scale.
- `ST_DWithin(geography, geography, meters)` uses the GIST index and calculates true great-circle distance. This is exactly what the PRD's "radius from anchor" filter requires (FR-12).
- The `geography` type stores coordinates as (longitude, latitude) in SRID 4326, which is the de facto standard for web mapping (Google Maps, Mapbox, Leaflet all use WGS84/EPSG:4326).
- Performance difference vs. `geometry` is negligible at our expected data scale (thousands to low tens of thousands of courses).

**Do NOT use `geometry` unless**: you need to do heavy computational geometry (buffer operations, polygon intersections) at scale, in which case project to a local CRS. This is unlikely for our use case.

## 2. Index Strategy Recommendation

### Primary indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `courses` | `idx_courses_location` | `GIST(location)` | All spatial queries: radius, bounding box, KNN |
| `courses` | `idx_courses_access` | `BTREE(access_type)` | Access filtering (FR-13: exclude private by default) |
| `airports` | `idx_airports_location` | `GIST(location)` | Airport-to-course distance calculations |
| `airports` | `idx_airports_iata` | `BTREE(iata_code)` | Airport code lookup (FR-11) |

### Additional indexes for production

| Index | Type | Purpose |
|-------|------|---------|
| `idx_courses_state` | `BTREE(state)` | Filter by U.S. state for browse/admin |
| `idx_courses_price_max` | `BTREE(price_band_max)` | Price-band filtering (FR-12) |
| `idx_courses_status` | `BTREE(status)` | State machine status (active/archived/pending) |

### Partial index (recommended)

```sql
CREATE INDEX idx_courses_playable_location
  ON courses USING GIST(location)
  WHERE access_type IN ('public', 'resort', 'semi-private')
  AND status = 'active';
```

This partial index covers the default discovery query path (FR-13: "exclude private-member-only and unknown-access courses by default"). Since the majority of discovery queries will hit this filter combination, a partial GIST index avoids scanning private/inactive courses entirely. At ~10,000 courses this is a modest win; at 50,000+ it becomes significant.

### Compound index note

PostGIS GIST indexes cannot be combined with BTREE columns in a single composite index. PostgreSQL will use the GIST index for the spatial filter, then apply BTREE-indexed attribute filters as a recheck. This is fine for our data volume. The query planner handles this well.

## 3. Query Pattern Analysis

### Pattern A: Radius search (primary discovery)

```sql
SELECT ... FROM courses
WHERE ST_DWithin(location, <airport_point>, <radius_meters>)
ORDER BY ST_Distance(location, <airport_point>);
```

- Uses GIST index for the `ST_DWithin` bounding-box prefilter, then exact distance recheck.
- This is the workhorse query for FR-11/FR-12.
- Conversion: miles to meters = `miles * 1609.344`.

**Expected performance**: Sub-millisecond at 100 courses; <10ms at 50,000 courses. Not a concern.

### Pattern B: Filtered radius (compound spatial + attribute)

```sql
SELECT ... FROM courses
WHERE ST_DWithin(location, <point>, <radius>)
AND access_type IN ('public', 'resort')
AND price_band_max < <budget>;
```

- GIST index narrows spatially, then BTREE on access_type and price_band_max filter further.
- With the partial index recommended above, private courses are excluded at the index level.

**Expected performance**: Same as Pattern A. The attribute filters are trivial after spatial narrowing.

### Pattern C: Bounding box (map viewport)

```sql
SELECT ... FROM courses
WHERE location && ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)::geography;
```

- The `&&` operator uses the GIST index directly for bounding-box overlap.
- This is the fastest spatial operation because it skips distance calculation entirely.
- Use this for map pan/zoom queries where exact radius is not needed.

**Expected performance**: Fastest spatial pattern. Sub-millisecond.

### Pattern D: KNN (K-Nearest Neighbor)

```sql
SELECT ... FROM courses
ORDER BY location::geometry <-> <point>::geometry
LIMIT K;
```

- The `<->` operator enables index-assisted KNN ordering via the GIST index.
- Important caveat: `<->` works on `geometry`, not `geography`. For KNN with accurate distances, use `<->` for ordering (approximate, index-assisted), then compute exact `geography` distance for display.
- The approximation from using geometry `<->` is acceptable for ordering because at the scale of a single metro area, the error is negligible. For cross-country KNN, the ordering may differ slightly from true geodesic order, but this is unlikely to matter for "10 closest courses" queries.

**Expected performance**: Sub-millisecond with GIST index. The index does the heavy lifting.

### Pattern E: Distance sort with display distance

```sql
SELECT ...,
  ROUND((ST_Distance(c.location, a.location) / 1609.344)::numeric, 1) AS distance_miles
FROM courses c, airports a
WHERE a.iata_code = 'MCO'
AND ST_DWithin(c.location, a.location, <radius>)
ORDER BY ST_Distance(c.location, a.location);
```

- Combines radius filter with distance computation and sorting.
- `ST_Distance` on `geography` returns meters; divide by 1609.344 for miles.
- The distance is computed twice (once for WHERE, once for SELECT/ORDER BY). PostgreSQL's optimizer typically handles this, but if needed, use a CTE or subquery to avoid recomputation.

### Pattern F: Compound index behavior

- **GIST index is always used** for spatial predicates, regardless of additional filters.
- Additional BTREE indexes on `access_type` and `price_band_max` are used as rechecks after spatial narrowing.
- At our expected data volume (< 50,000 courses), the overhead of rechecking non-spatial filters on the spatially-narrowed result set is negligible.
- A partial GIST index (see recommendation above) is more effective than attempting a compound spatial+attribute index.

## 4. Drive-Time: Runtime API + Caching

**Recommendation: Use a driving-directions API at query time, with aggressive caching. Do NOT pre-compute isochrones.**

Rationale:
- The PRD requires "drive time from anchor" as a filter (FR-12) and "drive-time change" in swap suggestions (FR-37).
- Pre-computing isochrones (drive-time polygons) for every airport would require calling a routing API for every airport at multiple time thresholds (30min, 60min, 90min, 120min), storing and indexing those polygons, and re-computing them whenever road data changes. This is expensive, complex, and brittle.
- Instead:
  1. Use `ST_DWithin` to get courses within a generous radius (e.g., 1.5x the drive-time equivalent in crow-flies distance).
  2. For the filtered result set (typically 10-50 courses), call a routing API (Google Directions, Mapbox, OSRM) to get actual drive times.
  3. Cache the drive-time results with a TTL of 7-30 days (road networks rarely change).
  4. Filter/sort by actual drive time in application code.
- This approach is cheaper, simpler, and more accurate than pre-computed isochrones.

**Cache schema suggestion**:
```sql
CREATE TABLE drive_time_cache (
  origin_type VARCHAR(20) NOT NULL,     -- 'airport' or 'point'
  origin_key VARCHAR(50) NOT NULL,      -- iata_code or lat,lng hash
  destination_course_id UUID NOT NULL REFERENCES courses(id),
  drive_time_seconds INTEGER NOT NULL,
  distance_meters INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (origin_type, origin_key, destination_course_id)
);
```

## 5. Performance Expectations

| Query pattern | 100 courses | 10,000 courses | 50,000 courses | Notes |
|--------------|-------------|----------------|----------------|-------|
| Radius (ST_DWithin) | < 1ms | < 5ms | < 15ms | GIST index handles this well |
| Filtered radius | < 1ms | < 5ms | < 15ms | Attribute filter is trivial after spatial narrowing |
| Bounding box (&&) | < 1ms | < 2ms | < 5ms | Fastest — pure index operation |
| KNN (<->) | < 1ms | < 3ms | < 10ms | Index-assisted ordering |
| Distance sort | < 1ms | < 5ms | < 15ms | ST_Distance computation dominates |

These numbers assume warm caches. Cold-cache first queries may be 2-5x slower but still well under 100ms. At no foreseeable data volume will spatial queries be a performance bottleneck.

**The real latency bottleneck will be drive-time API calls**, not PostGIS queries. Budget 100-300ms per routing API call, and aim to cache aggressively.

## 6. Schema Recommendations for Main Project

### Course table

```sql
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  state VARCHAR(2),
  location GEOGRAPHY(Point, 4326) NOT NULL,
  access_type VARCHAR(50) NOT NULL DEFAULT 'public'
    CHECK (access_type IN ('public', 'resort', 'semi-private', 'private', 'unknown')),
  access_confidence VARCHAR(20) DEFAULT 'unverified'
    CHECK (access_confidence IN ('verified', 'unverified', 'disputed')),
  price_band_min DECIMAL(10,2),
  price_band_max DECIMAL(10,2),
  amenities JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'pending_review')),
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ  -- soft delete
);
```

### Airport / location reference table

```sql
CREATE TABLE airports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  iata_code VARCHAR(10) UNIQUE NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Key indexes for production

```sql
-- Spatial
CREATE INDEX idx_courses_location ON courses USING GIST(location);
CREATE INDEX idx_airports_location ON airports USING GIST(location);

-- Partial spatial (playable inventory default view)
CREATE INDEX idx_courses_playable_location ON courses USING GIST(location)
  WHERE access_type IN ('public', 'resort', 'semi-private') AND status = 'active';

-- Attribute
CREATE INDEX idx_courses_access ON courses(access_type);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_state ON courses(state);
CREATE INDEX idx_courses_price_max ON courses(price_band_max);
CREATE INDEX idx_airports_iata ON airports(iata_code);
```

### Trip anchor storage

The Trip entity should store its anchor location as `geography(Point, 4326)` when the anchor is airport-based or coordinate-based. This enables direct spatial joins between trips and courses without needing to look up the airport every time.

```sql
-- In the trips table:
anchor_type VARCHAR(20) CHECK (anchor_type IN ('airport', 'city', 'coordinates', 'region')),
anchor_value VARCHAR(255),            -- e.g., 'MCO' or 'Scottsdale, AZ'
anchor_location GEOGRAPHY(Point, 4326) -- resolved coordinates for spatial queries
```

## 7. Gotchas and Pitfalls

### Coordinate order: longitude first

PostGIS uses `ST_MakePoint(longitude, latitude)` — longitude comes first. This is the opposite of how most people think about coordinates (lat, lng) and the opposite of Google Maps URL format. This WILL cause bugs if not enforced consistently.

**Mitigation**: Establish a project convention that all coordinate pairs are stored and passed as `(lng, lat)` internally, matching PostGIS and GeoJSON standards. Document this in the project's engineering conventions. Add a comment to every `ST_MakePoint` call.

### Geography distance units are meters

`ST_Distance` on `geography` columns returns meters, not miles or kilometers. Every distance must be converted for display: `distance_meters / 1609.344 = distance_miles`.

**Mitigation**: Create a SQL function or application-layer constant for the conversion factor. Do not hardcode `1609.344` in every query.

### KNN operator requires geometry, not geography

The `<->` operator for index-assisted KNN ordering works on `geometry`, not `geography`. You must cast: `location::geometry <-> point::geometry`. The resulting order is approximate (Cartesian distance in degrees, not geodesic distance in meters), but for regional queries this is accurate enough for ordering. Always compute the final display distance using `ST_Distance` on the `geography` columns.

### ST_DWithin is faster than ST_Distance < threshold

Always use `ST_DWithin(a, b, distance)` instead of `ST_Distance(a, b) < distance`. `ST_DWithin` uses the GIST index's bounding-box prefilter; the `ST_Distance < threshold` form does a sequential scan because the optimizer cannot push the threshold into the index.

### Bounding box operator (&&) on geography

The `&&` operator works on `geography` but compares bounding boxes on the sphere. For map viewport queries this is correct. However, near the poles or the antimeridian the bounding box may include unexpected area. Since we are U.S.-only, this is not a concern (except for Hawaii, which is well within safe bounds).

### SRID consistency

Always use SRID 4326 for all geographic data. Mixing SRIDs will silently produce wrong results or cause errors. Set a database-level check or migration test to verify all geography columns use 4326.

### PostGIS extension must be created before any geography columns

The `CREATE EXTENSION IF NOT EXISTS postgis;` statement must be in the very first migration. Without it, the `geography` and `geometry` types do not exist and all subsequent CREATE TABLE statements will fail.

### Index maintenance

GIST indexes on `geography` columns are somewhat larger than BTREE indexes (approximately 2-3x the row count in pages). For 50,000 courses this is still trivially small (a few MB). No special maintenance is needed beyond normal PostgreSQL autovacuum.

## 8. Spike File Inventory

| File | Purpose |
|------|---------|
| `docker-compose.spike.yml` | PostgreSQL 16 + PostGIS 3.4 on port 5433 |
| `seed-airports.sql` | 50 major U.S. airports with real coordinates |
| `seed-courses.sql` | ~100 real U.S. golf courses with real coordinates |
| `queries.sql` | All 6 query patterns with EXPLAIN ANALYZE |
| `benchmark.sh` | Automated setup, seed, and benchmark runner |

## 9. Running the Benchmark

```bash
cd tasks/spikes/postgis
chmod +x benchmark.sh
./benchmark.sh
```

Requires Docker to be running. The script will:
1. Start a fresh PostGIS 16 container on port 5433
2. Load airport and course seed data automatically (via docker-entrypoint-initdb.d)
3. Verify data counts and PostGIS version
4. Run each query pattern with timing output
5. Display EXPLAIN ANALYZE for compound index comparison

To connect manually after the benchmark:
```bash
PGPASSWORD=spike_pass psql -h localhost -p 5433 -U spike -d golf_spike
```

To tear down:
```bash
docker compose -f docker-compose.spike.yml down --volumes
```

## 10. Decision Summary

| Decision | Recommendation | Confidence |
|----------|---------------|------------|
| Column type | `geography(Point, 4326)` | High |
| Primary spatial index | GIST on geography | High |
| Partial index for playable courses | Yes (access_type + status filter) | Medium-High |
| Drive time | Runtime API + caching | High |
| KNN ordering | `<->` on geometry cast, display distance on geography | High |
| Radius queries | `ST_DWithin` (never `ST_Distance < x`) | High |
| Coordinate convention | (lng, lat) everywhere, matching PostGIS/GeoJSON | High |
| Pre-computed isochrones | No — too complex, too expensive, too brittle | High |
