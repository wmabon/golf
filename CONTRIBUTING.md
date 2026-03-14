# Contributing

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable`)
- Docker Desktop (for PostgreSQL + PostGIS and Redis)

## Setup

```bash
git clone https://github.com/wmabon/golf.git
cd golf
pnpm install
cp .env.example .env.local   # then set AUTH_SECRET to a random string
docker compose up -d
pnpm dev
```

Verify at http://localhost:3000.

## Development Workflow

1. **Plan first** — enter plan mode for any non-trivial task (3+ steps)
2. **Implement** — schema → service → validation → route → test
3. **Verify** — `pnpm test` (unit) + `next build` (type checking)
4. **Commit** — at feature boundaries, after build + tests pass

## Code Patterns

These patterns are established throughout the codebase. Follow them for consistency.

### Schema (Drizzle ORM)

Files at `src/lib/db/schema/{entity}.ts`. Barrel at `src/lib/db/schema/index.ts`.

```typescript
import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("entity_status", ["active", "archived"]);

export const entities = pgTable("entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
```

Use `satisfies NewEntity` on insert values for type safety.

### PostGIS

All spatial columns use `geography(Point, 4326)` via the custom type in `src/lib/db/postgis.ts`.

**Critical gotchas:**
- `fromDriver` returns a sentinel `{lat:0, lng:0}` — never use it for reads
- Always extract coordinates with `ST_Y(col::geometry)` (latitude) and `ST_X(col::geometry)` (longitude)
- Coordinate order is **longitude first**: `ST_MakePoint(lng, lat)`, `POINT(lng lat)`
- GIST indexes must be added manually to generated migrations — Drizzle cannot generate `USING GIST`

Use helpers from `src/lib/db/spatial-helpers.ts`: `withinRadius`, `distanceMiles`, `extractLat`, `extractLng`, `withinBounds`.

### Services

Files at `src/services/{domain}/{entity}.service.ts`. Pure functions, no classes.

```typescript
// Return patterns:
return null;                    // not found
return { error: "reason" };     // business rule failure
return entity;                  // success
```

Use `db.transaction(async (tx) => {...})` for multi-step operations. Log state changes to `activityFeedEntries`.

### API Routes

Files at `src/app/api/{resource}/route.ts`. Named exports: `GET`, `POST`, `PUT`, `DELETE`.

```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const member = await tripService.isTripMember(id, session!.user!.id!);
  if (!member) return errorResponse("Not a member", 403);

  const parsed = await parseBody(request, createSchema);
  if ("error" in parsed) return parsed.error;

  const result = await service.create(parsed.data);
  if ("error" in result) return errorResponse(result.error as string, 400);

  return NextResponse.json({ entity: result }, { status: 201 });
}
```

**Type narrowing note:** When checking `"error" in result`, use `result.error as string` — TypeScript narrows it to `string | undefined` in union returns.

### Validation (Zod v4)

```typescript
import { z } from "zod/v4";  // NOT "zod"
```

### State Machines

Follow the pattern in `src/services/trip/state-machine.ts`:
- `VALID_TRANSITIONS` record mapping each state to valid next states
- Export `canTransition(from, to)`, `getNextStates(current)`, `validateTransition(from, to)`

Current state machines: Trip (8 states), BookingRequest (9), Reservation (6), FeeCharge (5).

### Auth

- `systemRole` is embedded in JWT via `src/lib/auth.ts` callbacks
- Utilities in `src/lib/api-utils.ts`: `requireAuth`, `requireSelf`, `requireAdmin`, `requireConcierge`
- Session extension requires: `(session.user as unknown as Record<string, unknown>).systemRole`

## Adding a New Feature

1. **Schema** — add table in `src/lib/db/schema/{entity}.ts`, export from barrel
2. **Types** — add type aliases in `src/types/index.ts`
3. **Service** — add `src/services/{domain}/{entity}.service.ts`
4. **Validation** — add Zod schema in `src/lib/validation/{domain}.ts`
5. **Route** — add `src/app/api/{resource}/route.ts`
6. **Test** — add `tests/unit/{entity}.test.ts`
7. **Commit** — after `pnpm test` and `next build` pass

If the entity has lifecycle states, add a state machine following the pattern above.

## Testing

```bash
pnpm test                # Unit tests (~450, ~2s)
pnpm test:integration    # Integration tests (requires Docker, ~40s)
pnpm test:watch          # Watch mode for development
```

Unit tests use vitest + jsdom. Integration tests use testcontainers with a real PostgreSQL + PostGIS container.

Prefer testing pure exported functions (state machines, vote logic, party split, fee computation) over mocking database calls.

## Commit Conventions

```
feat(M1): description     # M1 milestone feature
feat(M2): description     # M2 milestone feature
chore: description         # tooling, config, process
docs: description          # documentation only
fix: description           # bug fix
```

Always include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` when AI-assisted.

## Architecture Decisions

See `tasks/adrs/` for formal Architecture Decision Records documenting major choices (ORM, auth, PostGIS, booking strategy, job queue, etc.).
