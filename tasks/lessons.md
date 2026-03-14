# Lessons Learned

Corrections, patterns, and insights captured during development.

## Patterns

### Type narrowing for service return unions
Services return `{ error: string } | { data }` unions. In route handlers, TypeScript narrows `result.error` to `string | undefined`. Fix: use `result.error as string` after the `"error" in result` check.

### Auth.js session extension requires double cast
Extending the session user object with custom fields (like `systemRole`) requires:
```typescript
(session.user as unknown as Record<string, unknown>).systemRole = token.systemRole as string;
```
Single cast `as Record<string, unknown>` fails because `AdapterUser & User` doesn't overlap with `Record<string, unknown>`.

### PostGIS geography fromDriver returns WKB hex
The Drizzle `customType` `fromDriver` for geography columns receives binary WKB, not coordinates. Always use `ST_Y(col::geometry)` and `ST_X(col::geometry)` in SQL SELECT clauses to extract lat/lng. The `fromDriver` returns a sentinel `{lat:0, lng:0}`.

### PostGIS coordinate order: longitude first
`ST_MakePoint(lng, lat)` and WKT `POINT(lng lat)` use longitude-first order. This is the opposite of most map UIs which show lat/lng. Convention: all internal storage is (lng, lat), display conversion at API boundary.

### Drizzle cannot generate GIST indexes
After `pnpm db:generate`, manually edit the migration SQL to add GIST indexes. Drizzle's `index()` only generates BTREE. Applies to all PostGIS spatial indexes.

## Anti-Patterns

### Zod v4 import path
Wrong: `import { z } from "zod"` | Right: `import { z } from "zod/v4"`. The project uses Zod v4 which has a different entry point.

### useSearchParams without Suspense
Next.js 16 requires `useSearchParams()` wrapped in `<Suspense>` for statically generated pages. Build fails without it.

### Empty schema barrel file
A schema barrel file with only comments causes "is not a module" TypeScript errors. Fix: add `export {};` as minimum.

### Next.js 16 middleware deprecation
Next.js 16 deprecated `middleware.ts` for `proxy`. Current code uses middleware (warning only). Migrate eventually.

### Worktree isolation requires a git commit
Agent worktree isolation fails with "Failed to resolve base branch HEAD" if repo has zero commits. Always commit before using worktree isolation.

### BullMQ connection format
BullMQ uses `{ host, port }` object, NOT a URL string like ioredis. Parse REDIS_URL or use separate env vars.

### Drizzle customType geography is quoted in migrations
Drizzle generates `"geography(Point, 4326)"` (with double quotes) for customType columns. PostgreSQL treats this as a literal type name and fails. After `pnpm db:generate`, manually find-and-replace `"geography(Point, 4326)"` → `geography(Point, 4326)` (unquoted) in the migration SQL.

### drizzle-kit migrate needs DATABASE_URL
`drizzle-kit migrate` does not read `.env.local`. Pass it explicitly: `DATABASE_URL=... pnpm db:migrate`. Same for `pnpm db:seed`.

### Safety hook false positives
The bash safety hook matches patterns like `curl|bash` inside words (e.g., "localhost" contains "bash" after "local"). Workaround for commit messages: use `git commit -F /tmp/msg.txt` instead of heredocs. Cannot use curl/wget in bash — use WebFetch tool or verify manually in browser.

## Project-Specific Notes

### Feature tracking
Features tracked in `tasks/_queue.json` with slugs (e.g., `fr-29-34-booking-engine`). Status: backlog → done.

### 7 state machines
Trip (8 states), BookingRequest (9), Reservation (6), FeeCharge (5), Round (5), Bet (6), PhotoAsset (5). All follow same pattern.

### Assisted booking is the primary M2 path
No golf booking API is publicly available. Assisted booking (concierge) is production mode. Direct API integration feature-flagged behind `BookingProvider` interface.

### Server components must not fetch own API routes
Server components calling `fetch("http://localhost:3000/api/...")` fail because the fetch doesn't carry the auth session cookie → 401. Always import and call service functions directly in server components. API routes are for client-side `"use client"` components only.

### Commit discipline
Commit at feature boundaries after build + tests pass. Use specific file staging, not `git add -A`.
