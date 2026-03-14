# M2 Booking Core — Implementation Plan

> Synthesized from booking-engine, billing-agent, and architect-review analyses (2026-03-14)

## Executive Summary

M2 is 2-3x the complexity of M1. It introduces **three new infrastructure concerns** (job queue, real-time, external API integration), **two new service boundaries** (Booking, Billing), and the most complex state machines in the app.

**Key strategic insight from the aggregator API spike:** No golf booking API is publicly available. All require B2B partnership agreements with 2-6 month timelines. **Assisted booking (ops/concierge) is the only realistic M2 booking mode.** Direct API booking is a progressive enhancement, feature-flagged until partnerships are secured.

**Recommendation:** Build assisted booking excellently first. The entire M2 architecture should optimize for making the concierge workflow fast, reliable, and scalable — with API integrations reducing ops load over time.

---

## M2 Scope: 17 FRs Across 3 Feature Groups

### Booking Engine (FR-29-34) — ALL P0
| FR | Title | Deferrable? |
|---|---|---|
| FR-29 | Booking rules storage | No |
| FR-30 | Booking window dashboard | No |
| FR-31 | Party splitting | No |
| FR-32 | Booking room coordination | No |
| FR-33 | Hybrid execution (direct/guided/assisted) | No — but direct/guided are feature-flagged |
| FR-34 | Fee disclosure before confirmation | No |

### Fees & Billing (FR-67-71)
| FR | Title | M2 Scope? |
|---|---|---|
| FR-67 | Admin-configurable fee types | Yes (P0) |
| FR-68 | Fees charged at cancellation threshold | Yes (P0) |
| FR-69 | Bet fees on accepted money bets | No — M4 (rounds/scoring) |
| FR-70 | Pass-through cost disclosure | Yes (P0) |
| FR-71 | Billing audit trail | Partial — simple log initially (P1) |

### Admin/Ops Console (FR-75-79)
| FR | Title | M2 Scope? |
|---|---|---|
| FR-75 | Course curation, booking rules, scores | Yes (P0) |
| FR-76 | Concierge booking operations | Yes (P0) — heart of hybrid booking |
| FR-77 | Membership verification | Defer to M3 (P1) |
| FR-78 | Content moderation | Defer to M4 (P1) |
| FR-79 | Fee schedules, swap policies, feature flags | Yes (P0) |

---

## M1 → M2 Gaps (Must Fix Before M2 Starts)

### Schema Gaps
1. **`trip_options` missing `courseId` FK** — No way to go from "group picked Pebble Beach" to "create booking request for course UUID." Add `courseId` UUID FK (nullable) to trip_options.
2. **`course_rules` missing fields** — Add: `bookingChannel` (varchar), `cancellationPenaltyAmount` (decimal), `rulesConfirmed` (boolean), `notes` (text).
3. **`requireConcierge()` utility** — Need admin OR concierge_ops role check for ops console routes.

### Infrastructure Gaps
| Gap | What's Needed | Recommendation |
|---|---|---|
| **Job queue** | Background jobs for booking windows, fee capture, escalation, hold orchestration | **BullMQ** (Redis-based, already in stack) |
| **Real-time** | Booking room status broadcasts | **SSE for MVP** (Next.js App Router supports streaming); upgrade to WebSocket if needed |
| **Stripe** | Fee collection, payment methods | **stripe npm package** + webhook handler; direct charges (no Connect needed yet) |
| **Email/SMS** | Booking confirmations, alerts | **Resend** (already in .env.example) for email; SMS deferred |

### New Dependencies to Install
```
pnpm add stripe bullmq
pnpm add -D @types/stripe
```

---

## State Machines

### BookingRequest (8 states)
```
candidate → window_pending → requested → partial_hold → booked → swappable → locked → played
                                  |              |                                  |
                                  +--- canceled --+--- canceled                     +→ canceled
```

Key transitions:
- `candidate → window_pending`: booking window not yet open
- `candidate → requested`: window already open (skip pending)
- `window_pending → requested`: booking-window-open-alert job fires
- `requested → partial_hold`: some slots held (multi-group only)
- `requested → booked`: all slots confirmed
- `partial_hold → booked`: remaining slots confirmed
- `booked → swappable`: within optimization window (before freeze date)
- `swappable → locked`: freeze date reached
- `locked → played`: round completed

**Invariant:** No speculative cancellations (FR-36). A booked reservation can only be canceled after a replacement is confirmed.

### Reservation (6 states)
```
pending → held → confirmed → played
                     |
                     +→ canceled
                     +→ no_show
```

**BookingRequest status is a rollup of child Reservations:**
- All pending → Requested
- Mixed held/pending → Partial Hold
- All confirmed → Booked

### FeeCharge (5 states)
```
pending → collectible → charged → refunded
  |
  +→ waived
```

- `pending`: Fee record created at booking confirmation, no payment captured
- `collectible`: Cancellation threshold crossed, ready to charge
- `charged`: Stripe payment captured
- `waived`: Booking canceled before threshold
- `refunded`: Admin-initiated refund

---

## New Database Tables (7)

| Table | Purpose | States |
|---|---|---|
| `booking_requests` | Tracks each course booking attempt | 8 states |
| `booking_slots` | Individual tee-time slots within a split party | pending/attempting/held/confirmed/failed/released |
| `reservations` | Confirmed tee-time bookings | 6 states |
| `fee_schedules` | Admin-configurable fee rules | None |
| `fee_charges` | Individual fee charge records | 5 states |
| `external_bookings` | Off-platform booking capture (FR-44) | None |
| `booking_alert_subscriptions` | Users subscribed to window alerts | None |

Plus modifications: `trip_options` (+courseId), `course_rules` (+bookingChannel, +cancellationPenaltyAmount, +rulesConfirmed, +notes)

---

## Party Split Algorithm

For `max_players=4` (standard):
| Golfers | Split | Slots |
|---|---|---|
| 2 | 2 | 1 |
| 3 | 3 | 1 |
| 4 | 4 | 1 |
| 5 | 3+2 | 2 |
| 6 | 3+3 | 2 |
| 7 | 4+3 | 2 |
| 8 | 4+4 | 2 |

Adjacent slots target gap: ≤15 minutes (configurable).

---

## Booking Architecture: Provider Abstraction

```typescript
interface BookingProvider {
  search(courseId, date, timeRange): Promise<AvailableSlot[]>
  hold(slotId): Promise<HoldResult>
  confirm(holdId, paymentInfo): Promise<ConfirmResult>
  release(holdId): Promise<void>
  cancel(confirmationId): Promise<CancelResult>
  getStatus(confirmationId): Promise<BookingStatus>
}
```

**M2 ships with:**
- `AssistedBookingProvider` — creates ops queue items, no API calls (production)
- `ExternalCaptureProvider` — handles link-out + user-entered confirmations

**Feature-flagged for future:**
- `GolfNowProvider`, `ForeUpProvider`, `LightspeedProvider`

---

## Background Jobs (10 for M2)

| Job | Trigger | Service |
|---|---|---|
| booking-window-open-alert | Cron (hourly check) | Booking + Notification |
| fee-capture-at-cancellation-threshold | Cron (hourly check) | Billing |
| booking-request-escalation | Cron (check every 30min) | Booking + Ops |
| concurrent-cart-hold-orchestrator | Event (booking attempt) | Booking (feature-flagged) |
| assisted-booking-request-processor | Event (non-integrated booking) | Booking + Ops |
| booking-confirmation-capture | Event (concierge attaches confirmation) | Booking |
| cancellation-deadline-monitor | Cron (daily) | Booking |
| notification-dispatcher | Event (all services) | Notification |
| billing-audit-log-writer | Event (fee state changes) | Billing |
| external-booking-import | Event (user submits form) | Booking |

---

## M2 Implementation Phases (5 phases, ~10 weeks)

### Phase 1: Data Foundation + Infrastructure (Weeks 1-2)
1. Fix M1 gaps: trip_options.courseId, course_rules additions, requireConcierge
2. Install stripe + bullmq
3. BullMQ worker setup + job infrastructure
4. BookingRequest schema + state machine
5. Reservation schema + state machine
6. FeeSchedule + FeeCharge schemas + state machines
7. BookingSlot, ExternalBooking, BookingAlertSubscription schemas
8. Party split algorithm (pure logic, unit-testable)
9. BookingProvider interface definition

### Phase 2: Assisted Booking Flow (Weeks 3-4) — Core M2 Value
10. AssistedBookingProvider implementation
11. BookingRequest CRUD endpoints
12. Booking room REST API (GET state, POST attempt/confirm/release)
13. Concierge console: booking request queue + assignment + notes
14. booking-confirmation-capture job
15. booking-request-escalation job (4h timeout)
16. assisted-booking-request-processor job
17. Fee disclosure endpoint (placeholder amounts)

### Phase 3: Fee Engine + Admin Console (Weeks 5-6)
18. FeeSchedule admin CRUD
19. FeeCharge creation on booking confirmation
20. fee-capture-at-cancellation-threshold job
21. Fee estimate endpoint (FR-34)
22. Billing history endpoints
23. Admin course curation UI (FR-75)
24. System configuration UI: fee schedules, feature flags (FR-79)
25. Stripe integration: Customer, PaymentMethod, PaymentIntent

### Phase 4: Time-Based Intelligence + Real-Time (Weeks 7-8)
26. Booking window dashboard (FR-30)
27. booking-window-open-alert job
28. cancellation-deadline-monitor job
29. SSE endpoint for booking room status broadcasts
30. Booking room frontend
31. External booking capture (FR-44)

### Phase 5: Integration + Hardening (Weeks 9-10)
32. Domain event wiring (booking → billing, booking → notification, booking → trip)
33. Stripe webhook handlers
34. End-to-end assisted booking flow testing
35. ExternalCaptureProvider
36. Feature-flagged concurrent-cart-hold-orchestrator (designed, not activated)
37. Provider stub implementations behind feature flags

---

## Open Decisions Impact

| Decision | Blocks | Can Build Without? | Risk |
|---|---|---|---|
| DL-34: Fee schedule amounts | Beta charges | Yes — use placeholders, admin configures later | Low |
| DL-38: Captain-pays-upfront | Direct booking checkout | Yes — only matters for API path (feature-flagged) | Low |
| DL-39: Assisted-booking status labels | Beta UX | Yes — use generic labels, refine later | Medium |
| DL-40: Unknown cancellation policy handling | Fee capture precision | Partial — default to T-48h, make configurable | Medium |
| DL-41: Assisted-booking timeout/SLA | Escalation behavior | Yes — use 4h + 24h defaults from PRD | Low |

**Bottom line:** No open decisions block M2 engineering start. Two (DL-34, DL-39) must resolve before beta.

---

## Minimum Viable Booking Flow (End-to-End)

1. Captain selects finalized course option → BookingRequest created (Candidate)
2. Party split computed (e.g., 6 golfers → 3+3)
3. If window not open → dashboard shows countdown (FR-30)
4. Window opens → ops work item created (assisted booking)
5. Concierge picks up, calls course, enters confirmation
6. Reservation(s) created, BookingRequest → Booked
7. Fee disclosure shown, FeeCharge created (pending)
8. Members see confirmed booking in booking room + trip dashboard

This exercises: FR-29, FR-30, FR-31, FR-32, FR-33 (assisted), FR-34, FR-67, FR-68, FR-75, FR-76.

---

## Risk Summary

1. **Highest risk:** Concurrent cart-hold orchestration — mitigated by feature-flagging until API access exists
2. **Infrastructure risk:** BullMQ + SSE are new patterns — recommend quick spikes in week 1
3. **Complexity risk:** M2 is 2-3x M1 effort with higher external dependency risk
4. **M1 gap risk:** trip_options.courseId missing — must fix before booking can reference voted courses

---

## File Structure Preview

```
src/
  services/
    booking/
      booking-request.service.ts
      booking-slot.service.ts
      booking-room.service.ts
      party-split.service.ts
      reservation.service.ts
      external-booking.service.ts
      providers/
        booking-provider.interface.ts
        assisted-booking.provider.ts
        external-capture.provider.ts
      state-machines/
        booking-request-sm.ts
        reservation-sm.ts
    billing/
      fee-schedule.service.ts
      fee-charge.service.ts
      fee-disclosure.service.ts
      stripe.service.ts
      state-machines/
        fee-charge-sm.ts
  jobs/
    worker.ts                     (BullMQ worker process)
    queues.ts                     (queue definitions)
    booking-window-alert.job.ts
    fee-capture.job.ts
    booking-escalation.job.ts
    cancellation-monitor.job.ts
  app/
    (admin)/
      layout.tsx                  (admin auth gate)
      booking-requests/
      courses/
      config/
    api/
      trips/[tripId]/
        booking-requests/
        booking-room/
      billing/
      webhooks/stripe/
      admin/
```
