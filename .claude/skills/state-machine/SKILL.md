---
name: state-machine
description: Use this skill whenever implementing, modifying, or reviewing any entity with lifecycle states in the golf trip app. This includes Trip, BookingRequest, PhotoAsset, Bet, Reservation, or any new entity that transitions through defined states. Also trigger when building state transition logic, writing migration code for status columns, implementing status-dependent UI, creating activity feed entries for state changes, or adding a new state to an existing entity. If the task involves the words "status," "state," "transition," "lifecycle," or references any entity from PRD Section 10, use this skill.
---

# State Machine Pattern

This project has multiple entities that follow lifecycle state machines. All of them must be implemented consistently to avoid divergent patterns that create bugs and maintenance burden.

## Canonical State Machines (from PRD Section 10)

### Trip
```
Draft → Planning → Voting → Booking → Locked → In Progress → Completed → Archived
```

### BookingRequest
```
Candidate → Window Pending → Requested → Partial Hold → Booked → Swappable → Locked → Played
                                                                                    └→ Canceled
```

### PhotoAsset
```
Private → Review Pending → Publish Eligible → Published → Withdrawn
```

### Bet (derived from PRD FR-53, FR-54, FR-69)
```
Proposed → Accepted → Active → Settled → Paid
                   └→ Rejected
        └→ Expired
        └→ Voided
```

## Implementation Rules

### 1. Use a string enum, not integers
Define states as a TypeScript string enum. Never use numeric status codes — they're unreadable in logs, queries, and activity feeds.

```typescript
// CORRECT
export enum TripStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  VOTING = 'voting',
  BOOKING = 'booking',
  LOCKED = 'locked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

// WRONG — never do this
export enum TripStatus {
  DRAFT = 0,
  PLANNING = 1,
  // ...
}
```

### 2. Define allowed transitions explicitly
Every state machine must have an explicit transition map. Do not rely on ad hoc status checks scattered through the codebase. The transition map is the single source of truth.

```typescript
export const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.DRAFT]: [TripStatus.PLANNING],
  [TripStatus.PLANNING]: [TripStatus.VOTING],
  [TripStatus.VOTING]: [TripStatus.BOOKING],
  [TripStatus.BOOKING]: [TripStatus.LOCKED],
  [TripStatus.LOCKED]: [TripStatus.IN_PROGRESS],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED],
  [TripStatus.COMPLETED]: [TripStatus.ARCHIVED],
};
```

### 3. Centralize transition logic in a single function
All state changes go through one function per entity. This function validates the transition, performs the update, logs to the activity feed, and emits events. No code anywhere else should directly update a status column.

```typescript
async function transitionTrip(
  tripId: string,
  toStatus: TripStatus,
  actor: { userId: string; role: string },
  reason?: string
): Promise<Trip> {
  const trip = await getTripOrThrow(tripId);
  const allowed = TRIP_TRANSITIONS[trip.status];

  if (!allowed.includes(toStatus)) {
    throw new InvalidTransitionError(trip.status, toStatus, 'Trip');
  }

  const updated = await updateTripStatus(tripId, toStatus);

  // PRD FR-10, FR-74: all state transitions must be logged and visible in activity feed
  await logActivityFeedEntry({
    tripId,
    event: `trip_status_changed`,
    from: trip.status,
    to: toStatus,
    actorId: actor.userId,
    actorRole: actor.role,
    reason,
    timestamp: new Date(),
  });

  // Emit domain event for other services (notifications, fees, etc.)
  await emitDomainEvent('trip.status.changed', {
    tripId,
    from: trip.status,
    to: toStatus,
    actor,
  });

  return updated;
}
```

### 4. Every transition logs to the activity feed
PRD FR-74 requires that every meaningful state change is logged with: event description, actor (user or system), and timestamp. This is non-negotiable. The activity feed is how users recover from missed notifications.

### 5. State changes emit domain events
State transitions often trigger cross-service side effects. For example:
- BookingRequest → Booked triggers fee capture (billing service)
- BookingRequest → Canceled may trigger fee reversal
- PhotoAsset → Published triggers microsite rebuild
- Trip → In Progress triggers round-mode availability

Use domain events (not direct service calls) so that the state machine owner doesn't need to know about every downstream consumer.

### 6. Guard against terminal state modifications
Archived trips, settled bets, and withdrawn photos are terminal or near-terminal states. The transition map should make these states unreachable from most other states. Additionally, add a guard:

```typescript
const TERMINAL_STATES = [TripStatus.ARCHIVED];

if (TERMINAL_STATES.includes(trip.status)) {
  throw new TerminalStateError(trip.status, 'Trip');
}
```

PRD acceptance criteria for FR-63: "Given an archived trip, when a non-admin user attempts to modify data, then the system prevents the edit."

### 7. Database column conventions
- Column name: `status` (not `state`, not `trip_status`)
- Type: varchar with CHECK constraint matching the enum values
- Index: always index status columns — they appear in nearly every query filter
- Default: set a sensible default (e.g., `draft` for Trip, `private` for PhotoAsset)
- Add `status_changed_at` timestamp column alongside `status` for debugging and SLA tracking

### 8. New state machines
When adding a new entity with lifecycle states:
1. Define the enum in the entity's types file
2. Define the transition map alongside the enum
3. Implement a single `transition<Entity>()` function
4. Add activity feed logging and domain event emission
5. Add the entity to this skill's canonical list above
6. Write transition tests covering every valid transition AND every invalid transition attempt

## Testing State Machines

Every state machine must have tests covering:
- **Happy path**: every valid transition in sequence
- **Invalid transitions**: attempting every disallowed transition throws `InvalidTransitionError`
- **Terminal states**: attempting to leave a terminal state throws `TerminalStateError`
- **Activity feed**: every transition creates an activity feed entry with correct actor and timestamp
- **Domain events**: every transition emits the expected domain event
- **Concurrency**: two simultaneous transitions on the same entity do not corrupt state (use optimistic locking or row-level locks)
