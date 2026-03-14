---
name: acceptance-criteria
description: Use this skill whenever writing tests, reviewing test coverage, converting PRD requirements into test cases, or when the task references acceptance criteria, Given/When/Then, FR- IDs, or PRD Section 8.16. Also trigger when a test-writer agent is invoked, when someone asks "is this feature done," or when verifying that an implementation meets its requirements. If the conversation mentions any FR- number, check whether acceptance criteria exist for it and use this skill to guide test creation.
---

# Acceptance Criteria → Test Conversion

The PRD (Section 8.16) defines acceptance criteria in Given/When/Then format for all P0 requirements. This skill standardizes how those criteria become executable tests.

## Source of Truth

All P0 acceptance criteria live in PRD Section 8.16. They follow this convention:

```
Given [precondition],
when [action],
then [expected outcome].
```

Some criteria include straw-man thresholds flagged as `[ASSUMPTION — EDIT]`. These are placeholders — implement them as configurable constants, not hardcoded values, so they can be adjusted without code changes.

## Conversion Rules

### 1. One Given/When/Then = one test case
Do not combine multiple acceptance criteria into a single test. Each Given/When/Then statement from the PRD becomes its own test function. This makes failures immediately traceable to a specific requirement.

```typescript
// CORRECT — one criterion, one test
describe('FR-1: Account Creation', () => {
  it('creates account and logs in within threshold without requiring optional fields', async () => {
    // Given a new user visiting the app for the first time
    // When they complete the signup flow
    // Then account is created and logged in without handicap, phone, or club membership
  });

  it('works on phone browser without horizontal scrolling', async () => {
    // Given a user on a phone browser
    // When they complete the signup flow
    // Then all form fields are usable without horizontal scrolling or pinch-to-zoom
  });

  it('shows login redirect for existing email', async () => {
    // Given a user who already has an account
    // When they attempt to sign up with the same email
    // Then shown a clear message directing them to log in
  });
});
```

### 2. Name tests with the FR ID and a human-readable summary
Test names must include the FR- ID so that test reports map directly back to PRD requirements. Use the pattern: `FR-{id}: {short summary of the criterion}`

```typescript
// CORRECT
describe('FR-10: Trip States', () => {
  it('logs state transitions in the activity feed', ...);
  it('makes transitions visible to all trip members', ...);
});

// WRONG — no traceability
describe('Trip', () => {
  it('should change state', ...);
});
```

### 3. Extract straw-man thresholds as named constants
When the PRD flags a value as `[ASSUMPTION — EDIT]`, implement it as a configurable constant with a clear name and a comment linking back to the PRD.

```typescript
// Constants extracted from PRD acceptance criteria
// These are straw-man values flagged for review — do not hardcode in test assertions

/** FR-1: Maximum time for signup flow completion. PRD: [ASSUMPTION — EDIT: 2 minutes] */
export const SIGNUP_MAX_DURATION_MS = 2 * 60 * 1000;

/** FR-76: Unassigned booking request escalation threshold. PRD: [ASSUMPTION — EDIT: 4 hours] */
export const BOOKING_ESCALATION_THRESHOLD_MS = 4 * 60 * 60 * 1000;
```

### 4. Test edge cases called out in user stories
PRD Section 4.2 user stories include explicit edge cases as sub-bullets. These are separate test cases, not optional notes.

Examples from the PRD:
- "If I am the last member to vote and my vote creates a tie, the system should surface the deadlock state and prompt the captain to resolve it." → This is a test case for FR-24.
- "If connectivity drops mid-round, my locally saved scores should sync when connectivity returns without data loss." → This is a test case for FR-51.
- "If my guest limit is fewer than the group size, the system should show a warning rather than silently including the course." → This is a test case for FR-3.

### 5. Categorize tests by requirement priority
Organize test files to reflect the PRD's priority structure. This makes it easy to see coverage gaps for launch-critical requirements.

```
src/tests/
├── p0-core/           # P0-Core: planning-to-booking loop
│   ├── fr-01-account.test.ts
│   ├── fr-06-trip-creation.test.ts
│   ├── fr-11-discovery.test.ts
│   ├── fr-23-shortlist.test.ts
│   ├── fr-29-booking.test.ts
│   └── ...
├── p0-launch/         # P0-Launch: required before GA but not for alpha
│   ├── fr-35-optimization.test.ts
│   ├── fr-51-scoring.test.ts
│   ├── fr-57-photos.test.ts
│   └── ...
├── p1/                # P1: high-value, near-term
│   └── ...
└── helpers/
    ├── test-constants.ts    # Straw-man thresholds
    ├── fixtures.ts          # Shared test data
    └── factories.ts         # Entity factory functions
```

### 6. Accessibility criteria are test cases too
PRD Section 9.2 defines testable accessibility criteria for specific screens. These are not suggestions — they are acceptance criteria with the same status as functional requirements.

```typescript
describe('Score Entry Accessibility (PRD 9.2)', () => {
  it('score controls are operable with VoiceOver', ...);
  it('team assignment uses text label not just color', ...);
  it('tap targets are at least 44x44 CSS pixels', ...);
  it('score state changes are announced to assistive technology', ...);
});
```

### 7. Coverage checklist before marking a feature complete
Before any feature slug is marked done, verify:

- [ ] Every Given/When/Then from PRD 8.16 for the relevant FR IDs has a corresponding test
- [ ] Every edge case from PRD 4.2 user stories has a corresponding test
- [ ] Every accessibility criterion from PRD 9.2 for the relevant screen has a test
- [ ] Straw-man thresholds are extracted as named constants, not hardcoded
- [ ] State machine transitions are tested per the state-machine skill (valid + invalid + terminal)
- [ ] Tests are named with FR- IDs for traceability
- [ ] Tests pass

### 8. When the PRD doesn't have explicit criteria
For P1 and P2 requirements that lack Given/When/Then criteria in Section 8.16, write your own following the same format. Add a comment noting they are derived, not from the PRD:

```typescript
// Derived acceptance criteria — not in PRD 8.16, written to match FR-56 requirement text
it('FR-56: historical stats are queryable per trip, per player, and across recurring trips', ...);
```

This keeps the test suite consistent even where the PRD is less detailed.
