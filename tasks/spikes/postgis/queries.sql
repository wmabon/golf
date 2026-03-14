-- PostGIS Spike: Query Pattern Validation
-- All 6 spatial query patterns needed by the golf trip app
-- Run these against the seeded golf_spike database

-- ============================================================================
-- SETUP: Get MCO coordinates for reuse
-- ============================================================================
-- MCO (Orlando International Airport): lng=-81.3089, lat=28.4312

-- ============================================================================
-- QUERY A: Radius Search — courses within 50 miles of MCO
-- ============================================================================
-- This is the primary discovery query: user enters "MCO" and we find nearby courses.
-- ST_DWithin uses meters, so 50 miles = 80467.2 meters.

EXPLAIN ANALYZE
SELECT
  c.name,
  c.city,
  c.state,
  c.access_type,
  c.price_band_min,
  c.price_band_max,
  ROUND((ST_Distance(
    c.location,
    (SELECT location FROM airports WHERE iata_code = 'MCO')
  ) / 1609.344)::numeric, 1) AS distance_miles
FROM courses c
WHERE ST_DWithin(
  c.location,
  (SELECT location FROM airports WHERE iata_code = 'MCO'),
  80467.2  -- 50 miles in meters
)
ORDER BY distance_miles;


-- ============================================================================
-- QUERY B: Filtered Radius — within 30 miles, public/resort, price < $200
-- ============================================================================
-- Compound filter: spatial + access_type + price. This is the common "find me
-- affordable public golf near MCO" query.

EXPLAIN ANALYZE
SELECT
  c.name,
  c.city,
  c.state,
  c.access_type,
  c.price_band_min,
  c.price_band_max,
  ROUND((ST_Distance(
    c.location,
    (SELECT location FROM airports WHERE iata_code = 'MCO')
  ) / 1609.344)::numeric, 1) AS distance_miles
FROM courses c
WHERE ST_DWithin(
  c.location,
  (SELECT location FROM airports WHERE iata_code = 'MCO'),
  48280.3  -- 30 miles in meters
)
AND c.access_type IN ('public', 'resort')
AND c.price_band_max < 200.00
ORDER BY distance_miles;


-- ============================================================================
-- QUERY C: Bounding Box — courses within a lat/lng rectangle (Scottsdale area)
-- ============================================================================
-- Scottsdale/Phoenix corridor bounding box:
--   SW corner: (-112.20, 33.30)   NE corner: (-111.60, 33.90)
-- This simulates a map viewport query.

EXPLAIN ANALYZE
SELECT
  c.name,
  c.city,
  c.state,
  c.access_type,
  c.price_band_min,
  c.price_band_max,
  ST_Y(c.location::geometry) AS lat,
  ST_X(c.location::geometry) AS lng
FROM courses c
WHERE c.location && ST_MakeEnvelope(-112.20, 33.30, -111.60, 33.90, 4326)::geography;


-- ============================================================================
-- QUERY D: KNN (K-Nearest Neighbor) — 10 closest courses to a point
-- ============================================================================
-- KNN uses the <-> operator for index-assisted ordering.
-- Point: Hilton Head area (lng=-80.75, lat=32.20)
-- Note: KNN with geography requires casting to geometry for the <-> operator,
-- then computing actual geography distance for accurate results.

EXPLAIN ANALYZE
SELECT
  c.name,
  c.city,
  c.state,
  c.access_type,
  c.price_band_min,
  c.price_band_max,
  ROUND((ST_Distance(
    c.location,
    ST_SetSRID(ST_MakePoint(-80.75, 32.20), 4326)::geography
  ) / 1609.344)::numeric, 1) AS distance_miles
FROM courses c
ORDER BY c.location::geometry <-> ST_SetSRID(ST_MakePoint(-80.75, 32.20), 4326)
LIMIT 10;


-- ============================================================================
-- QUERY E: Distance Sort — courses sorted by distance from airport (miles)
-- ============================================================================
-- For a given airport, show all courses within 75 miles sorted by distance.
-- Includes the computed distance for display on course cards.
-- Airport: JAX (Jacksonville)

EXPLAIN ANALYZE
SELECT
  c.name,
  c.city,
  c.state,
  c.access_type,
  c.price_band_min,
  c.price_band_max,
  ROUND((ST_Distance(
    c.location,
    a.location
  ) / 1609.344)::numeric, 1) AS distance_miles
FROM courses c
CROSS JOIN airports a
WHERE a.iata_code = 'JAX'
AND ST_DWithin(c.location, a.location, 120701.0)  -- 75 miles in meters
ORDER BY ST_Distance(c.location, a.location);


-- ============================================================================
-- QUERY F: Compound Index Test — compare query plans
-- ============================================================================
-- Test whether PostgreSQL uses the GIST index effectively when combined with
-- non-spatial filters. Compare plans for spatial-only vs spatial+attribute.

-- F.1: Spatial-only (should use GIST index on location)
EXPLAIN ANALYZE
SELECT count(*)
FROM courses c
WHERE ST_DWithin(
  c.location,
  ST_SetSRID(ST_MakePoint(-81.3089, 28.4312), 4326)::geography,
  80467.2
);

-- F.2: Spatial + access_type filter (check if both indexes are used)
EXPLAIN ANALYZE
SELECT count(*)
FROM courses c
WHERE ST_DWithin(
  c.location,
  ST_SetSRID(ST_MakePoint(-81.3089, 28.4312), 4326)::geography,
  80467.2
)
AND c.access_type IN ('public', 'resort');

-- F.3: Spatial + price filter (no index on price — sequential filter after spatial)
EXPLAIN ANALYZE
SELECT count(*)
FROM courses c
WHERE ST_DWithin(
  c.location,
  ST_SetSRID(ST_MakePoint(-81.3089, 28.4312), 4326)::geography,
  80467.2
)
AND c.price_band_max < 150.00;

-- F.4: Test a potential composite index
-- Uncomment to test:
-- CREATE INDEX idx_courses_access_location ON courses USING GIST(location) WHERE access_type IN ('public', 'resort');
-- Then re-run F.2 and compare plans.

-- ============================================================================
-- BONUS: Airport-to-airport distance (useful for multi-city trip planning)
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  a1.iata_code AS from_airport,
  a2.iata_code AS to_airport,
  ROUND((ST_Distance(a1.location, a2.location) / 1609.344)::numeric, 0) AS distance_miles
FROM airports a1
CROSS JOIN airports a2
WHERE a1.iata_code = 'MCO'
AND a2.iata_code IN ('JAX', 'TPA', 'MIA', 'FLL', 'PBI', 'SAV')
ORDER BY distance_miles;
