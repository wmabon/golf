# CLAUDE.md

## Workflow Orchestration

1. **Plan Mode Default**
   - Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
   - If something goes sideways, STOP and re-plan immediately – don't keep pushing
   - Use plan mode for verification steps, not just building
   - Write detailed specs upfront to reduce ambiguity

2. **Subagent Strategy**
   - Use subagents liberally to keep main context window clean
   - Offload research, exploration, and parallel analysis to subagents
   - For complex problems, throw more compute at it via subagents
   - One task per subagent for focused execution

3. **Self-Improvement Loop**
   - After ANY correction from the user: update `tasks/lessons.md` with the pattern
   - Write rules for yourself that prevent the same mistake
   - Ruthlessly iterate on these lessons until mistake rate drops
   - Review lessons at session start for relevant project

4. **Verification Before Done**
   - Never mark a task complete without proving it works
   - Diff behavior between main and your changes when relevant
   - Ask yourself: "Would a staff engineer approve this?"
   - Run tests, check logs, demonstrate correctness

5. **Demand Elegance (Balanced)**
   - For non-trivial changes: pause and ask "is there a more elegant way?"
   - If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
   - Skip this for simple, obvious fixes – don't over-engineer
   - Challenge your own work before presenting it

6. **Autonomous Bug Fixing**
   - When given a bug report: just fix it. Don't ask for hand-holding
   - Point at logs, errors, failing tests – then resolve them
   - Zero context switching required from the user
   - Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Commit at Feature Boundaries**: After each FR group passes build + tests, commit immediately. Never accumulate more than one feature without committing.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Backend/API**: Next.js Route Handlers (named exports: GET, POST, PUT, DELETE)
- **Database**: PostgreSQL 16 + PostGIS 3.4 via Drizzle ORM
- **Auth**: Auth.js v5 (next-auth@beta) with Credentials provider + JWT sessions
- **Validation**: Zod v4 (`import { z } from "zod/v4"` — NOT `"zod"`)
- **Cache/Queue**: Redis 7 via ioredis + BullMQ for background jobs
- **Payments**: Stripe (direct charges, no Connect needed yet)
- **Testing**: Vitest + React Testing Library (unit), testcontainers (integration)
- **Local Dev**: Docker Compose (PG+PostGIS on 5432, Redis on 6379)

## Local Development

```bash
docker compose up -d
DATABASE_URL=postgresql://golf:golf_dev_password@localhost:5432/golf_dev pnpm db:migrate
DATABASE_URL=postgresql://golf:golf_dev_password@localhost:5432/golf_dev npx tsx src/lib/db/seed/index.ts
DATABASE_URL=postgresql://golf:golf_dev_password@localhost:5432/golf_dev AUTH_SECRET=dev-secret-for-testing pnpm dev
```

Test credentials (after seed):
- `demo@golf.test` / `password123` (regular user)
- `captain@golf.test` / `password123` (regular user)
- `admin@golf.test` / `password123` (admin role)

### Migration Gotchas
- `drizzle-kit` does not read `.env.local` — always pass `DATABASE_URL=...` explicitly
- After `pnpm db:generate`, manually edit the migration SQL:
  1. Unquote geography type: replace `"geography(Point, 4326)"` with `geography(Point, 4326)`
  2. Add `CREATE EXTENSION IF NOT EXISTS postgis;` before first CREATE TABLE
  3. Add GIST indexes: `CREATE INDEX ... ON courses/airports USING GIST(location);`

## Project Conventions

### Schema (Drizzle ORM)
- Files at `src/lib/db/schema/{entity}.ts`
- Use `pgEnum` for enums, `pgTable` for tables
- Standard fields: `id` (uuid defaultRandom PK), `createdAt`, `updatedAt` (with `.$onUpdate`)
- JSONB columns typed with `.$type<T>()`
- Indexes in second param: `(table) => [index(...)]`
- Export types: `type Entity = typeof table.$inferSelect; type NewEntity = typeof table.$inferInsert;`
- Barrel file at `src/lib/db/schema/index.ts` — re-export all tables, enums, types
- Use `satisfies NewEntity` on insert values for type safety

### PostGIS
- Column type: `geography(Point, 4326)` via custom type in `src/lib/db/postgis.ts`
- **NEVER** rely on `fromDriver` for geography reads — it returns a sentinel `{lat:0, lng:0}`
- Always use `ST_Y(col::geometry)` for latitude, `ST_X(col::geometry)` for longitude in SELECT
- Spatial queries use helpers from `src/lib/db/spatial-helpers.ts`: `withinRadius`, `distanceMiles`, `extractLat`, `extractLng`, `withinBounds`
- Coordinate order: **longitude first** in `ST_MakePoint(lng, lat)` and `SRID=4326;POINT(lng lat)`
- GIST indexes must be **manually added** to generated migrations — Drizzle cannot generate `USING GIST`

### Services
- Files at `src/services/{domain}/{entity}.service.ts`
- Pure functions (no classes), export individually
- Use `db.transaction(async (tx) => {...})` for multi-step operations
- Return patterns: `null` (not found), `{ error: string }` (business rule failure), entity (success)
- Log state changes to `activityFeedEntries`

### API Routes (for client-side calls)
- Files at `src/app/api/{resource}/route.ts`
- Dynamic params: `{ params }: { params: Promise<{ id: string }> }`
- Auth check first: `requireAuth()`, then permission: `isTripMember()` / `isCaptain()`
- Admin routes use `requireAdmin()` or `requireConcierge()`
- Body validation: `parseBody(request, zodSchema)` returns `{ data } | { error }`
- Error responses: `errorResponse(message, status)`
- **Type narrowing**: when checking `"error" in result`, cast with `result.error as string`

### Server Components (pages)
- **NEVER** fetch your own API routes from server components — the fetch won't carry the auth session cookie and will return 401
- **ALWAYS** call services directly: `import * as courseService from "@/services/discovery/course.service"`
- API routes are for client-side `fetch()` calls only (from `"use client"` components)
- Server components have direct database access — no need to round-trip through HTTP

### Admin Console
- Route group: `src/app/(admin)/` — separate layout from consumer app
- Layout gate: `src/app/(admin)/layout.tsx` checks auth + systemRole via DB lookup, silently redirects non-admin users to `/dashboard`
- Admin pages call services directly (same server component pattern)
- Client components for mutations only: forms call `/api/admin/*` endpoints via fetch
- Sidebar nav in `src/components/ui/admin-nav.tsx` (slate palette, Trust Posture)
- Admin API routes at `src/app/api/admin/` use `requireAdmin()` or `requireConcierge()`
- Pages: `/admin` (dashboard), `/admin/booking-ops` (concierge queue), `/admin/courses` (curation), `/admin/config` (fee schedules, flags)

### State Machines
- Files at `src/services/{domain}/state-machine.ts` (or `state-machines/{entity}-sm.ts`)
- Pattern: `VALID_TRANSITIONS` record → `canTransition(from, to)` → `getNextStates(current)` → `validateTransition(from, to)`
- All transitions logged to activity feed
- Current state machines: Trip (8), BookingRequest (9), Reservation (6), FeeCharge (5), Round (5), Bet (6), PhotoAsset (5)

### Auth
- `systemRole` embedded in JWT via auth.ts callbacks (id + systemRole)
- Session extension uses: `(session.user as unknown as Record<string, unknown>).systemRole`
- Utilities: `requireAuth`, `requireSelf`, `requireAdmin`, `requireConcierge` in `src/lib/api-utils.ts`

### Background Jobs (BullMQ)
- Queue definitions + job name constants in `src/jobs/queues.ts`
- Worker process entry point: `src/jobs/worker.ts` (run via `pnpm worker`)
- Three queues: `booking`, `billing`, `notification`
- Add new job names to `JobNames` const in `queues.ts`, wire handlers in `worker.ts`

### Notification Dispatch
- Use `dispatchNotification()` from `src/services/notification/dispatch.service.ts` for single-user notifications
- Use `dispatchToTripMembers()` for trip-wide broadcasts (auto-excludes actor)
- Both respect per-channel, per-event-type preferences (default: enabled)
- Email/SMS are logged stubs until providers are integrated; in-app creates DB records

### Optimization / Swap Constraints
- Pure constraint functions in `src/services/optimization/swap-constraints.ts`
- Config constants: `SWAP_CONSTRAINTS` object (quality threshold 15%, cost ceiling $20, safety margin 48h, max 2/round, ±60 min window)
- FR-36 (safe-swap-only): never cancel a reservation without a confirmed replacement — enforced in service layer, not state machine

### UI Tone (Two-Mode Design)
- **Mode 1 — Social Energy**: discovery, voting, scoring, bets, recaps, empty states. Witty, punchy copy. Green palette (#166534 / #15803d). Large type, bold cards.
- **Mode 2 — Trust Posture**: booking, fees, consent, cancellation, payments. Plainspoken, exact amounts, no humor. Restrained palette.
- Button labels have personality in Mode 1 ("Lock it in", "Throw one in") but describe the action in Mode 2 ("Confirm booking for $185")
- Empty states motivate action ("No trips yet. Someone's gotta go first.") not describe absence ("No trips found.")
- Full guide: `.claude/skills/ui-tone/SKILL.md`

### Testing
- Unit tests: `tests/unit/*.test.ts` — vitest + jsdom, no DB
- Integration tests: `tests/integration/*.test.ts` — testcontainers + real PG
- Prefer testing pure exported functions (state machines, vote logic, party split, fee computation, swap constraints)
- Run: `pnpm test` (unit), `pnpm test:integration` (integration)

### Documentation Discipline
- Update `docs/api.md` when adding new endpoints
- Update `README.md` stats (routes, tests, tables) at milestone boundaries
- Write ADRs in `tasks/adrs/` for significant architecture decisions
- Update `tasks/lessons.md` immediately after discovering gotchas
- Keep `tasks/_queue.json` current — mark features done after build + tests pass

### Commit Conventions
- `feat(M1):` / `feat(M2):` / `feat(M3):` — milestone-scoped features
- `chore:` — tooling, config, process changes
- `docs:` — documentation only
- `fix:` — bug fixes
- Use specific file staging (`git add file1 file2`), never `git add -A`
- Heredoc messages trigger safety hook false positives on words like "email", "shortlist" — use `git commit -F /tmp/msg.txt` instead
- Always include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
