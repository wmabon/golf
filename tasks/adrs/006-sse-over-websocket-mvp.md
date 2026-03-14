# ADR 006: Server-Sent Events over WebSocket for MVP Booking Room

## Status

Accepted

## Context

The booking room (FR-32) needs real-time status broadcasts so all trip members can see booking progress as the concierge works. Requirements:

- Server-to-client updates: booking request status changes, slot hold/confirm events, concierge notes
- Multiple clients per booking room (all trip members watching the same trip)
- Works within Next.js App Router without additional server infrastructure
- Mobile web must work (PRD Section 9)

The M2 booking core plan (`docs/m2-booking-core-plan.md`) evaluated SSE vs. WebSocket and recommended SSE for MVP.

## Decision

Use **Server-Sent Events (SSE)** for the booking room MVP. The upgrade path to WebSocket exists if bidirectional communication is needed in later milestones.

- SSE endpoint at `/api/trips/[tripId]/booking-room/stream` using Next.js App Router streaming response
- Server pushes events as booking request state transitions occur (state machine transitions in `src/services/booking/state-machines/booking-request-sm.ts`)
- Client reconnection is handled natively by the `EventSource` browser API
- Event format: JSON-encoded objects with `type` (e.g., `status_change`, `slot_update`, `note_added`) and `data` payload

## Consequences

**What we gained:**

- No additional server process or WebSocket library. SSE works with Next.js App Router's native streaming support (`ReadableStream` / `TransformStream`).
- Automatic reconnection built into the browser `EventSource` API, with `Last-Event-ID` for resuming missed events
- Simpler infrastructure: no sticky sessions, no WebSocket upgrade handshake, no socket.io dependency
- Works through corporate firewalls and HTTP proxies that may block WebSocket upgrades
- Sufficient for the MVP use case where all updates flow server-to-client

**What we gave up:**

- One-directional only (server to client). Client actions (e.g., "captain approves booking") go through standard REST endpoints, not the SSE channel. This means two communication paths for the booking room.
- No binary data support (SSE is text-only). Not relevant for current use cases.
- Connection limit: browsers enforce a per-domain limit of ~6 concurrent SSE connections. For a booking room with one SSE stream per trip, this is not a concern unless a user has 6+ trip booking rooms open simultaneously.
- SSE connections hold a long-lived HTTP connection per client. At scale (hundreds of concurrent booking rooms), this requires connection pooling or a dedicated streaming service.

**Upgrade path:**

- If M3+ features require bidirectional real-time (e.g., live chat in booking room, real-time collaborative editing), upgrade to WebSocket via a library like `ws` or `socket.io` running in a separate process.
- The event format (JSON with `type` and `data`) is transport-agnostic and can be reused over WebSocket without client-side changes beyond swapping `EventSource` for a WebSocket client.

**Risks:**

- Next.js App Router streaming behavior for SSE is not extensively documented. May require workarounds for edge cases (e.g., Vercel deployment, serverless function timeouts). Test early in Phase 4.
- If the Next.js server process restarts, all SSE connections drop. Clients reconnect automatically but may miss events during the gap. Mitigation: clients can fetch current state via REST on reconnect.
