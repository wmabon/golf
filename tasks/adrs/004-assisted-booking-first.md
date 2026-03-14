# ADR 004: Assisted Booking as Primary M2 Path

## Status

Accepted

## Context

The aggregator API spike (`tasks/spikes/aggregator-api-findings.md`) found that no golf tee-time booking API is publicly available. All major providers (GolfNow/GN Connect, Supreme Golf, foreUP, Lightspeed Golf) require B2B partnership agreements with 2-6 month timelines. The spike identified multi-hold restrictions, anti-bot protections, and ToS constraints that make scraping or unauthorized automation non-viable.

The PRD (FR-33) defines three booking modes: `direct`, `guided_checkout`, and `assisted`. M2 needs a production booking path that works without any external API partnership.

## Decision

Build **assisted booking (concierge ops workflow) as the primary and only production booking mode for M2**. Direct API integrations are progressive enhancements, feature-flagged behind the `BookingProvider` interface (`src/services/booking/providers/booking-provider.interface.ts`).

- `AssistedBookingProvider` (`src/services/booking/providers/assisted-booking.provider.ts`) implements the `BookingProvider` interface by enqueuing ops work items via BullMQ instead of making API calls
- `search()` returns empty (availability checked manually by concierge)
- `hold()` creates an ops queue item via `bookingQueue.add(JobNames.ASSISTED_BOOKING_PROCESS, ...)`
- `confirm()`, `release()`, `cancel()` are no-ops; actual confirmation is captured by concierge through the ops console
- The ops console (FR-76) is launch-critical infrastructure, not a nice-to-have admin tool
- Course-to-provider mapping is stored per course record, defaulting to `assisted`

## Consequences

**What we gained:**

- M2 can ship without any external API dependency. Launch timeline is fully under our control.
- The concierge workflow mirrors how group golf trips are actually booked today (phone calls to pro shops), making it the most reliable booking method for multi-slot scenarios
- The `BookingProvider` interface is designed so that `GolfNowProvider`, `ForeUpProvider`, and `LightspeedProvider` can be added as implementations without changing the booking orchestration layer
- FR-36 safety (no speculative cancellations) is naturally enforced because the concierge manually coordinates replacements before canceling

**What we gave up:**

- No self-service booking at launch. Every booking request requires human concierge involvement, creating an ops cost per booking.
- Booking latency is hours (concierge response time) instead of seconds (API hold). The escalation job in `src/jobs/worker.ts` flags requests unassigned for >4 hours.
- Cannot demonstrate "instant booking" to investors or beta users. The product feels more like a concierge service than a tech platform until API integrations are live.

**Risks:**

- Ops console quality directly determines booking throughput. A poor concierge UX creates a bottleneck.
- If B2B partnerships take longer than 6 months, assisted booking remains the only path and ops costs scale linearly with booking volume.
- Concierge availability outside business hours limits booking responsiveness for time-sensitive windows.
