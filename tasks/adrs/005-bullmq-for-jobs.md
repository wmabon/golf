# ADR 005: BullMQ for Background Jobs

## Status

Accepted

## Context

M2 requires 10 background jobs spanning booking, billing, and notifications (documented in `docs/m2-booking-core-plan.md`). Jobs need three trigger types:

- **Cron**: booking-window-alert (hourly), fee-capture-threshold (hourly), booking-escalation (every 30min), cancellation-deadline-monitor (daily)
- **Event-driven**: assisted-booking-processor, confirmation-capture, notification-dispatch, billing-audit-log, external-booking-import
- **Orchestration**: concurrent-cart-hold-orchestrator (feature-flagged, requires multi-step coordination)

Redis (`ioredis@5.10.0`) is already in the dependency tree for caching and coordination. The primary alternative considered was Inngest (hosted durable functions).

## Decision

Use **BullMQ** (`bullmq@5.71.0`) for all background job processing.

- Three named queues defined in `src/jobs/queues.ts`: `booking`, `billing`, `notification`
- Type-safe job names via `JobNames` const object (9 job types defined, expandable)
- Single worker process started via `pnpm worker` (`npx tsx src/jobs/worker.ts`)
- Workers connect to Redis via `REDIS_HOST` and `REDIS_PORT` environment variables
- Graceful shutdown on `SIGTERM` closes all three workers
- Job handlers use switch/case dispatch per queue in `src/jobs/worker.ts`

## Consequences

**What we gained:**

- Reuses existing Redis infrastructure; no new service dependency
- TypeScript-native with strong typing support
- Supports all three trigger types (cron via `repeat`, event via `add`, orchestration via job chaining/flows)
- Built-in retry with exponential backoff, dead-letter queues, and job event listeners
- BullMQ dashboard (Bull Board) available as a drop-in admin UI for job monitoring
- Separate worker process (`src/jobs/worker.ts`) keeps job execution isolated from the Next.js server process

**What we gave up:**

- Requires a separate long-running worker process in production (additional deployment unit vs. serverless functions)
- No built-in durable execution or step-function semantics (unlike Inngest). Multi-step orchestration (e.g., cart-hold-orchestrator) must be implemented manually with job chaining.
- Redis persistence must be configured for job durability. If Redis data is lost, in-flight jobs are lost. Mitigation: use Redis AOF persistence or a managed Redis service.
- No visual workflow editor or hosted monitoring dashboard (unlike Inngest). Must self-host Bull Board or build custom monitoring.

**Risks:**

- Worker process crash loses in-progress jobs. BullMQ's `lockDuration` and `stalledInterval` provide automatic retry for stalled jobs, but job handlers must be idempotent.
- Three queues sharing one Redis instance could create contention under high load. At current scale (tens of jobs per hour) this is not a concern. Monitor if booking volume exceeds hundreds per hour.
