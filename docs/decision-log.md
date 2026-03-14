# Decision Log — Golf Trip Coordination Platform

> **Created:** 2026-03-13
> **Purpose:** Consolidated registry of every open engineering, product, design, and ops question extracted from PRD v3 Section 17 and the three decomposition maps. Single source of truth for decision tracking.

---

## Resolution Priority

Questions ordered by urgency. M1-gate items must be resolved before M1 code starts.

### Tier 1 — M1-Gate (resolve before M1 code starts)

| DL # | Title | Owner | Eng-Unilateral | Status |
|------|-------|-------|----------------|--------|
| DL-1 | Auth approach | engineering | yes | decided |
| DL-2 | Budget settings structure | engineering | yes | decided |
| DL-3 | Status field naming standardization | engineering | yes | decided |
| DL-4 | User status states | engineering | yes | decided |
| DL-5 | TripOption status states | engineering | yes | decided |
| DL-6 | Round status states | engineering | yes | decided |
| DL-7 | Course status states | engineering | yes | decided |
| DL-8 | Reservation states | engineering | yes | decided |
| DL-9 | Bet state naming convention | engineering | yes | decided |
| DL-10 | Scorecard model (own scores vs. full group) | engineering | yes | decided |
| DL-11 | Soft delete scope | engineering | yes | decided |
| DL-12 | Geography vs geometry for spatial columns | engineering | yes | decided |
| DL-13 | Captain override trigger | product + design | no | open |
| DL-14 | Hard constraints and soft preferences structure | engineering | no | open |
| DL-15 | Bet participants modeling | engineering | no | open |
| DL-16 | Microsite selected_assets modeling | engineering | no | open |
| DL-17 | Party split storage | engineering | no | open |
| DL-18 | Course access network mapping | engineering | no | open |
| DL-19 | Teams on Round structure | engineering | no | open |
| DL-20 | PhotoAsset vetoed state | engineering | no | open |
| DL-21 | Trip to Microsite cardinality | engineering | no | open |
| DL-22 | Round to Course cardinality | engineering | no | open |
| DL-23 | BookingRequest to Course cardinality | engineering | no | open |
| DL-24 | Reservation to Round linkage | engineering | no | open |
| DL-25 | Cascade behavior on Trip archival | engineering | no | open |
| DL-26 | Audit trail approach | engineering | no | open |
| DL-27 | Multi-tenancy | engineering | no | open |
| DL-28 | ItineraryItem entity vs computed view | engineering | no | open |
| DL-29 | API versioning prefix | engineering | no | open |
| DL-30 | Pagination strategy | engineering | no | open |
| DL-31 | Admin API authentication | engineering | no | open |

### Tier 2 — M1-Blocking (resolve before M1 QA sign-off)

| DL # | Title | Owner | Status |
|------|-------|-------|--------|
| DL-32 | Private inventory aggressiveness | product + ops | open |
| DL-33 | Minimum course data threshold | product + ops | open |

### Tier 3 — M2-Blocking

| DL # | Title | Owner | Status |
|------|-------|-------|--------|
| DL-34 | Exact fee schedule | product + finance | open |
| DL-35 | Aggregator API availability (cart-hold) | engineering | open |
| DL-36 | Hold window duration variability | engineering | open |
| DL-37 | Bet fee timing | product + engineering | open |
| DL-38 | Captain-pays-upfront model | product + engineering | open |
| DL-39 | Assisted-booking status values | product + ops | open |
| DL-40 | Fee capture timing precision / cancellation policy handling | product + ops | open |
| DL-41 | Assisted-booking request timeout | product + ops | open |
| DL-42 | Score conflict resolution | engineering | open |
| DL-43 | Availability monitoring frequency | engineering | open |
| DL-44 | Auto-upgrade guardrails validation | product + engineering | open |
| DL-45 | Fee schedule versioning | engineering | open |

### Tier 4 — M3-Blocking

| DL # | Title | Owner | Status |
|------|-------|-------|--------|
| DL-46 | Real-time transport (WebSocket vs SSE) | engineering | open |
| DL-47 | File upload strategy | engineering | open |
| DL-48 | Microsite SSR approach | engineering | open |

### Tier 5 — M4-Blocking

| DL # | Title | Owner | Status |
|------|-------|-------|--------|
| DL-49 | Game template automation scope | product + design | open |
| DL-50 | Notification batching vs real-time | engineering | open |
| DL-51 | Swap suggestion generation timing | engineering | open |
| DL-52 | Photo consent timeout | product + engineering | open |
| DL-53 | Historical stats aggregation approach | engineering | open |

### Tier 6 — M5-Blocking

| DL # | Title | Owner | Status |
|------|-------|-------|--------|
| DL-54 | Direct travel booking scope | product + bizdev | open |

### Tier 7 — Non-Blocking / Infrastructure

| DL # | Title | Owner | Status |
|------|-------|-------|--------|
| DL-55 | Weather and nightlife notes | product | open |
| DL-56 | Drive-time isochrone pre-computation | engineering | open |
| DL-57 | Spatial index strategy | engineering | open |
| DL-58 | Notification delivery tracking entity | engineering | open |
| DL-59 | PostGIS query rate limiting | engineering | open |
| DL-60 | Event bus technology choice | engineering | open |
| DL-61 | External data source refresh frequency | ops + engineering | open |
| DL-62 | Trip archival timing | product + engineering | open |

---

## Decision Entries

---

### DL-1: Auth approach
- **Source:** Data Model Map Q27, API Surface Map Q2, API Surface Map Q10
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** Auth.js v5 with credentials provider + JWT sessions

---

### DL-2: Budget settings structure
- **Source:** Data Model Map Q1
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** JSONB `{per_round_min, per_round_max}`

---

### DL-3: Status field naming standardization
- **Source:** Data Model Map Q9
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** Standardize to `status` everywhere

---

### DL-4: User status states
- **Source:** Data Model Map Q11
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** `active | suspended | deactivated`

---

### DL-5: TripOption status states
- **Source:** Data Model Map Q12
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** `proposed | shortlisted | voting | finalized | eliminated`

---

### DL-6: Round status states
- **Source:** Data Model Map Q13
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** `scheduled | in_progress | completed | finalized | canceled`

---

### DL-7: Course status states
- **Source:** Data Model Map Q14
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** `draft | active | hidden | archived`

---

### DL-8: Reservation states
- **Source:** Data Model Map Q10
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** `pending | held | confirmed | canceled | played | no_show`

---

### DL-9: Bet state naming convention
- **Source:** Data Model Map Q9
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** Standardize to `status` (not `state`)

---

### DL-10: Scorecard model (own scores vs. full group)
- **Source:** Data Model Map Q3, Background Jobs Map Q6, API Surface Map Q9
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** Each golfer enters only their own scores; discrepancy detection compares cards

---

### DL-11: Soft delete scope
- **Source:** Data Model Map Q23, Data Model Map Q24
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** User, Course, PhotoAsset, Microsite; Trips are never deleted (only Archived)

---

### DL-12: Geography vs geometry for spatial columns
- **Source:** Data Model Map Q22
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** yes
- **PRD cross-ref:** —
- **Status:** decided
- **Decision:** geography(Point, 4326) for all spatial columns

---

### DL-13: Captain override trigger
- **Source:** PRD Section 17 Decision #5
- **Blocking:** M1
- **Owner:** product + design
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #5
- **Status:** open
- **Decision:**

---

### DL-14: Hard constraints and soft preferences structure
- **Source:** Data Model Map Q2
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-15: Bet participants modeling
- **Source:** Data Model Map Q4
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-16: Microsite selected_assets modeling
- **Source:** Data Model Map Q5
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-17: Party split storage
- **Source:** Data Model Map Q6
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-18: Course access network mapping
- **Source:** Data Model Map Q7
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-19: Teams on Round structure
- **Source:** Data Model Map Q8
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-20: PhotoAsset vetoed state
- **Source:** Data Model Map Q15
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-21: Trip to Microsite cardinality
- **Source:** Data Model Map Q16
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-22: Round to Course cardinality
- **Source:** Data Model Map Q17
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-23: BookingRequest to Course cardinality
- **Source:** Data Model Map Q18
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-24: Reservation to Round linkage
- **Source:** Data Model Map Q19
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-25: Cascade behavior on soft delete / archival
- **Source:** Data Model Map Q24
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-26: Audit trail approach
- **Source:** Data Model Map Q25
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-27: Multi-tenancy
- **Source:** Data Model Map Q26, API Surface Map Q13
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-28: ItineraryItem entity vs computed view
- **Source:** Data Model Map Q29
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-29: API versioning prefix
- **Source:** API Surface Map Q4
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-30: Pagination strategy
- **Source:** API Surface Map Q5
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-31: Admin API authentication
- **Source:** API Surface Map Q10
- **Blocking:** M1
- **Owner:** engineering
- **M1-gate:** yes
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-32: Private inventory aggressiveness in recommendations
- **Source:** PRD Section 17 Decision #4
- **Blocking:** M1 (QA sign-off)
- **Owner:** product + ops
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #4
- **Status:** open
- **Decision:**

---

### DL-33: Minimum course data threshold for recommendation eligibility
- **Source:** PRD Section 17 Decision #6
- **Blocking:** M1 (QA sign-off)
- **Owner:** product + ops
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #6
- **Status:** open
- **Decision:**

---

### DL-34: Exact fee schedule for bookings, bets, lodging, and air
- **Source:** PRD Section 17 Decision #1
- **Blocking:** M2
- **Owner:** product + finance
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #1
- **Status:** open
- **Decision:**

---

### DL-35: Aggregator API availability for concurrent cart holds
- **Source:** API Surface Map Q1
- **Blocking:** M2
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-36: Hold window duration variability across aggregators
- **Source:** Background Jobs Map Q2
- **Blocking:** M2
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-37: Bet fee timing (acceptance, round completion, or trip completion)
- **Source:** API Surface Map Q7
- **Blocking:** M2
- **Owner:** product + engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #1 (related)
- **Status:** open
- **Decision:**

---

### DL-38: Captain-pays-upfront billing model
- **Source:** API Surface Map Q8
- **Blocking:** M2
- **Owner:** product + engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-39: Assisted-booking customer-facing status values and fallback actions
- **Source:** API Surface Map Q12, PRD Section 17 Decision #7
- **Blocking:** M2
- **Owner:** product + ops
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #7
- **Status:** open
- **Decision:**

---

### DL-40: Fee capture timing precision / cancellation policy handling
- **Source:** Background Jobs Map Q5, Background Jobs Map Q13, API Surface Map Q12 (related)
- **Blocking:** M2
- **Owner:** product + ops
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-41: Assisted-booking request timeout and SLA
- **Source:** Background Jobs Map Q11
- **Blocking:** M2
- **Owner:** product + ops
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #7 (related)
- **Status:** open
- **Decision:**

---

### DL-42: Score conflict resolution for offline sync
- **Source:** API Surface Map Q9, Background Jobs Map Q6, Data Model Map Q3
- **Blocking:** M2
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-43: Availability monitoring frequency and schedule
- **Source:** Background Jobs Map Q1
- **Blocking:** M2
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-44: Auto-upgrade guardrails and trip-level budget ceiling
- **Source:** Background Jobs Map Q10
- **Blocking:** M2
- **Owner:** product + engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-45: Fee schedule versioning strategy
- **Source:** Data Model Map Q31
- **Blocking:** M2
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #1 (related)
- **Status:** open
- **Decision:**

---

### DL-46: Real-time transport (WebSocket vs SSE)
- **Source:** API Surface Map Q3
- **Blocking:** M3
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-47: File upload strategy (presigned URLs vs server proxy)
- **Source:** API Surface Map Q6
- **Blocking:** M3
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-48: Microsite SSR approach
- **Source:** API Surface Map Q14
- **Blocking:** M3
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-49: Game template automation scope at launch
- **Source:** PRD Section 17 Decision #2
- **Blocking:** M4
- **Owner:** product + design
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #2
- **Status:** open
- **Decision:**

---

### DL-50: Notification batching vs real-time during rounds
- **Source:** Background Jobs Map Q3
- **Blocking:** M4
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-51: Swap suggestion generation timing
- **Source:** Background Jobs Map Q4
- **Blocking:** M4
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-52: Photo consent timeout and auto-approve behavior
- **Source:** Background Jobs Map Q7
- **Blocking:** M4
- **Owner:** product + engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-53: Historical stats aggregation approach
- **Source:** Data Model Map Q30
- **Blocking:** M4
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-54: Direct travel booking scope
- **Source:** PRD Section 17 Decision #3
- **Blocking:** M5
- **Owner:** product + bizdev
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #3
- **Status:** open
- **Decision:**

---

### DL-55: Weather and nightlife notes in itinerary
- **Source:** PRD Section 17 Decision #8
- **Blocking:** none
- **Owner:** product
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** Section 17 Decision #8
- **Status:** open
- **Decision:**

---

### DL-56: Drive-time isochrone pre-computation
- **Source:** Data Model Map Q20
- **Blocking:** none
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-57: Spatial index strategy (compound vs GiST + B-tree intersection)
- **Source:** Data Model Map Q21
- **Blocking:** none
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-58: Notification delivery tracking entity
- **Source:** Data Model Map Q28
- **Blocking:** none
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-59: PostGIS query rate limiting vs external Maps API
- **Source:** API Surface Map Q11
- **Blocking:** none
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-60: Event bus technology choice
- **Source:** Background Jobs Map Q12
- **Blocking:** none
- **Owner:** engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-61: External data source refresh frequency
- **Source:** Background Jobs Map Q9
- **Blocking:** none
- **Owner:** ops + engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

### DL-62: Trip archival timing
- **Source:** Background Jobs Map Q8
- **Blocking:** none
- **Owner:** product + engineering
- **M1-gate:** no
- **Eng-unilateral:** no
- **PRD cross-ref:** —
- **Status:** open
- **Decision:**

---

## PRD Section 17 Cross-Reference

| PRD Decision # | PRD Title | DL Entry | Status |
|---|---|---|---|
| 1 | Exact fee schedule for bookings, bets, lodging, and air | DL-34 (primary), DL-37, DL-45 (related) | open |
| 2 | Game template automation scope at launch | DL-49 | open |
| 3 | Direct travel booking scope | DL-54 | open |
| 4 | Private inventory aggressiveness in recommendations | DL-32 | open |
| 5 | Captain override trigger | DL-13 | open |
| 6 | Minimum course data threshold | DL-33 | open |
| 7 | Assisted-booking status values and fallback actions | DL-39 (primary), DL-41 (related) | open |
| 8 | Weather and nightlife notes | DL-55 | open |

---

## Deduplication Log

The following questions appeared in multiple source files and were consolidated into single entries:

| Consolidated DL # | Merged Sources | Topic |
|---|---|---|
| DL-42 | API Surface Map Q9 + Background Jobs Map Q6 + Data Model Map Q3 | Score conflict resolution / offline sync |
| DL-27 | Data Model Map Q26 + API Surface Map Q13 | Multi-tenancy |
| DL-40 | Background Jobs Map Q5 + Background Jobs Map Q13 | Cancellation policy handling / fee capture timing |
| DL-1 | Data Model Map Q27 + API Surface Map Q2 + API Surface Map Q10 | Auth approach (decided) |
| DL-10 | Data Model Map Q3 + Background Jobs Map Q6 + API Surface Map Q9 | Scorecard model (decided) |

---

## Source Traceability

### Data Model Map (31 questions)

| DM Q# | DL # | Title |
|---|---|---|
| 1 | DL-2 | Budget settings structure |
| 2 | DL-14 | Hard constraints and soft preferences structure |
| 3 | DL-10, DL-42 | Scorecard model / score conflict resolution |
| 4 | DL-15 | Bet participants modeling |
| 5 | DL-16 | Microsite selected_assets modeling |
| 6 | DL-17 | Party split storage |
| 7 | DL-18 | Course access network mapping |
| 8 | DL-19 | Teams on Round structure |
| 9 | DL-3, DL-9 | Status naming / Bet state naming |
| 10 | DL-8 | Reservation states |
| 11 | DL-4 | User status states |
| 12 | DL-5 | TripOption status states |
| 13 | DL-6 | Round status states |
| 14 | DL-7 | Course status states |
| 15 | DL-20 | PhotoAsset vetoed state |
| 16 | DL-21 | Trip to Microsite cardinality |
| 17 | DL-22 | Round to Course cardinality |
| 18 | DL-23 | BookingRequest to Course cardinality |
| 19 | DL-24 | Reservation to Round linkage |
| 20 | DL-56 | Drive-time isochrone pre-computation |
| 21 | DL-57 | Spatial index strategy |
| 22 | DL-12 | Geography vs geometry |
| 23 | DL-11 | Soft delete scope |
| 24 | DL-25 | Cascade behavior |
| 25 | DL-26 | Audit trail approach |
| 26 | DL-27 | Multi-tenancy |
| 27 | DL-1 | Auth approach |
| 28 | DL-58 | Notification delivery tracking entity |
| 29 | DL-28 | ItineraryItem entity vs computed view |
| 30 | DL-53 | Historical stats aggregation |
| 31 | DL-45 | Fee schedule versioning |

### API Surface Map (14 questions)

| API Q# | DL # | Title |
|---|---|---|
| 1 | DL-35 | Aggregator API availability |
| 2 | DL-1 | Auth approach (merged) |
| 3 | DL-46 | Real-time transport |
| 4 | DL-29 | API versioning prefix |
| 5 | DL-30 | Pagination strategy |
| 6 | DL-47 | File upload strategy |
| 7 | DL-37 | Bet fee timing |
| 8 | DL-38 | Captain-pays-upfront model |
| 9 | DL-42 | Score conflict resolution (merged) |
| 10 | DL-31 | Admin API authentication |
| 11 | DL-59 | PostGIS query rate limiting |
| 12 | DL-39 | Assisted-booking status values |
| 13 | DL-27 | Multi-tenancy (merged) |
| 14 | DL-48 | Microsite SSR approach |

### Background Jobs Map (13 questions)

| BG Q# | DL # | Title |
|---|---|---|
| 1 | DL-43 | Availability monitoring frequency |
| 2 | DL-36 | Hold window duration variability |
| 3 | DL-50 | Notification batching vs real-time |
| 4 | DL-51 | Swap suggestion generation timing |
| 5 | DL-40 | Fee capture timing / cancellation policy (merged) |
| 6 | DL-42 | Score conflict resolution (merged) |
| 7 | DL-52 | Photo consent timeout |
| 8 | DL-62 | Trip archival timing |
| 9 | DL-61 | External data source refresh frequency |
| 10 | DL-44 | Auto-upgrade guardrails |
| 11 | DL-41 | Assisted-booking request timeout |
| 12 | DL-60 | Event bus technology choice |
| 13 | DL-40 | Cancellation deadline data quality (merged) |

---

## Summary Statistics

### Totals

| Metric | Count |
|---|---|
| **Total DL entries** | 62 |
| **Decided** | 12 |
| **Open** | 50 |
| **Deferred** | 0 |

### By Milestone

| Blocking Milestone | Total | Decided | Open |
|---|---|---|---|
| M1 (gate) | 31 | 12 | 19 |
| M1 (QA) | 2 | 0 | 2 |
| M2 | 12 | 0 | 12 |
| M3 | 3 | 0 | 3 |
| M4 | 5 | 0 | 5 |
| M5 | 1 | 0 | 1 |
| None | 7 | 0 | 7 |

### By Owner

| Owner | Total | Decided | Open |
|---|---|---|---|
| engineering | 36 | 12 | 24 |
| product + design | 2 | 0 | 2 |
| product + engineering | 5 | 0 | 5 |
| product + ops | 4 | 0 | 4 |
| product + finance | 1 | 0 | 1 |
| product + bizdev | 1 | 0 | 1 |
| product | 1 | 0 | 1 |
| ops + engineering | 1 | 0 | 1 |

### Source Questions Accounted For

| Source File | Questions | Accounted For |
|---|---|---|
| Data Model Map | 31 | 31 |
| API Surface Map | 14 | 14 |
| Background Jobs Map | 13 | 13 |
| PRD Section 17 | 8 | 8 |
| **Total raw questions** | **66** | **66** |
| **After deduplication** | — | **62 DL entries** |
