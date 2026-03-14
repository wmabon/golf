#!/usr/bin/env bash
# PostGIS Spike Benchmark Script
# Starts the Docker container, loads seed data, and runs all query patterns.
# Usage: ./benchmark.sh
# Prerequisites: Docker (Docker Desktop or Colima) running

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.spike.yml"
QUERIES_FILE="$SCRIPT_DIR/queries.sql"
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="golf_spike"
DB_USER="spike"
DB_PASS="spike_pass"

PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }
divider() { echo -e "\n${YELLOW}========================================${NC}"; }

# ------------------------------------------------------------------
# 1. Start Docker container
# ------------------------------------------------------------------
divider
info "Starting PostGIS container..."

if ! command -v docker &> /dev/null; then
  err "Docker is not installed or not in PATH."
  exit 1
fi

if ! docker info &> /dev/null 2>&1; then
  err "Docker daemon is not running. Start Docker Desktop or Colima first."
  exit 1
fi

# Stop any existing container
docker compose -f "$COMPOSE_FILE" down --volumes 2>/dev/null || true

# Start fresh
docker compose -f "$COMPOSE_FILE" up -d

info "Waiting for PostgreSQL to become ready..."
RETRIES=30
for i in $(seq 1 $RETRIES); do
  if PGPASSWORD=$DB_PASS $PSQL_CMD -c "SELECT 1" &>/dev/null; then
    ok "PostgreSQL is ready (attempt $i/$RETRIES)."
    break
  fi
  if [ "$i" -eq "$RETRIES" ]; then
    err "PostgreSQL did not become ready in time."
    exit 1
  fi
  sleep 2
done

# ------------------------------------------------------------------
# 2. Verify seed data loaded
# ------------------------------------------------------------------
divider
info "Verifying seed data..."

AIRPORT_COUNT=$(PGPASSWORD=$DB_PASS $PSQL_CMD -t -c "SELECT count(*) FROM airports;" | tr -d ' ')
COURSE_COUNT=$(PGPASSWORD=$DB_PASS $PSQL_CMD -t -c "SELECT count(*) FROM courses;" | tr -d ' ')

ok "Airports loaded: $AIRPORT_COUNT"
ok "Courses loaded: $COURSE_COUNT"

# Verify PostGIS extension
POSTGIS_VERSION=$(PGPASSWORD=$DB_PASS $PSQL_CMD -t -c "SELECT PostGIS_Version();" | tr -d ' ')
ok "PostGIS version: $POSTGIS_VERSION"

# ------------------------------------------------------------------
# 3. Verify indexes exist
# ------------------------------------------------------------------
divider
info "Checking indexes..."

PGPASSWORD=$DB_PASS $PSQL_CMD -c "
  SELECT
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('airports', 'courses')
  ORDER BY tablename, indexname;
"

# ------------------------------------------------------------------
# 4. Run each query pattern individually with timing
# ------------------------------------------------------------------
divider
info "Running query benchmarks..."

run_query() {
  local label="$1"
  local sql="$2"
  echo ""
  echo -e "${GREEN}--- $label ---${NC}"
  PGPASSWORD=$DB_PASS $PSQL_CMD -c "\timing on" -c "$sql"
}

# Query A: Radius search — 50 miles from MCO
run_query "QUERY A: Radius search (50mi from MCO)" "
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
  80467.2
)
ORDER BY distance_miles;
"

# Query B: Filtered radius — 30mi, public/resort, price < $200
run_query "QUERY B: Filtered radius (30mi, public/resort, <\$200)" "
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
  48280.3
)
AND c.access_type IN ('public', 'resort')
AND c.price_band_max < 200.00
ORDER BY distance_miles;
"

# Query C: Bounding box — Scottsdale area
run_query "QUERY C: Bounding box (Scottsdale area)" "
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
"

# Query D: KNN — 10 closest courses to Hilton Head area
run_query "QUERY D: KNN (10 closest to Hilton Head)" "
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
"

# Query E: Distance sort — 75 miles from JAX
run_query "QUERY E: Distance sort (75mi from JAX)" "
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
AND ST_DWithin(c.location, a.location, 120701.0)
ORDER BY ST_Distance(c.location, a.location);
"

# Query F: Compound index test
run_query "QUERY F.1: Spatial only (count)" "
EXPLAIN ANALYZE
SELECT count(*)
FROM courses c
WHERE ST_DWithin(
  c.location,
  ST_SetSRID(ST_MakePoint(-81.3089, 28.4312), 4326)::geography,
  80467.2
);
"

run_query "QUERY F.2: Spatial + access filter (count)" "
EXPLAIN ANALYZE
SELECT count(*)
FROM courses c
WHERE ST_DWithin(
  c.location,
  ST_SetSRID(ST_MakePoint(-81.3089, 28.4312), 4326)::geography,
  80467.2
)
AND c.access_type IN ('public', 'resort');
"

run_query "QUERY F.3: Spatial + price filter (count)" "
EXPLAIN ANALYZE
SELECT count(*)
FROM courses c
WHERE ST_DWithin(
  c.location,
  ST_SetSRID(ST_MakePoint(-81.3089, 28.4312), 4326)::geography,
  80467.2
)
AND c.price_band_max < 150.00;
"

# Bonus: Airport distances from MCO
run_query "BONUS: Airport-to-airport distances from MCO" "
SELECT
  a1.iata_code AS from_airport,
  a2.iata_code AS to_airport,
  ROUND((ST_Distance(a1.location, a2.location) / 1609.344)::numeric, 0) AS distance_miles
FROM airports a1
CROSS JOIN airports a2
WHERE a1.iata_code = 'MCO'
AND a2.iata_code IN ('JAX', 'TPA', 'MIA', 'FLL', 'PBI', 'SAV')
ORDER BY distance_miles;
"

# ------------------------------------------------------------------
# 5. Summary
# ------------------------------------------------------------------
divider
ok "PostGIS spike benchmark complete."
info "Container is still running on port $DB_PORT."
info "Connect manually: PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
info "To stop: docker compose -f $COMPOSE_FILE down --volumes"
