# ADR 008: Custom State Machine Pattern over Library

## Status

Accepted

## Context

Four entities in the application have lifecycle state management:

1. **Trip** (8 states): `draft -> planning -> voting -> booking -> locked -> in_progress -> completed -> archived` (`src/services/trip/state-machine.ts`)
2. **BookingRequest** (9 states): `candidate -> window_pending -> requested -> partial_hold -> booked -> swappable -> locked -> played | canceled` (`src/services/booking/state-machines/booking-request-sm.ts`)
3. **Reservation** (6 states): `confirmed -> swappable -> locked -> played | canceled | no_show` (`src/services/booking/state-machines/reservation-sm.ts`)
4. **FeeCharge** (5 states): `pending -> collectible -> charged -> refunded | waived` (`src/services/billing/state-machines/fee-charge-sm.ts`)

State machine libraries considered: XState, Robot, machina.js. All provide features beyond what the application needs (nested states, parallel states, guards, actions, interpreters) and add dependency weight.

## Decision

Use a **custom `VALID_TRANSITIONS` record pattern** with three exported functions per entity: `canTransition(from, to)`, `getNextStates(current)`, and `validateTransition(from, to)`.

The pattern is identical across all four implementations:

```typescript
const VALID_TRANSITIONS: Record<Status, Status[]> = { ... };
export function canTransition(from, to): boolean;
export function getNextStates(current): Status[];
export function validateTransition(from, to): { valid: true } | { valid: false; reason: string };
```

- Status types are defined as union types in `src/types/index.ts`
- Each state machine module is co-located with its service: `src/services/<domain>/state-machines/<entity>-sm.ts`
- Transition validation returns a discriminated union with a `reason` string for error messages
- Service layers call `validateTransition` before any status update and reject invalid transitions with the reason

## Consequences

**What we gained:**

- Zero dependencies for state management. No library to install, configure, or update.
- Each state machine is a single file under 50 lines. Easy to read, test, and modify.
- The `VALID_TRANSITIONS` record is a complete, scannable declaration of all legal transitions. No hidden states or implicit transitions.
- Consistent pattern across all four entities. Once you understand Trip's state machine, you understand all of them.
- Pure functions with no side effects. Fully unit-testable without mocking (tests in `tests/unit/state-machine.test.ts`, `tests/unit/booking-request-sm.test.ts`, `tests/unit/reservation-sm.test.ts`, `tests/unit/fee-charge-sm.test.ts`).
- The discriminated union return type (`{ valid: true } | { valid: false; reason: string }`) gives callers a type-safe way to handle validation failures without exceptions.

**What we gave up:**

- No guard conditions in the state machine itself. Business rules like "can only transition to `booked` if all slots are confirmed" live in the service layer, not the state machine. This means the state machine validates topology only; the service validates semantics.
- No built-in side effects (actions/effects on transition). Side effects (e.g., dispatch notification on status change, create fee charge on booking confirmation) are handled by the service layer after a successful transition. This is a deliberate separation of concerns but means transition side effects are scattered across service code.
- No state machine visualization tools. XState provides a visual inspector; our pattern requires reading the `VALID_TRANSITIONS` record. At 5-9 states per entity, this is manageable.
- No hierarchical or parallel states. If a future entity needs nested state machines (e.g., a booking request with sub-states per slot), the pattern would need to be extended or a library adopted.

**Risks:**

- As the number of entities with state machines grows, the copy-paste pattern could lead to subtle inconsistencies. Mitigated by the state-machine skill definition in `.claude/skills/state-machine/SKILL.md` which standardizes the pattern.
- Service-layer guard conditions (business rules) are not co-located with the transition map, making it possible to add a transition to `VALID_TRANSITIONS` without implementing the corresponding business rule validation. Code review discipline and integration tests are the primary mitigation.
