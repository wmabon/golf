# Data Model Decomposition: Golf Trip Coordination App

Comprehensive analysis of all entities, relationships, state machines, and spatial requirements derived from PRD v3 (Sections 8.1-8.16, Section 10, Section 11).

---

## Table of Contents

1. [Entity Catalog](#entity-catalog)
2. [Entity Relationship Overview](#entity-relationship-overview)
3. [Entities Implied by FRs but NOT in Section 10](#entities-implied-by-frs-but-not-in-section-10)
4. [Fields Implied by FRs but NOT in Section 10 Key Fields](#fields-implied-by-frs-but-not-in-section-10-key-fields)
5. [PostGIS Usage Map](#postgis-usage-map)
6. [Open Questions for Engineering](#open-questions-for-engineering)

---

## Entity Catalog

### 1. User

**Source:** Section 10.1

**Key Fields (Section 10):** id, name, email, phone, handicap, home_airport, status

**Fields Implied by FRs:**
- `preferred_home_location` (FR-2: "preferred home location" is listed as a profile field)
- `created_at`, `updated_at` (convention)
- `status_changed_at` (state-machine skill)
- `deleted_at` (soft-delete candidate for user-facing data)

**Relationships:**
- 1:N -> MembershipEntitlement (a user can have multiple club memberships)
- 1:N -> TripMember (a user can be a member of many trips)
- 1:N -> Vote (a user can cast many votes)
- 1:N -> CourseReview (a user can write many reviews)
- 1:N -> ScoreEntry (a user is a player in many score entries)
- 1:N -> Bet (a user can create many bets; also a participant in many bets)
- 1:N -> FeeCharge (a user can have many fee charges)
- 1:N -> PhotoAsset (a user can upload many photos)
- 1:N -> PhotoConsent (a user has consent records for many photos)

**State Machine:**
- Not explicitly defined in Section 10 recommended state models.
- Status field is listed but states are not enumerated.
- Implied states: `active`, `inactive`, `suspended`, `deleted` (standard user lifecycle).
- FR-5 mentions roles (collaborator, captain, member sponsor, admin, concierge ops) but these are NOT User.status -- roles are trip-scoped (TripMember.role) or system-level.

**FR References:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-9, FR-19, FR-51, FR-53, FR-57

**PostGIS/Spatial:** `home_airport` implies a geographic coordinate. If the system defaults trip searches to the user's home airport (FR-2 acceptance criteria), it needs the ability to resolve airport codes to coordinates. This may be handled by a lookup table (Airport entity or reference data) rather than storing coordinates directly on User.

**Notes/Gaps:**
- The PRD says phone is "optional but recommended" -- should be nullable.
- Handicap is "optional but recommended" -- should be nullable, with a prompt trigger when joining net-scoring rounds (FR-2 acceptance criteria, FR-51).
- FR-5 mentions an "admin" and "concierge ops" role at a system level. This is distinct from trip-scoped captain. Consider a separate `system_role` field or a SystemRole join table.

---

### 2. MembershipEntitlement

**Source:** Section 10.1

**Key Fields (Section 10):** user_id, club_name, network_name, access_type, verified_status, notes

**Fields Implied by FRs:**
- `id` (primary key, not listed but assumed)
- `willing_to_sponsor` (FR-3: flag indicating willingness to sponsor access for the group)
- `guest_limit` (FR-3 acceptance criteria: "2-guest limit" as a constraint; FR-3 says "Support free-text notes such as guest limits, call-first requirements, or blackout dates" -- this could live in `notes` but a structured field is more queryable)
- `blackout_dates` (FR-3: mentioned as part of guest-policy constraints)
- `call_first_required` (FR-3: mentioned as part of guest-policy constraints)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> User (each entitlement belongs to one user)
- Logical reference to Course access_type for matching (not a direct FK)

**State Machine:** No explicit state machine. `verified_status` acts as a simple state:
- Implied values: `unverified`, `pending_verification`, `verified`, `rejected` (FR-4 mentions admin verification workflow)

**FR References:** FR-3, FR-4, FR-13 (access filtering uses membership data), FR-77 (admin can verify/override)

**PostGIS/Spatial:** None directly.

**Notes/Gaps:**
- FR-3 acceptance criteria say the record includes "club name, network/reciprocal affiliation, access type, and a free-text notes field" -- aligns well with Section 10.
- `willing_to_sponsor` could be a User-level flag rather than per-entitlement, but the PRD says it's part of the profile alongside memberships (FR-3). Consider whether it's per-membership or per-user.
- The "reciprocal network" concept (e.g., Invited, Troon Prive) means `network_name` is important for matching against Course records that list which networks grant access.

---

### 3. Trip

**Source:** Section 10.1

**Key Fields (Section 10):** id, name, date_start, date_end, anchor_type, anchor_value, budget_settings, status

**Fields Implied by FRs:**
- `creator_id` (FK to User; FR-8: "trip creator can invite collaborators"; FR-8: "trip creator" can transfer captain role)
- `golfer_count` (FR-6: "number of golfers")
- `freeze_date` (FR-35: "trip's freeze date, defaulting to seven days before travel"; FR-38: captain swap policy)
- `swap_policy` (FR-38: "notify only, captain approval required, or auto-upgrade within guardrails")
- `decision_deadline` (FR-27: "a decision deadline I set has expired" -- this may be per-voting-round rather than per-trip, but it affects trip-level flows)
- `status_changed_at` (state-machine skill)
- `created_at`, `updated_at` (convention)
- `deleted_at` (soft-delete candidate)

**Relationships:**
- N:1 -> User as creator (creator_id FK)
- 1:N -> TripMember
- 1:N -> TripOption
- 1:N -> BookingRequest
- 1:N -> Round
- 1:N -> Bet (trip_id FK on Bet)
- 1:N -> FeeCharge (trip_id FK on FeeCharge)
- 1:N -> PhotoAsset (trip_id FK on PhotoAsset)
- 1:1 -> Microsite (trip_id FK on Microsite; one microsite per trip)
- 1:N -> ReservationSwap (trip_id FK)
- 1:N -> ActivityFeedEntry (implied entity -- see "Implied Entities" section)

**State Machine (Section 10):**
```
Draft -> Planning -> Voting -> Booking -> Locked -> In Progress -> Completed -> Archived
```
- FR-10 lists these exact states.
- Transitions must be logged and visible in activity feed (FR-10).
- FR-63: Completed -> Archived transition. Archived trips are read-only except admin corrections.

**FR References:** FR-6, FR-7, FR-8, FR-9, FR-10, FR-23, FR-27, FR-30, FR-35, FR-37, FR-38, FR-39, FR-47, FR-63, FR-64, FR-74

**PostGIS/Spatial:**
- `anchor_type` + `anchor_value` define the geographic center of the trip.
- `anchor_type` can be: airport_code, city_region, map_area (FR-11).
- `anchor_value` should resolve to coordinates for spatial queries. Consider storing resolved coordinates as a geography/geometry point alongside the raw anchor value.

**Notes/Gaps:**
- `budget_settings` is vague. FR-6 says "trip budget preferences" and FR-9 says members can set "max budget." This likely needs to be a JSON/JSONB field or a normalized structure. It might contain: `per_round_budget_min`, `per_round_budget_max`, `total_trip_budget`, or similar.
- FR-64 mentions "recurring trip series" (P1). This implies a `TripSeries` entity or a `series_id` FK on Trip. Not in Section 10.
- `anchor_type` and `anchor_value` may need a resolved geography column (e.g., `anchor_point geography(Point, 4326)`) for PostGIS queries.

---

### 4. TripMember

**Source:** Section 10.1

**Key Fields (Section 10):** trip_id, user_id, role, response_status, hard_constraints, soft_preferences

**Fields Implied by FRs:**
- `id` (primary key)
- `invited_by` (FK to User; FR-7: creator sends invites)
- `invited_at` (FR-7: invite timestamp)
- `responded_at` (timestamp when response_status changed)
- `invite_method` (FR-7: email, share_link, sms)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Trip
- N:1 -> User
- Composite unique constraint on (trip_id, user_id)

**State Machine:**
- `response_status`: `pending`, `accepted`, `declined` (FR-7 acceptance criteria)
- `role`: `collaborator`, `captain` (FR-5, FR-8; trip-scoped roles)
  - Note: "member sponsor" is not a separate role value -- it is derived from the user having MembershipEntitlement records with willing_to_sponsor=true. However, FR-5 lists "member sponsor" as a role, so it could be a role value.
  - "admin" and "concierge ops" are system-level roles, not trip-scoped.

**FR References:** FR-5, FR-7, FR-8, FR-9, FR-10, FR-24, FR-27

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `hard_constraints` and `soft_preferences` are complex structured data (FR-9: "max budget, acceptable travel window, preferred airport, and willingness to play member-sponsored private rounds"). These need to be JSONB or a separate normalized table. JSONB is likely more pragmatic.
- FR-26: "The system should compress decisions by eliminating options that violate hard trip constraints set by multiple members." This means the shortlist engine needs to query hard_constraints efficiently.
- The captain transfer (FR-8) changes the `role` column on TripMember rows. The transfer must be logged (activity feed).

---

### 5. TripOption

**Source:** Section 10.1

**Key Fields (Section 10):** trip_id, type, title, estimated_cost, fit_score, status

**Fields Implied by FRs:**
- `id` (primary key)
- `courses` (FR-23: a shortlist option can contain multiple courses as an "itinerary candidate or course combination"; this implies a join table TripOptionCourse or a JSONB field)
- `reasons_to_play` / `rationale` (FR-23 acceptance criteria: "brief rationale for why it fits the trip")
- `vote_deadline` (FR-27: "a decision deadline I set has expired")
- `finalized_by` (FK to User; FR-27: who finalized it -- captain or consensus)
- `finalized_at` (timestamp)
- `override_used` (boolean; FR-27: log whether captain override was used)
- `status_changed_at` (state-machine skill)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Trip
- 1:N -> Vote (votes are cast on trip options)
- M:N -> Course (a trip option can reference multiple courses; see TripOptionCourse below)

**State Machine:**
- Not explicitly listed in Section 10 recommended state models.
- Implied states: `proposed`, `active`, `eliminated`, `finalized`, `rejected`
  - FR-24: "Options with majority Out should sink quickly in ranking" suggests `eliminated` or a ranking mechanism.
  - FR-27: Captain can "finalize" an option.

**FR References:** FR-23, FR-24, FR-25, FR-26, FR-27, FR-28

**PostGIS/Spatial:** None directly, but options reference courses which have locations.

**Notes/Gaps:**
- `type` field: FR-28 distinguishes "destination-level voting" from "course-level voting." The `type` could be `destination` or `course_mix`.
- `estimated_cost` is per-golfer or total? FR-25 says "estimated cost-per-golfer" -- so this should be per-golfer.
- The relationship between TripOption and Course is many-to-many. A TripOption representing a 3-day itinerary might include 3 courses. This needs a join table.

---

### 6. Vote

**Source:** Section 10.1

**Key Fields (Section 10):** trip_option_id, user_id, vote_value, comment, timestamp

**Fields Implied by FRs:**
- `id` (primary key)
- `budget_objection` (FR-24: "can attach a budget objection or comment" -- could be a boolean flag or part of comment)
- `previous_vote_value` (FR-24 acceptance criteria: "when they change their vote, then the new vote replaces the old one and the change is logged" -- audit may be handled by activity feed rather than stored on the vote)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> TripOption
- N:1 -> User
- Composite unique constraint on (trip_option_id, user_id) -- one vote per user per option

**State Machine:** None. `vote_value` is an enum: `in`, `fine`, `out` (FR-24).

**FR References:** FR-24, FR-27

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- Vote changes (FR-24) should be logged but Section 10 stores only current vote. The activity feed covers the audit trail.
- `timestamp` in Section 10 is the same as `created_at` / `updated_at` -- may just use `updated_at`.

---

### 7. Course

**Source:** Section 10.2

**Key Fields (Section 10):** id, name, location, access_type, access_confidence, amenities, price_band

**Fields Implied by FRs:**
- `latitude` / `longitude` or `geog geography(Point, 4326)` (FR-11, FR-12: spatial search is core)
- `city`, `state`, `region` (for text-based search, FR-11)
- `address` (FR-48: itinerary shows addresses)
- `phone` / `contact_info` (FR-48: contact notes)
- `photos` (FR-14: course cards show imagery -- may be a separate table or URLs)
- `reasons_to_play` (FR-14: "short reasons-to-play summary")
- `airport_code_nearest` (FR-40: "last-day airport proximity as a tie-breaker")
- `resort_guest_fees` (FR-12 detail: "any known resort or guest fees")
- `website_url` (FR-44: link-out for external booking)
- `booking_channel` (FR-29: "known booking channel information" -- may live on CourseRule instead)
- `is_recommendation_eligible` (derived from minimum data threshold, Open Decision #6)
- `status` (for admin curation workflow: FR-75, FR-16)
- `status_changed_at` (state-machine skill if status is a state machine)
- `created_at`, `updated_at` (convention)
- `deleted_at` (soft-delete for corrections)

**Relationships:**
- 1:1 -> CourseRule (or 1:N if rules change over time and history is kept)
- 1:N -> CourseReview
- 1:1 -> CourseComposite (or embedded)
- 1:N -> BookingRequest (a course can be targeted by many booking requests)
- 1:N -> Round (rounds are played at a course)
- M:N -> TripOption (via TripOptionCourse join)

**State Machine:**
- Not explicitly listed but implied by admin curation workflow.
- Possible states: `draft`, `pending_review`, `active`, `hidden`, `archived`
- FR-16: Users can flag a course as misclassified, creating an admin review task.
- FR-13: Unknown access types default to hidden.

**FR References:** FR-11, FR-12, FR-13, FR-14, FR-16, FR-17, FR-18, FR-19, FR-20, FR-29, FR-40, FR-75

**PostGIS/Spatial:** **PRIMARY SPATIAL ENTITY**
- Must have a geography/geometry column for location.
- Spatial index required for:
  - Airport-code radius search (FR-12: "radius from anchor")
  - Drive-time polygon search (FR-12: "drive time from anchor")
  - Map-based area selection (FR-11: "map-based area selection")
  - Trip anchor proximity ranking
  - Last-day airport proximity (FR-40)
- `access_type` values: `public`, `resort_open_to_public`, `semi_private_with_public_times`, `private_member_only`, `unknown` (FR-13, Section 8.1 access rules)
- `access_confidence` implies a confidence level for the access classification.

**Notes/Gaps:**
- `location` in Section 10 is vague. This MUST be a PostGIS geography column, not just a text string.
- `amenities` is unstructured. JSONB is appropriate.
- `price_band` needs enumeration. From FR-12: likely something like `$`, `$$`, `$$$`, `$$$$` or dollar ranges.
- FR-19 review dimensions (conditioning, layout, value, pace, service, trip vibe) are on CourseReview, not Course directly.
- The course needs to track which reciprocal networks grant access (e.g., "Invited members can play here"). This might be a separate CourseAccessNetwork join table or part of `access_type` metadata.

---

### 8. CourseRule

**Source:** Section 10.2

**Key Fields (Section 10):** course_id, booking_window_rule, cancellation_rule, max_players, source, updated_at

**Fields Implied by FRs:**
- `id` (primary key)
- `booking_channel` (FR-29: "known booking channel information")
- `booking_window_days` (structured version of booking_window_rule for computation, e.g., "bookable 14 days in advance")
- `cancellation_deadline_hours` (structured version of cancellation_rule for computation)
- `cancellation_penalty` (FR-37: "cancellation deadlines, penalties")
- `public_times_available` (boolean; Section 8.3 detail: "Whether public times are available and under what rules")
- `public_times_rules` (text/JSONB; Section 8.3 detail)
- `notes` (FR-29 acceptance criteria: ops can add notes)
- `created_at` (convention)

**Relationships:**
- N:1 -> Course (many rules if versioned; 1:1 if current only)

**State Machine:** None.

**FR References:** FR-29, FR-30, FR-31, FR-37, FR-75

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `source` indicates where the rule data came from (e.g., "ops_manual", "api_sync", "user_report").
- The PRD mentions max_players per tee time specifically (FR-31). This is critical for party-split logic.
- FR-29 acceptance criteria: "Unknown rules must be markable and updatable by ops." Consider a `rules_confirmed` boolean or similar.
- Booking window rules can be complex (e.g., "bookable 14 days in advance for non-members, 30 days for resort guests"). A structured JSONB field plus human-readable text may be needed.

---

### 9. CourseReview

**Source:** Section 10.2

**Key Fields (Section 10):** course_id, user_id, dimensions, text, overall_user_score

**Fields Implied by FRs:**
- `id` (primary key)
- `round_id` (FR-19 acceptance criteria: "a user who has completed a round" -- implies review is linked to a round)
- `conditioning_score` (FR-19: structured dimension)
- `layout_score` (FR-19: structured dimension)
- `value_score` (FR-19: structured dimension)
- `pace_score` (FR-19: structured dimension)
- `service_score` (FR-19: structured dimension)
- `vibe_score` (FR-19: "trip vibe/clubhouse" dimension)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Course
- N:1 -> User
- N:1 -> Round (optional; review may be tied to a specific round)

**State Machine:** None.

**FR References:** FR-17, FR-18, FR-19

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `dimensions` in Section 10 is a JSONB or could be normalized into individual columns. Given that FR-19 specifies exactly six dimensions, individual columns are reasonable and more queryable for aggregation.
- `overall_user_score` is the community golfer score (FR-17). It could be a computed average of the six dimensions or a separate rating.
- FR-17 explicitly says this score "is never blended into the composite non-community score." This is a display rule, not a schema rule, but worth noting.

---

### 10. CourseComposite

**Source:** Section 10.2

**Key Fields (Section 10):** course_id, editorial_score, external_rank_score, value_score, trip_fit_inputs

**Fields Implied by FRs:**
- `id` (primary key)
- `community_average_score` (FR-17: computed from CourseReview records, may be cached here or computed on the fly)
- `review_count` (for display: "based on N reviews")
- `overpriced_flag` (FR-21: "label overpriced disappointments")
- `value_label` (FR-21: "Premium price, mixed value signal")
- `created_at`, `updated_at` (convention)

**Relationships:**
- 1:1 -> Course (each course has one composite record)

**State Machine:** None.

**FR References:** FR-17, FR-18, FR-20, FR-21, FR-22, FR-75

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `trip_fit_inputs` is described in FR-20: "access eligibility, budget fit, travel convenience, likely availability, and course-quality model." This is a JSONB field with parameters used by the recommendation engine.
- `editorial_score` and `external_rank_score` are maintainable by admin tooling (FR-22).
- The composite model is "product-owned" (FR-18) and distinct from community score. The schema should enforce this separation.
- This entity might be better as a materialized view or cache table that gets recomputed, rather than a manually maintained record, since it aggregates multiple signals.

---

### 11. BookingRequest

**Source:** Section 10.2

**Key Fields (Section 10):** trip_id, course_id, target_date, target_time_range, party_split, mode, status

**Fields Implied by FRs:**
- `id` (primary key)
- `created_by` (FK to User; who initiated the request)
- `assigned_to` (FK to User; FR-76: concierge can assign booking requests)
- `booking_window_opens_at` (FR-30: when the booking window opens)
- `alert_subscriber_ids` (FR-30: "subscribe to alerts" -- may be a separate table)
- `fallback_plan` (FR-32: "fallback plans")
- `notes` (FR-76: concierge notes)
- `escalation_state` (FR-76 acceptance criteria: unassigned for 4+ hours triggers escalation)
- `status_changed_at` (state-machine skill)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Trip
- N:1 -> Course
- 1:N -> Reservation (a booking request can result in multiple reservations for split parties)
- N:1 -> User as creator
- N:1 -> User as assignee (concierge)

**State Machine (Section 10):**
```
Candidate -> Window Pending -> Requested -> Partial Hold -> Booked -> Swappable -> Locked -> Played / Canceled
```
This is the most complex state machine. Notes:
- `Candidate`: Initial state when a course is targeted.
- `Window Pending`: Waiting for booking window to open.
- `Requested`: Booking attempt initiated (direct or assisted).
- `Partial Hold`: Some but not all tee-time slots secured (FR-32).
- `Booked`: All slots confirmed.
- `Swappable`: Past booking but within optimization window (before freeze date).
- `Locked`: Past freeze date, no more changes.
- `Played`: Round completed.
- `Canceled`: Booking was canceled.

**FR References:** FR-29, FR-30, FR-31, FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-39, FR-44, FR-76

**PostGIS/Spatial:** None directly.

**Notes/Gaps:**
- `mode` values: `direct`, `guided_checkout`, `assisted_booking` (FR-33).
- `party_split` is a structured field describing how the group is divided. JSONB containing arrays of player groups with target times, e.g., `[{"players": ["id1","id2","id3"], "target_time": "08:00"}, {"players": ["id4","id5"], "target_time": "08:12"}]`.
- `target_time_range` is a range (e.g., "7:30-9:00 AM"), not a single time.
- The escalation logic (unassigned > 4 hours with open window) is a background job concern, not a schema concern, but `assigned_to` and `status` must support it.
- FR-44 mentions "external booking capture" for non-integrated paths. This may create BookingRequest records with mode=`external` and a lightweight capture form attached.

---

### 12. Reservation

**Source:** Section 10.2

**Key Fields (Section 10):** booking_request_id, supplier_confirmation, tee_time, players, status, fee_state

**Fields Implied by FRs:**
- `id` (primary key)
- `course_id` (denormalized from BookingRequest for easier querying)
- `trip_id` (denormalized from BookingRequest)
- `confirmation_number` (FR-48, FR-76: separate from supplier_confirmation? Or synonym?)
- `player_names` (FR-76: "player names" attached to confirmation)
- `cancellation_deadline` (FR-37: needed for swap evaluation; derived from CourseRule but stored per-reservation for immutability)
- `cancellation_penalty_amount` (FR-37)
- `cost_per_player` (FR-25, FR-37: for cost delta calculations)
- `total_cost` (for fee calculations)
- `booking_source` (FR-33: direct, guided, assisted, external)
- `external_booking_url` (FR-44: link-out source)
- `external_booking_contact` (FR-44: booking contact for external)
- `notes` (FR-44: lightweight capture notes)
- `status_changed_at` (state-machine skill)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> BookingRequest
- 1:N -> ReservationSwap as old_reservation
- 1:N -> ReservationSwap as new_reservation
- 1:N -> FeeCharge (via source_object_id on FeeCharge)

**State Machine:**
- Not separately listed in Section 10 recommended state models. The BookingRequest state machine covers the lifecycle.
- However, `status` is listed as a key field. Implied states: `pending`, `held`, `confirmed`, `canceled`, `played`, `no_show`
- `fee_state` is separate: `pending`, `charged`, `refunded`, `waived`

**FR References:** FR-32, FR-33, FR-34, FR-36, FR-39, FR-44, FR-48, FR-68, FR-76

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `players` is a list of user IDs or names assigned to this specific tee time slot. JSONB array or a join table.
- `supplier_confirmation` vs `confirmation_number`: likely the same concept. Use `confirmation_number`.
- The relationship between BookingRequest and Reservation is 1:N because a split party (e.g., 4+2) produces multiple reservations from one booking request.
- FR-44 external booking capture (source, confirmation number, date, time, cost, booking contact, notes) may be stored on the Reservation directly.

---

### 13. ReservationSwap

**Source:** Section 10.2

**Key Fields (Section 10):** trip_id, old_reservation_id, new_reservation_id, recommendation_reason, approval_state

**Fields Implied by FRs:**
- `id` (primary key)
- `suggested_at` (timestamp; FR-39: rebooking timeline)
- `decided_at` (timestamp when captain approved/declined)
- `decided_by` (FK to User; captain)
- `decline_reason` (FR-37/8.7.1: "records the decline reason if provided")
- `cost_delta_per_golfer` (FR-37: displayed in swap suggestion)
- `quality_delta` (FR-37: "quality-model delta")
- `drive_time_delta` (FR-37: "drive time" change)
- `cancellation_penalty` (FR-37: displayed in swap suggestion)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Trip
- N:1 -> Reservation (old_reservation_id)
- N:1 -> Reservation (new_reservation_id; may be null if suggestion is pending/declined)
- N:1 -> User (decided_by)

**State Machine:**
- `approval_state` values: `suggested`, `approved`, `declined`, `auto_approved`, `expired`
- Section 8.7.1 swap constraints define behavioral rules around this state.

**FR References:** FR-35, FR-36, FR-37, FR-38, FR-39

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- Section 8.7.1 constrains: max 2 swap suggestions per booked round per trip. This is a business rule enforced at the application layer, not the schema, but the schema must support counting swaps per booking request.
- `new_reservation_id` might be null at suggestion time (before a replacement is confirmed). FR-36 says "only cancel after replacement is confirmed," so the new reservation must be created before the swap is approved.
- The PRD calls for "before/after state" in the rebooking timeline (FR-39). Storing deltas on the swap record supports this.

---

### 14. Round

**Source:** Section 10.3

**Key Fields (Section 10):** trip_id, course_id, date, format, teams, status

**Fields Implied by FRs:**
- `id` (primary key)
- `reservation_id` (FK; a round is typically associated with a reservation)
- `game_template` (FR-52: stroke play, team best ball, skins, Nassau; may be the same as `format`)
- `game_description` (FR-52: "free-text game description" for custom formats)
- `finalized_at` (when scores are locked)
- `status_changed_at` (state-machine skill)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Trip
- N:1 -> Course
- N:1 -> Reservation (optional)
- 1:N -> ScoreEntry
- 1:N -> Bet (bets can be round-scoped)
- 1:N -> CourseReview (reviews are tied to rounds)

**State Machine:**
- Not explicitly listed in Section 10 recommended state models.
- Implied states: `scheduled`, `in_progress`, `completed`, `finalized`, `archived`
- FR-51: Players can edit scores before the round is "finalized or archived."

**FR References:** FR-51, FR-52, FR-53, FR-54, FR-56

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `teams` is structured data (JSONB). FR-51 says "assign players to teams." Format: `[{"name": "Team A", "players": ["id1","id2"]}, ...]`
- `format` vs `game_template`: these may be the same field. FR-52 lists supported formats: stroke_play, team_best_ball, skins, nassau.
- Multiple game formats can potentially be active in one round (e.g., stroke play AND skins simultaneously). This might require a RoundGame join entity or JSONB array.

---

### 15. ScoreEntry

**Source:** Section 10.3

**Key Fields (Section 10):** round_id, player_id, hole_number, strokes, net_strokes, updated_at, discrepancy_state

**Fields Implied by FRs:**
- `id` (primary key)
- `card_owner_id` (FR-51: "each golfer owns an editable official card" -- the card owner may differ from the player being scored; one golfer's card records scores for all players in the group. The `player_id` is who the score is for; we may need a `card_owner_id` or `entered_by` field to track whose card this entry came from)
- `entered_by` (FK to User; who actually entered this score)
- `synced_at` (FR-51 acceptance criteria: offline/online sync)
- `created_at` (convention)

**Relationships:**
- N:1 -> Round
- N:1 -> User (player_id)
- N:1 -> User (entered_by / card_owner_id)
- Composite key or unique constraint on (round_id, player_id, hole_number, entered_by) to support multiple cards

**State Machine:**
- `discrepancy_state`: `clean`, `flagged`, `resolved` (FR-51: "flag discrepancies across cards")

**FR References:** FR-51, FR-52, FR-54, FR-56

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- The "official card" concept is crucial. Each golfer has their own card where they record scores for everyone in their group. When two cards disagree on a player's score for a hole, that is a discrepancy. The schema must support multiple score entries per (round, player, hole) -- one from each card owner.
- This means the unique constraint is on (round_id, player_id, hole_number, entered_by), NOT (round_id, player_id, hole_number).
- `net_strokes` depends on handicap. If handicap changes, net_strokes may need recalculation.
- Offline sync (FR-51) is an application-layer concern. The schema just needs `updated_at` and possibly a `client_timestamp` for conflict resolution.

---

### 16. Bet

**Source:** Section 10.3

**Key Fields (Section 10):** trip_id, round_id, creator_id, type, amount, participants, state

**Fields Implied by FRs:**
- `id` (primary key)
- `name` / `description` (FR-55: "custom freeform side-bet names and lightweight notes")
- `trigger_condition` (FR-53: "trigger condition" -- what triggers resolution)
- `resolution` (outcome/result once resolved)
- `winner_ids` (who won)
- `is_pride_bet` (derived from amount == 0; FR-69: zero-dollar pride bets are always free)
- `fee_eligible` (derived: only accepted money bets with amount > 0)
- `notes` (FR-55: "lightweight notes to capture 'stupid bets'")
- `accepted_at` (when all participants accepted)
- `resolved_at` (when bet outcome was determined)
- `voided_at` (if voided)
- `status_changed_at` (state-machine skill -- note: Section 10 uses `state` not `status`; standardize to `status`)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Trip
- N:1 -> Round (optional; some bets may be trip-level, not round-level)
- N:1 -> User (creator_id)
- M:N -> User (participants; needs a BetParticipant join table or JSONB array)
- 1:N -> FeeCharge (via source_object_id on FeeCharge)

**State Machine:**
- Not explicitly listed in Section 10 recommended state models but PRD says `state` is a key field.
- Implied states from FRs: `proposed`, `accepted`, `active`, `resolved`, `settled`, `voided`, `expired`, `rejected`
  - FR-53: "proposed" initially, "accepted" when all participants accept
  - FR-69: "Proposed, rejected, expired, or voided bets do not incur fees"
  - FR-54: settlement summary implies a `settled` state
  - `rejected` when a participant declines

**FR References:** FR-53, FR-54, FR-55, FR-56, FR-69

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- Section 10 uses `state` while the schema convention says `status`. Standardize to `status`.
- `participants` is listed as a key field but is a list. Needs either JSONB or a BetParticipant join table. A join table is better for querying "all bets a user participates in" and for tracking per-participant acceptance state.
- `type` values: not fully enumerated. FR-52 mentions stroke play, best ball, skins, Nassau -- but those are game formats, not bet types. Bet types might be: `side_bet`, `match_bet`, `skins_bet`, `nassau_bet`, `custom`.
- The settlement flow (FR-54) needs tracking of who owes whom per bet. This is computed, not stored, unless we want a BetSettlement entity.

---

### 17. FeeCharge

**Source:** Section 10.3

**Key Fields (Section 10):** trip_id, user_id, fee_type, source_object_id, amount, status

**Fields Implied by FRs:**
- `id` (primary key)
- `source_object_type` (polymorphic: the type of object that generated this fee -- reservation, bet, lodging_booking, air_booking)
- `fee_schedule_id` (FK to the fee schedule configuration; FR-67: admin-configurable)
- `percentage_rate` (if percentage-based; FR-67)
- `flat_amount` (if flat-fee; FR-67)
- `cap_applied` (boolean; FR-67: "optional per-golfer caps for bet fees")
- `refund_amount` (FR-68: "Refund or reversal behavior must be explicit")
- `refunded_at` (timestamp)
- `charged_at` (when fee was actually charged)
- `invoice_id` / `payment_reference` (link to payment processor)
- `status_changed_at` (state-machine skill)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> Trip
- N:1 -> User
- Polymorphic -> Reservation, Bet, or other source object (via source_object_id + source_object_type)

**State Machine:**
- Not explicitly listed in Section 10 recommended state models.
- Implied states: `pending`, `charged`, `refunded`, `waived`, `disputed`
  - FR-68: Fees charged only on committed bookings, refund/reversal behavior.
  - FR-71: Auditable by trip, user, booking, and bet.

**FR References:** FR-34, FR-67, FR-68, FR-69, FR-70, FR-71

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `fee_type` values: `tee_time_service`, `bet_fee`, `lodging_service`, `air_service`, `pass_through_cost`, `cancellation_penalty` (FR-67, FR-70).
- `source_object_id` is polymorphic. Consider using a `source_object_type` discriminator column.
- FR-70: External pass-through costs must be displayed separately from platform service fees. The `fee_type` distinction handles this.
- FR-67 acceptance criteria: fee config changes apply only to future transactions. Fee schedule versioning or snapshotting the rate at charge time is important.

---

### 18. PhotoAsset

**Source:** Section 10.3

**Key Fields (Section 10):** trip_id, uploader_id, storage_url, metadata, publish_state

**Fields Implied by FRs:**
- `id` (primary key)
- `tagged_user_ids` (FR-59: manual participant tagging -- join table PhotoTag or JSONB)
- `nominated_for_recap` (boolean; FR-58: "photo nominated for public recap inclusion")
- `nominated_by` (FK to User)
- `nominated_at` (timestamp)
- `veto_count` (computed or cached)
- `publish_state_changed_at` (state-machine skill: `status_changed_at`)
- `original_filename` (metadata)
- `content_type` (metadata)
- `file_size` (metadata)
- `width`, `height` (metadata)
- `taken_at` (EXIF data extraction)
- `created_at`, `updated_at` (convention)
- `deleted_at` (soft-delete; FR-61: post-publish takedown, FR-78: content moderation)

**Relationships:**
- N:1 -> Trip
- N:1 -> User (uploader_id)
- 1:N -> PhotoConsent
- M:N -> User (tagged users; via PhotoTag join or PhotoConsent records)
- N:1 -> Microsite (via selected_assets on Microsite, or a join table)

**State Machine (Section 10):**
```
Private -> Review Pending -> Publish Eligible -> Published -> Withdrawn
```
- `Private`: Default state on upload (FR-57).
- `Review Pending`: Photo nominated for recap; awaiting consent/veto from tagged/all members.
- `Publish Eligible`: All required consents obtained, no vetoes.
- `Published`: Included in published microsite.
- `Withdrawn`: Removed post-publication (FR-61).

**FR References:** FR-57, FR-58, FR-59, FR-60, FR-61, FR-62, FR-78

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `metadata` is vague. Should be JSONB containing EXIF data, dimensions, etc.
- FR-58 acceptance criteria: "A veto immediately makes the asset ineligible for public publication and cannot be re-nominated without the vetoing member's reversal." This means the state machine needs a `vetoed` state or the veto is tracked on PhotoConsent and prevents the transition to `Publish Eligible`.
- FR-58: "Given a photo with no tagged members, when it is nominated for publication, then all trip members are given the opportunity to veto." This implies consent records are created for ALL trip members if no one is tagged.
- FR-62: "Photo and microsite permissions must be auditable." This is an audit trail requirement.

---

### 19. PhotoConsent

**Source:** Section 10.3

**Key Fields (Section 10):** photo_asset_id, user_id, consent_state, timestamp

**Fields Implied by FRs:**
- `id` (primary key)
- `requested_at` (when consent was requested)
- `responded_at` (when consent was given/denied)
- `reversal_reason` (FR-58: vetoing member can reverse their veto to allow re-nomination)
- `created_at`, `updated_at` (convention)

**Relationships:**
- N:1 -> PhotoAsset
- N:1 -> User

**State Machine:**
- `consent_state` values: `pending`, `approved`, `vetoed`, `reversed` (FR-58, FR-61)

**FR References:** FR-58, FR-61, FR-62

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- Composite unique on (photo_asset_id, user_id).
- FR-62 requires auditability. Consider an audit log or history table for consent state changes.

---

### 20. Microsite

**Source:** Section 10.3

**Key Fields (Section 10):** trip_id, slug, publish_state, visibility_mode, selected_assets, public_payload

**Fields Implied by FRs:**
- `id` (primary key)
- `cover_image_id` (FK to PhotoAsset; FR-60: social preview with cover image)
- `title` (for Open Graph tags; defaults to trip name)
- `og_description` (Open Graph description)
- `og_image_url` (Open Graph image URL)
- `published_at` (timestamp)
- `published_by` (FK to User; FR-60: captain publishes)
- `unpublished_at` (FR-78: content moderation can unpublish)
- `scores_summary` (FR-60: "scores, winners")
- `itinerary_highlights` (FR-60: "itinerary highlights")
- `winners` (FR-60: "winners")
- `status_changed_at` (state-machine skill)
- `created_at`, `updated_at` (convention)

**Relationships:**
- 1:1 -> Trip (one microsite per trip)
- N:1 -> User (published_by)
- M:N -> PhotoAsset (selected_assets; needs a join table MicrositeAsset or JSONB array of IDs)
- N:1 -> PhotoAsset (cover_image_id)

**State Machine:**
- `publish_state` values: `draft`, `preview`, `published`, `unpublished`
  - Not explicitly listed in Section 10 recommended state models but publish_state is a key field.
  - FR-60: "unlisted and marked noindex by default unless the captain explicitly enables public promotion."
- `visibility_mode` values: `unlisted_noindex`, `unlisted`, `public` (FR-60)
  - `unlisted_noindex`: default -- accessible by URL but not indexed by search engines.
  - `unlisted`: accessible by URL, may be indexed.
  - `public`: promoted on app's public discovery surfaces.

**FR References:** FR-60, FR-61, FR-62, FR-78

**PostGIS/Spatial:** None.

**Notes/Gaps:**
- `selected_assets` and `public_payload` are JSONB fields. `public_payload` likely contains the rendered/cached microsite content.
- Consider whether `selected_assets` should be a join table (MicrositeAsset) with ordering for better integrity and queryability.
- `slug` must be unique and URL-safe.

---

## Entity Relationship Overview

```
User
 |-- 1:N --> MembershipEntitlement
 |-- 1:N --> TripMember --> N:1 Trip
 |-- 1:N --> Vote --> N:1 TripOption --> N:1 Trip
 |-- 1:N --> CourseReview --> N:1 Course
 |-- 1:N --> ScoreEntry --> N:1 Round
 |-- 1:N --> Bet (as creator)
 |-- M:N --> Bet (as participant, via BetParticipant)
 |-- 1:N --> FeeCharge
 |-- 1:N --> PhotoAsset (as uploader)
 |-- 1:N --> PhotoConsent

Trip
 |-- 1:N --> TripMember
 |-- 1:N --> TripOption
 |       |-- M:N --> Course (via TripOptionCourse)
 |       |-- 1:N --> Vote
 |-- 1:N --> BookingRequest --> N:1 Course
 |       |-- 1:N --> Reservation
 |              |-- 1:N --> ReservationSwap (as old or new)
 |-- 1:N --> Round --> N:1 Course
 |       |-- 1:N --> ScoreEntry
 |       |-- 1:N --> Bet
 |-- 1:N --> FeeCharge
 |-- 1:N --> PhotoAsset
 |       |-- 1:N --> PhotoConsent
 |-- 1:1 --> Microsite
 |-- 1:N --> ReservationSwap
 |-- 1:N --> ActivityFeedEntry (implied)
 |-- 1:N --> TripExpense (implied)

Course
 |-- 1:1 --> CourseRule
 |-- 1:N --> CourseReview
 |-- 1:1 --> CourseComposite
 |-- 1:N --> BookingRequest
 |-- 1:N --> Round
 |-- M:N --> TripOption (via TripOptionCourse)
 |-- M:N --> AccessNetwork (implied, via CourseAccessNetwork)
```

---

## Entities Implied by FRs but NOT in Section 10

### 1. ActivityFeedEntry (implied by FR-10, FR-74, FR-27, FR-8)

**Evidence:** FR-10: "State transitions must be logged and visible in an activity feed." FR-74: "Every meaningful state change should be logged" with "event description, user or system actor, and timestamp." FR-27: "override history should be visible in the trip activity feed."

**Suggested Fields:**
- id, trip_id, actor_id (user or null for system), actor_type (user/system), event_type, event_description, metadata (JSONB), created_at

**Notes:** This is a core entity for the trip experience. FR-74 makes it P0. Every state change across Trip, BookingRequest, Vote, Reservation, etc. should generate an entry.

---

### 2. TripOptionCourse (join table, implied by FR-23)

**Evidence:** FR-23: "a recommended shortlist of itinerary candidates or course combinations." A TripOption can contain multiple courses.

**Suggested Fields:**
- id, trip_option_id, course_id, day_number (which day of the trip), sort_order, created_at

---

### 3. BetParticipant (join table, implied by FR-53)

**Evidence:** FR-53: "participants" and "all named participants accept." Need per-participant acceptance tracking.

**Suggested Fields:**
- id, bet_id, user_id, acceptance_state (pending/accepted/declined), net_amount (computed outcome), created_at, updated_at

---

### 4. TripExpense (implied by FR-80, FR-81, FR-82, FR-83)

**Evidence:** FR-80: "trip expense ledger that tracks shared costs." FR-81: "net balances across all trip expenses."

**Suggested Fields:**
- id, trip_id, paid_by (FK to User), amount, category (tee_time/lodging/meals/transportation/other), description, split_method (equal/custom/exclude), split_details (JSONB), created_at, updated_at

**Notes:** P1 entity. Supports the cost-splitting feature. Not in Section 10 at all.

---

### 5. TripExpenseSplit (join table for TripExpense, implied by FR-80)

**Evidence:** FR-80: "split method (equal, custom, or exclude specific members)."

**Suggested Fields:**
- id, trip_expense_id, user_id, owed_amount, settled (boolean), settled_at, confirmed_by_recipient (boolean), created_at, updated_at

---

### 6. SettlementAction (implied by FR-82, FR-83)

**Evidence:** FR-82: "one-tap settlement actions: deep links to Venmo, Zelle." FR-83: "captain can mark a member's balance as settled, and the member can confirm receipt."

**Suggested Fields:**
- id, trip_id, from_user_id, to_user_id, amount, payment_method, status (pending/marked_settled/confirmed), marked_settled_by, confirmed_at, created_at, updated_at

---

### 7. Notification (implied by FR-72, FR-73)

**Evidence:** FR-72: "Critical events trigger notifications." FR-73: "Users can tune notification preferences by channel and event type."

**Suggested Fields:**
- id, user_id, trip_id, event_type, channel (email/in_app/sms), title, body, sent_at, read_at, created_at

---

### 8. NotificationPreference (implied by FR-73)

**Evidence:** FR-73: "Users can tune notification preferences by channel and event type."

**Suggested Fields:**
- id, user_id, event_type, channel, enabled (boolean), created_at, updated_at

---

### 9. Airport (reference data, implied by FR-11)

**Evidence:** FR-11: "Search accepts U.S. airport codes, airport names." FR-2: "home airport." The system needs to resolve airport codes to coordinates.

**Suggested Fields:**
- id, iata_code, name, city, state, latitude, longitude, geog geography(Point, 4326)

**PostGIS:** Spatial index on geog for radius queries from airports.

---

### 10. ItineraryItem (implied by FR-47, FR-49, FR-44)

**Evidence:** FR-47: "canonical itinerary containing lodging, rounds, tee times, meeting points, flights, notes, and status." FR-49: "Manual itinerary items can be added for dinner plans, rental-car pickup, grocery stop, or general notes." FR-44: external booking capture.

**Suggested Fields:**
- id, trip_id, item_type (round/lodging/flight/dining/transport/note/other), title, date, start_time, end_time, location, address, confirmation_number, booking_contact, cost, notes, source (in_app/external), source_url, sort_order, related_reservation_id, related_round_id, created_by, created_at, updated_at

**Notes:** This is a unifying view entity. Rounds and Reservations are first-class entities, but the itinerary view may also include manually-added items (dinner, car rental, flights) that do not map to other entities.

---

### 11. CourseAccessNetwork (join table, implied by FR-3, FR-13)

**Evidence:** FR-3: "reciprocal networks." FR-13: sponsored private inventory. The system needs to know which reciprocal networks grant access to which courses.

**Suggested Fields:**
- id, course_id, network_name, access_type, access_notes, created_at, updated_at

---

### 12. CourseReport (implied by FR-16)

**Evidence:** FR-16: "Users can flag a course as misclassified or report 'not actually public' / 'not worth the price.'" Creates an admin review task.

**Suggested Fields:**
- id, course_id, reporter_id, report_type (misclassified/not_public/not_worth_price/other), description, status (open/reviewed/resolved/dismissed), reviewed_by, resolved_at, created_at, updated_at

---

### 13. FeeSchedule (implied by FR-67, FR-79)

**Evidence:** FR-67: "Admin can configure fee types." FR-79: "Fee schedules...should be configurable by admin."

**Suggested Fields:**
- id, fee_type, calculation_method (flat/percentage), flat_amount, percentage_rate, per_golfer_cap, effective_from, effective_to, created_by, created_at, updated_at

---

### 14. SearchPreset (implied by FR-15)

**Evidence:** FR-15: "saved search presets per trip."

**Suggested Fields:**
- id, trip_id, name, filters (JSONB), created_by, created_at

**Notes:** P1 entity.

---

### 15. TripSeries (implied by FR-64)

**Evidence:** FR-64: "recurring trip series so that annual editions of the same trip can be grouped together."

**Suggested Fields:**
- id, name, created_by, created_at, updated_at

Would add `series_id` FK to Trip.

**Notes:** P1 entity.

---

### 16. PhotoTag (join table, implied by FR-59)

**Evidence:** FR-59: "manual participant tagging."

**Suggested Fields:**
- id, photo_asset_id, user_id, tagged_by, created_at

**Notes:** Could overlap with PhotoConsent (a consent record is implicitly created for tagged users). But tagging and consent are conceptually separate -- you can be tagged without consenting to publication.

---

### 17. BookingAlert (implied by FR-30)

**Evidence:** FR-30: "Users should be able to subscribe to alerts" for booking windows.

**Suggested Fields:**
- id, booking_request_id, user_id, alert_type, scheduled_for, sent_at, created_at

---

### 18. SwapPolicy (implied by FR-38, FR-79)

**Evidence:** FR-38: "captain can choose a swap policy: notify only, captain approval required, or auto-upgrade within guardrails." FR-79: configurable by admin.

**Notes:** This could be a column on Trip (swap_policy enum) rather than a separate entity. Also could include auto-upgrade guardrail parameters (cost ceiling per FR 8.7.1). If guardrail params are needed, consider either JSONB on Trip or a dedicated table.

---

### 19. MicrositeAsset (join table, implied by FR-60)

**Evidence:** FR-60: Microsite contains "selected photos." Section 10 lists `selected_assets` on Microsite but this is a M:N relationship needing a join table for ordering and metadata.

**Suggested Fields:**
- id, microsite_id, photo_asset_id, sort_order, caption, created_at

---

## Fields Implied by FRs but NOT in Section 10 Key Fields

This section catalogs fields that the FRs clearly require but that are NOT listed in Section 10's "Key fields" column.

| Entity | Missing Field | Source FR | Notes |
|--------|--------------|-----------|-------|
| User | preferred_home_location | FR-2 | Listed in FR-2 profile fields but not in Section 10 |
| Trip | creator_id | FR-6, FR-7, FR-8 | Implied by "trip creator" references throughout |
| Trip | golfer_count | FR-6 | "number of golfers" is a creation field |
| Trip | freeze_date | FR-35, FR-38 | "trip's freeze date, defaulting to seven days before travel" |
| Trip | swap_policy | FR-38 | Captain-configurable swap behavior |
| Trip | decision_deadline | FR-27 | Deadline for voting before captain override |
| TripMember | invited_by | FR-7 | Who sent the invite |
| TripMember | invite_method | FR-7 | email, share_link, sms |
| TripOption | courses (M:N) | FR-23 | Options can contain multiple courses |
| TripOption | rationale | FR-23 | "brief rationale for why it fits" |
| TripOption | vote_deadline | FR-27 | Per-option decision deadline |
| TripOption | finalized_by | FR-27 | Who finalized the option |
| TripOption | finalized_at | FR-27 | When the option was finalized |
| TripOption | override_used | FR-27 | Whether captain override was used |
| Vote | budget_objection | FR-24 | Distinct from comment |
| Course | latitude/longitude/geog | FR-11, FR-12 | "location" in Section 10 must be spatial |
| Course | city, state, address | FR-11, FR-48 | Text location fields for display and search |
| Course | website_url | FR-44 | For link-out booking |
| Course | reasons_to_play | FR-14 | "short reasons-to-play summary" |
| Course | phone/contact_info | FR-48 | Contact notes for itinerary |
| CourseRule | booking_channel | FR-29 | "known booking channel information" |
| CourseRule | cancellation_penalty | FR-37 | Monetary penalty amount |
| CourseRule | public_times_available | Section 8.3 | Whether public times are available |
| CourseReview | round_id | FR-19 | Review linked to a specific completed round |
| CourseReview | individual dimension columns | FR-19 | conditioning, layout, value, pace, service, vibe |
| BookingRequest | created_by | FR-32 | Who initiated the request |
| BookingRequest | assigned_to | FR-76 | Concierge assignment |
| BookingRequest | booking_window_opens_at | FR-30 | When the window opens |
| BookingRequest | notes | FR-76 | Concierge notes |
| Reservation | confirmation_number | FR-48, FR-76 | May overlap with supplier_confirmation |
| Reservation | cancellation_deadline | FR-37 | Per-reservation deadline |
| Reservation | cost_per_player | FR-25, FR-37 | For delta calculations |
| Reservation | total_cost | FR-34 | For fee calculations |
| Reservation | booking_source | FR-33 | direct/guided/assisted/external |
| Round | reservation_id | FR-47 | Link to the associated reservation |
| Round | game_description | FR-52 | Free-text for custom formats |
| Round | finalized_at | FR-51 | When scores are locked |
| ScoreEntry | entered_by | FR-51 | Whose card this score is from |
| Bet | name/description | FR-55 | "custom freeform side-bet names" |
| Bet | trigger_condition | FR-53 | What triggers resolution |
| Bet | notes | FR-55 | "lightweight notes to capture 'stupid bets'" |
| Bet | accepted_at | FR-53 | When all participants accepted |
| Bet | resolved_at | FR-54 | When outcome was determined |
| FeeCharge | source_object_type | FR-67 | Polymorphic discriminator |
| FeeCharge | charged_at | FR-68 | When fee was charged |
| FeeCharge | refund_amount | FR-68 | Explicit refund tracking |
| PhotoAsset | nominated_for_recap | FR-58 | Whether photo is nominated for publication |
| PhotoAsset | nominated_by | FR-58 | Who nominated it |
| Microsite | cover_image_id | FR-60 | For Open Graph preview |
| Microsite | published_by | FR-60 | Captain who published |
| Microsite | published_at | FR-60 | Publication timestamp |
| Microsite | title | FR-60 | For Open Graph tags |
| ReservationSwap | decided_by | FR-37 | Captain who approved/declined |
| ReservationSwap | decided_at | FR-37 | Decision timestamp |
| ReservationSwap | decline_reason | 8.7.1 | Records why suggestion was declined |
| ReservationSwap | cost_delta_per_golfer | FR-37 | Displayed in swap suggestion |
| ReservationSwap | quality_delta | FR-37 | Quality-model delta |
| ReservationSwap | drive_time_delta | FR-37 | Drive time change |

---

## PostGIS Usage Map

### Core Spatial Entity: Course

The Course entity is the primary spatial entity. Its `location` must be a PostGIS geography column.

### Required Spatial Queries and Indexes

| Query Pattern | Source FR | Description | Index Type |
|--------------|-----------|-------------|------------|
| Radius from airport | FR-11, FR-12 | "Search accepts U.S. airport codes... radius from anchor" | GiST on Course.geog + GiST on Airport.geog |
| Radius from city/region | FR-11, FR-12 | "city/region names... radius from anchor" | GiST on Course.geog |
| Drive time from anchor | FR-12 | "drive time from anchor" | Not pure PostGIS; requires route API. Course.geog is input to drive-time API call. May pre-compute drive-time isochrones. |
| Map-based area selection | FR-11 | "map-based area selection" -- bounding box or polygon query | GiST on Course.geog; ST_Within or ST_Intersects |
| Trip anchor proximity ranking | FR-20, FR-40 | "travel convenience" in trip fit; "last-day airport proximity" | ST_Distance on Course.geog |
| Airport proximity for last-day convenience | FR-40 | "last-day airport proximity as a tie-breaker" | ST_Distance between Course.geog and Airport.geog |
| Swap suggestion geographic filter | FR-35, FR-37 | "better-fit alternatives inside the trip's geographic range" | ST_DWithin on Course.geog from Trip anchor |
| Course clustering for lodging | FR-41 | "lodging options aligned to the trip area, course cluster" | ST_ClusterDBSCAN or similar; or application-layer clustering |

### Reference Spatial Entity: Airport

The Airport lookup table needs a geography column for resolving airport codes to coordinates.

| Query Pattern | Description | Index Type |
|--------------|-------------|------------|
| Airport code lookup | Resolve IATA code to coordinates | B-tree on iata_code; GiST on geog |
| Nearest airport to course | For last-day convenience scoring | GiST on Airport.geog |

### Spatial Entity: Trip (anchor_point)

If the resolved anchor coordinates are stored on Trip, a spatial column enables direct distance queries.

| Query Pattern | Description | Index Type |
|--------------|-------------|------------|
| Courses near trip anchor | Primary discovery query | ST_DWithin between Course.geog and Trip.anchor_point |

### PostGIS Extension Requirements

- `postgis` extension (core geometry/geography types and functions)
- `postgis_topology` (likely not needed at launch)
- Coordinate system: SRID 4326 (WGS 84) for geography type
- Geography type preferred over geometry for lat/lng distance calculations (meters, great-circle distance)

### Drive-Time Considerations

Drive-time filtering (FR-12) cannot be solved by PostGIS alone. It requires:
1. A routing API (e.g., Google Maps Distance Matrix, Mapbox Isochrone)
2. Either real-time API calls for each search, or
3. Pre-computed drive-time isochrone polygons stored as PostGIS geometry and queried with ST_Within

Pre-computed isochrones from major airports (e.g., 1h, 2h, 3h drive-time polygons) stored as geometry would allow efficient spatial queries without real-time API calls per search. This is a significant optimization opportunity.

### Spatial Index Summary

| Table | Column | Type | Index |
|-------|--------|------|-------|
| Course | geog | geography(Point, 4326) | GiST |
| Airport | geog | geography(Point, 4326) | GiST |
| Trip | anchor_point | geography(Point, 4326) | GiST |
| DriveTimeIsochrone (optional) | polygon | geometry(Polygon, 4326) | GiST |

---

## Open Questions for Engineering

### Schema Design Questions

1. **Budget settings structure:** How should `Trip.budget_settings` be structured? JSONB with min/max per round? Separate columns? What fields does the shortlist engine need to query against?

2. **Hard constraints and soft preferences:** `TripMember.hard_constraints` and `soft_preferences` need a defined structure. JSONB is flexible but makes constraint-based filtering harder. What query patterns does the shortlist/recommendation engine need?

3. **Official card model:** The ScoreEntry design where each golfer has their own "card" recording scores for all players in the group means `(round_id, player_id, hole_number)` is NOT unique -- only `(round_id, player_id, hole_number, entered_by)` is. Confirm this interpretation: does each golfer maintain a separate scorecard for the entire group, or does each golfer only enter their own scores?

4. **Bet participants:** JSONB array on Bet or normalized BetParticipant table? BetParticipant is strongly preferred for per-participant acceptance tracking and querying, but adds complexity.

5. **Microsite selected_assets:** JSONB array or MicrositeAsset join table? Join table allows ordering and metadata per asset.

6. **Party split storage:** `BookingRequest.party_split` is complex structured data. JSONB with a defined schema, or a normalized PartySplit/SlotPlan table?

7. **Course access network mapping:** How to connect MembershipEntitlement.network_name to courses accessible via that network? CourseAccessNetwork join table seems necessary but the PRD does not specify the data model for this matching.

8. **Teams on Round:** `Round.teams` needs structure. JSONB or a RoundTeam/RoundPlayer join table?

### State Machine Questions

9. **Bet state vs status naming:** Section 10 uses `state` for Bet while every other entity uses `status`. Standardize to `status`?

10. **Reservation state machine:** Section 10 only lists BookingRequest state machine, not Reservation. Reservation has a `status` field. What are the valid states and transitions? Suggested: `pending`, `held`, `confirmed`, `canceled`, `played`, `no_show`.

11. **User status states:** Section 10 lists `status` as a key field but never enumerates User states. What states are valid? Suggested: `active`, `suspended`, `deactivated`.

12. **TripOption status states:** Not enumerated in Section 10. What states are valid? Suggested: `proposed`, `shortlisted`, `voting`, `finalized`, `eliminated`, `rejected`.

13. **Round status states:** Not enumerated in Section 10. What states are valid? Suggested: `scheduled`, `in_progress`, `completed`, `finalized`, `canceled`.

14. **Course status states:** Not enumerated. How does admin curation affect course visibility? Suggested: `draft`, `active`, `hidden`, `archived`.

15. **PhotoAsset vetoed state:** The listed state machine (Private -> Review Pending -> Publish Eligible -> Published -> Withdrawn) does not include a `vetoed` state. FR-58 says a veto makes the asset ineligible for publication. Should `vetoed` be a distinct state, or is it handled by PhotoConsent blocking the transition from Review Pending to Publish Eligible?

### Cardinality and Relationship Questions

16. **Trip to Microsite:** Confirmed 1:1? Can a trip have multiple microsites (e.g., draft versions)?

17. **Round to Course:** Is it always 1:1? Can a round span multiple courses (e.g., 9 holes on each of two courses)?

18. **BookingRequest to Course:** Is it always 1:1? Or can a booking request cover multiple courses for multi-day trips?

19. **Reservation to Round:** What links a Reservation to a Round? Through BookingRequest.course_id + target_date matching Round.course_id + date? Or a direct FK?

### PostGIS and Performance Questions

20. **Drive-time isochrones:** Should we pre-compute and store drive-time polygons from major airports? How many airports? Update frequency?

21. **Spatial index coverage:** Should we create compound indexes (geog + access_type, geog + price_band) for filtered spatial queries, or rely on PostGIS GiST + B-tree index intersection?

22. **Geography vs geometry:** Confirm geography type (SRID 4326) is correct for all spatial columns. Geography gives accurate distance in meters but has fewer spatial functions than geometry.

### Data Integrity Questions

23. **Soft delete scope:** Which entities need soft delete? User, Course, PhotoAsset, Microsite are clear candidates. What about Trip, Vote, Bet?

24. **Cascade behavior:** What happens when a Trip is soft-deleted? Should TripMembers, TripOptions, Votes cascade? Or should Trips never be deletable (only Archived)?

25. **Audit trail approach:** The PRD requires extensive auditability (FR-62, FR-71, FR-74). Should we use a generic audit_log table, per-entity history tables, or rely on the ActivityFeedEntry for trip-scoped audit?

26. **Multi-tenancy:** The PRD does not mention multi-tenancy. Is this a single-tenant application? If multi-tenant later, should we add an org/tenant dimension now?

### Missing from PRD

27. **No explicit mention of:** password/auth storage (FR-1 says "email-based authentication" but no entity for auth tokens, sessions, or OAuth). This is typically handled by an auth provider (e.g., Auth0, Clerk) but worth confirming.

28. **No explicit entity for:** notification delivery tracking, email templates, or SMS message logs. These may be handled by external services but need at least a reference table.

29. **ItineraryItem as a first-class entity or a view:** FR-47 describes a "canonical itinerary" but Section 10 has no ItineraryItem entity. Is the itinerary a computed view over Rounds + Reservations + manual items, or a materialized entity?

30. **Historical stats aggregation:** FR-56 and FR-65 mention "year-over-year stats," "score averages," and "bet performance." Should these be pre-computed summary tables or computed on the fly?

31. **Fee schedule versioning:** FR-67 says fee changes apply only to future transactions. Should FeeSchedule have effective_from/effective_to date ranges, or should FeeCharge snapshot the rate at charge time?
