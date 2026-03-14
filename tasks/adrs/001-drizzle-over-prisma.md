# ADR 001: Drizzle ORM over Prisma

## Status

Accepted

## Context

The project needs a TypeScript ORM for PostgreSQL with PostGIS spatial extensions. Key requirements:

- Custom column type support for `geography(Point, 4326)` columns on courses and airports
- SQL-level control for spatial queries (`ST_DWithin`, `ST_Distance`, `ST_MakePoint`, `ST_MakeEnvelope`)
- No binary engine or WASM runtime dependencies that complicate deployment
- Strong TypeScript type inference from schema definitions without a separate code generation step
- Compatibility with the `postgres.js` driver for lightweight connection management

Prisma was the primary alternative considered. It requires a binary query engine, has limited support for custom PostgreSQL types (no `customType` equivalent), and would force raw SQL for all PostGIS operations while losing type safety.

## Decision

Use **Drizzle ORM** (`drizzle-orm@0.45.x`) with the **postgres.js** driver (`postgres@3.4.x`).

- Database connection is configured in `src/lib/db/index.ts` using `drizzle(client, { schema })`
- Schema is defined in `src/lib/db/schema/` with one file per table
- PostGIS geography type is implemented via `customType` in `src/lib/db/postgis.ts`
- Spatial query helpers use `sql` template literals in `src/lib/db/spatial-helpers.ts`
- Migrations are managed by `drizzle-kit` (`db:generate`, `db:migrate` scripts in `package.json`)

## Consequences

**What we gained:**

- `customType<{ data: GeoPoint; driverData: string }>` in `src/lib/db/postgis.ts` lets us define `geography(Point, 4326)` as a first-class Drizzle column type with typed `toDriver`/`fromDriver` conversions
- SQL template literals (`sql\`ST_DWithin(...)\``) give full control over PostGIS function calls while retaining parameter binding and SQL injection protection
- No binary engine means simpler Docker images, faster cold starts, and no platform-specific build artifacts
- Schema-as-code with `$inferSelect` and `$inferInsert` provides compile-time row types without a generation step

**What we gave up:**

- GIST indexes on geography columns cannot be expressed in Drizzle schema definitions; they must be added manually to generated migration SQL files (see comment in `src/lib/db/schema/courses.ts` line 75)
- The `fromDriver` function in `src/lib/db/postgis.ts` returns a sentinel `{ lat: 0, lng: 0 }` because PostGIS returns WKB hex for geography columns, which Drizzle does not decode. All reads must use `ST_Y(col::geometry)` / `ST_X(col::geometry)` in the SELECT clause instead (see `extractLat`/`extractLng` in `src/lib/db/spatial-helpers.ts`)
- Drizzle's ecosystem (community plugins, admin tools, hosted monitoring) is smaller than Prisma's
- Drizzle Studio is functional but less polished than Prisma Studio for ad-hoc data browsing

**Risks:**

- Drizzle ORM is younger than Prisma; breaking changes between minor versions have occurred historically. Pin versions carefully.
- Developers unfamiliar with raw SQL may struggle with spatial query construction. The `spatial-helpers.ts` module mitigates this by providing pre-built helper functions.
