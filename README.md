# Golf Trip

A web app that helps 2-8 golfers plan, book, optimize, play, and memorialize U.S. golf trips. Converts chaotic group chats into booked, improving golf trips that users trust.

## Status

| Milestone | Description | Status |
|-----------|-------------|--------|
| **M1** | Planning core: accounts, trips, discovery, quality, voting | Complete |
| **M2** | Booking core: booking engine, fee billing, concierge ops | Complete |
| **M3** | Optimization + itinerary: swap suggestions, shared itinerary, notifications | Complete |
| **M4** | On-trip + recap: scoring, games, side bets, photos, microsites | Complete |
| **M5** | Travel add-ons: optional lodging and air | Complete |

**All milestones complete.** 103 API routes, 933 tests (899 unit + 34 integration), 38 database tables, 7 state machines.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database:** PostgreSQL 16 + PostGIS 3.4 via Drizzle ORM
- **Auth:** Auth.js v5 with credentials provider, JWT sessions
- **Validation:** Zod v4
- **Cache/Queue:** Redis 7 (ioredis) + BullMQ for background jobs
- **Payments:** Stripe (fee collection)
- **Testing:** Vitest, React Testing Library, testcontainers (PostgreSQL)

## Quick Start

```bash
git clone https://github.com/wmabon/golf.git
cd golf
pnpm install
docker compose up -d    # PostgreSQL + PostGIS, Redis
pnpm dev                # http://localhost:3000
```

Copy `.env.example` to `.env.local` and set `AUTH_SECRET` to a random string.

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    api/                  # REST API (55 routes)
      auth/               # Registration, login, session
      users/              # Profile and membership CRUD
      trips/              # Trip lifecycle, invites, voting, booking
      courses/            # Discovery, reviews, quality, reports
      search/             # Spatial course search, airport autocomplete
      billing/            # Fee estimates
      admin/              # Concierge ops console
    (auth)/               # Login and register pages
    (app)/                # Authenticated app pages
  lib/
    db/
      schema/             # 38 Drizzle schema files (tables + enums)
      postgis.ts          # Custom geography(Point, 4326) type
      spatial-helpers.ts  # PostGIS query helpers
      seed/               # 50 airports + 97 courses with real coordinates
    auth.ts               # Auth.js configuration
    api-utils.ts          # Route helpers (requireAuth, parseBody, errorResponse)
    validation/           # Zod schemas per domain
  services/
    identity/             # User and membership services
    trip/                 # Trip CRUD, state machine, invitations, voting
    discovery/            # Course search, reviews, quality scoring
    booking/              # Booking requests, slots, reservations, party split
    billing/              # Fee schedules, fee charges, disclosure
    admin/                # Concierge booking operations
  jobs/                   # BullMQ queues and worker process
  types/                  # Shared TypeScript type definitions
tests/
  unit/                   # 447 unit tests (vitest + jsdom)
  integration/            # 5 integration tests (testcontainers + real PG)
docs/
  golf_trip_coordination_prd_v3.md    # Full product requirements document
  decomposition/                      # Data model, API surface, background jobs maps
  decision-log.md                     # 62 tracked engineering decisions
  m2-booking-core-plan.md             # M2 architecture analysis
tasks/
  _queue.json             # Feature tracking with FR number mapping
  lessons.md              # Development patterns and gotchas
  spikes/                 # PostGIS validation, aggregator API research
```

## API Overview

| Service | Routes | Key Features |
|---------|--------|-------------|
| Identity | 14 | Auth, profiles, memberships |
| Trip & Collaboration | 27 | CRUD, invites, voting, captain override |
| Discovery & Scoring | 13 | PostGIS spatial search, reviews, quality model |
| Booking Orchestration | 14 | Requests, booking room, reservations, external capture |
| Billing | 3 | Fee estimates, trip fee listing |
| Admin / Ops | 8 | Concierge booking queue, assignment, confirmation |

Full endpoint specification: [docs/decomposition/api-surface-map.md](docs/decomposition/api-surface-map.md)

## Testing

```bash
pnpm test                # Unit tests (447, ~2s)
pnpm test:integration    # Integration tests (5, ~40s, requires Docker)
```

## Documentation

- [Product Requirements Document](docs/golf_trip_coordination_prd_v3.md) — 83 functional requirements across 5 milestones
- [Data Model Map](docs/decomposition/data-model-map.md) — Entity catalog, relationships, state machines
- [API Surface Map](docs/decomposition/api-surface-map.md) — All endpoints by service boundary
- [Background Jobs Map](docs/decomposition/background-jobs-map.md) — 38 async workflows
- [Decision Log](docs/decision-log.md) — 62 engineering decisions (12 decided, 50 open)
- [M2 Booking Plan](docs/m2-booking-core-plan.md) — Architecture for the booking engine
- [PostGIS Spike](tasks/spikes/postgis-findings.md) — Spatial query validation
- [Aggregator API Research](tasks/spikes/aggregator-api-findings.md) — Golf booking API landscape
