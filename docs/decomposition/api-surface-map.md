# API Surface Map — Golf Trip Coordination Platform

> **Document type**: Research/analysis — derived from PRD v3 (golf_trip_coordination_prd_v3.md)
>
> **Purpose**: Map every FR to at least one API endpoint, grouped by service boundary (PRD Section 11.1). This is the canonical reference for implementation decomposition.
>
> **Date**: 2026-03-13

---

## Table of Contents

1. [Identity and Profile Service](#1-identity-and-profile-service)
2. [Trip and Collaboration Service](#2-trip-and-collaboration-service)
3. [Discovery and Scoring Service](#3-discovery-and-scoring-service)
4. [Booking Orchestration Service](#4-booking-orchestration-service)
5. [Optimization Service](#5-optimization-service)
6. [Travel Add-On Service](#6-travel-add-on-service)
7. [Rounds, Games, and Betting Ledger Service](#7-rounds-games-and-betting-ledger-service)
8. [Media and Microsite Service](#8-media-and-microsite-service)
9. [Billing Service](#9-billing-service)
10. [Notification Service](#10-notification-service)
11. [Admin / Operations Service](#11-admin--operations-service)
12. [Summary: Endpoint Count per Service](#summary-endpoint-count-per-service)
13. [Cross-Service Dependencies](#cross-service-dependencies)
14. [Real-Time / WebSocket Requirements](#real-time--websocket-requirements)
15. [External API Integrations](#external-api-integrations)
16. [Webhook / Callback Patterns](#webhook--callback-patterns)
17. [Admin vs Consumer API Separation](#admin-vs-consumer-api-separation)
18. [Open Questions](#open-questions)

---

## 1. Identity and Profile Service

**Serves**: FR-1, FR-2, FR-3, FR-4, FR-5

### 1.1 Authentication

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/auth/register` | Create account with email/password | Public | FR-1 |
| POST | `/api/auth/login` | Email/password login, returns session/token | Public | FR-1 |
| POST | `/api/auth/logout` | Destroy session | Authenticated | FR-1 |
| POST | `/api/auth/forgot-password` | Initiate password reset flow | Public | FR-1 |
| POST | `/api/auth/reset-password` | Complete password reset with token | Public | FR-1 |
| GET | `/api/auth/me` | Return current user identity and roles | Authenticated | FR-5 |

**Request/response sketches**:
- `POST /api/auth/register`: `{ email, password, name }` -> `{ user: { id, email, name }, token }`
- `POST /api/auth/login`: `{ email, password }` -> `{ user: { id, email, name, roles[] }, token }`

### 1.2 User Profile

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/users/:userId` | Get user profile | Authenticated | FR-2 |
| PUT | `/api/users/:userId` | Update profile fields (name, phone, handicap, home_airport, preferred_location) | Authenticated (self) | FR-2 |
| GET | `/api/users/:userId/stats` | Cross-trip history, win/loss records, score averages | Authenticated | FR-56, FR-65 |

**Request/response sketches**:
- `GET /api/users/:userId` -> `{ id, name, email, phone, handicap, home_airport, preferred_location, created_at }`
- `PUT /api/users/:userId`: `{ phone?, handicap?, home_airport?, preferred_location? }` -> `{ user }`

### 1.3 Membership Entitlements

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/users/:userId/memberships` | List user's club memberships | Authenticated (self or admin) | FR-3 |
| POST | `/api/users/:userId/memberships` | Add a club membership | Authenticated (self) | FR-3 |
| PUT | `/api/users/:userId/memberships/:membershipId` | Update membership details (notes, guest limits, blackouts) | Authenticated (self) | FR-3 |
| DELETE | `/api/users/:userId/memberships/:membershipId` | Remove a membership | Authenticated (self) | FR-3 |
| PUT | `/api/users/:userId/memberships/:membershipId/sponsor-willingness` | Toggle willing-to-sponsor flag | Authenticated (self) | FR-3 |

**Request/response sketches**:
- `POST /api/users/:userId/memberships`: `{ club_name, network_name, access_type, notes, willing_to_sponsor }` -> `{ membership }`
- Membership object: `{ id, club_name, network_name, access_type, verified_status, notes, willing_to_sponsor, guest_limit_notes }`

### 1.4 Rate Limiting Considerations
- Registration: 5 attempts per IP per hour (anti-spam)
- Login: 10 attempts per email per 15 minutes (brute-force protection)
- Password reset: 3 per email per hour

**Endpoint count**: ~14

---

## 2. Trip and Collaboration Service

**Serves**: FR-6, FR-7, FR-8, FR-9, FR-10, FR-23, FR-24, FR-25, FR-26, FR-27, FR-28, FR-74

### 2.1 Trip CRUD

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips` | Create a new trip | Authenticated | FR-6 |
| GET | `/api/trips` | List user's trips (as member or creator) | Authenticated | FR-6, FR-63 |
| GET | `/api/trips/:tripId` | Get trip details (dashboard data) | Trip member | FR-6, FR-10 |
| PUT | `/api/trips/:tripId` | Update trip settings (dates, name, anchor, budget) | Trip member (captain for some fields) | FR-6 |
| PUT | `/api/trips/:tripId/state` | Transition trip state | Captain or system | FR-10 |
| GET | `/api/trips/:tripId/activity` | Get activity feed for the trip | Trip member | FR-74 |

**Request/response sketches**:
- `POST /api/trips`: `{ name, date_start, date_end, num_golfers, anchor_type, anchor_value, budget_min?, budget_max?, budget_per_golfer? }` -> `{ trip }`
- Trip object: `{ id, name, date_start, date_end, num_golfers, anchor_type, anchor_value, budget_settings, status, created_by, captain_id, created_at }`
- Activity feed item: `{ id, trip_id, event_type, actor_id, actor_name, description, metadata, timestamp }`

### 2.2 Trip Members & Invitations

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/invites` | Send invite(s) via email/SMS | Captain or creator | FR-7 |
| GET | `/api/trips/:tripId/invites` | List pending/accepted/declined invites | Trip member | FR-7 |
| POST | `/api/trips/:tripId/invites/:inviteToken/accept` | Accept an invitation | Public (with token) or Authenticated | FR-7 |
| POST | `/api/trips/:tripId/invites/:inviteToken/decline` | Decline an invitation | Public (with token) or Authenticated | FR-7 |
| GET | `/api/trips/:tripId/share-link` | Generate or retrieve a shareable invite link | Captain or creator | FR-7 |
| GET | `/api/trips/:tripId/members` | List trip members with roles and response status | Trip member | FR-8 |
| PUT | `/api/trips/:tripId/members/:userId/role` | Transfer captain role | Captain or creator | FR-8 |
| DELETE | `/api/trips/:tripId/members/:userId` | Remove a member from trip | Captain | FR-8 |
| PUT | `/api/trips/:tripId/members/:userId/constraints` | Set hard constraints and soft preferences | Trip member (self) | FR-9 |
| GET | `/api/trips/:tripId/members/:userId/constraints` | Get member's constraints | Trip member (self or captain) | FR-9 |

**Request/response sketches**:
- `POST /api/trips/:tripId/invites`: `{ emails?: string[], phone_numbers?: string[] }` -> `{ invites[] }`
- Invite object: `{ id, trip_id, email, phone, status: "pending"|"accepted"|"declined", invited_by, created_at }`
- Member constraint: `{ max_budget_per_round?, travel_window_start?, travel_window_end?, preferred_airport?, willing_private_rounds? }`

### 2.3 Trip Options (Shortlist)

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/options` | Add a course/itinerary option to shortlist | Trip member | FR-23 |
| POST | `/api/trips/:tripId/options/generate` | System-generate recommended shortlist (3-5 options) | Trip member | FR-23 |
| GET | `/api/trips/:tripId/options` | List all shortlist options with vote tallies | Trip member | FR-23, FR-25 |
| GET | `/api/trips/:tripId/options/:optionId` | Get option detail with cost breakdown, fit rationale | Trip member | FR-25 |
| PUT | `/api/trips/:tripId/options/:optionId` | Update option details | Captain | FR-23 |
| DELETE | `/api/trips/:tripId/options/:optionId` | Remove option from shortlist | Captain | FR-23 |

**Request/response sketches**:
- Trip option object: `{ id, trip_id, type: "destination"|"course"|"itinerary", title, courses[], estimated_cost_per_golfer, fit_score, fit_rationale, status, vote_summary: { in, fine, out }, created_at }`

### 2.4 Voting

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/options/:optionId/votes` | Cast or update a vote (In/Fine/Out) | Trip member | FR-24 |
| GET | `/api/trips/:tripId/options/:optionId/votes` | Get all votes for an option | Trip member | FR-24 |
| POST | `/api/trips/:tripId/options/:optionId/override` | Captain override to finalize option | Captain only | FR-27 |
| PUT | `/api/trips/:tripId/voting-deadline` | Set or update voting deadline | Captain | FR-27 |
| PUT | `/api/trips/:tripId/voting-mode` | Switch between destination-level and course-level voting | Captain | FR-28 |

**Request/response sketches**:
- `POST .../votes`: `{ vote_value: "in"|"fine"|"out", comment?, budget_objection? }` -> `{ vote }`
- Vote object: `{ id, option_id, user_id, user_name, vote_value, comment, budget_objection, timestamp }`
- Override response: `{ option_id, override_by, vote_distribution: { in, fine, out }, timestamp, logged_in_activity_feed: true }`

### 2.5 Rate Limiting Considerations
- Vote casting: 30 per minute per user (prevent spam)
- Invite sending: 20 per trip per hour (abuse prevention)
- Share link generation: 10 per trip per hour

**Endpoint count**: ~24

---

## 3. Discovery and Scoring Service

**Serves**: FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21, FR-22, FR-26

### 3.1 Course Search

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/search/courses` | Search courses with geo + filters | Authenticated | FR-11, FR-12, FR-13, FR-14 |
| GET | `/api/search/resolve-location` | Resolve airport code / city name to coordinates | Authenticated | FR-11 |
| GET | `/api/search/suggestions` | Autocomplete for airport codes, city names | Authenticated | FR-11 |
| POST | `/api/trips/:tripId/search-presets` | Save a search preset for the trip | Trip member | FR-15 |
| GET | `/api/trips/:tripId/search-presets` | List saved search presets | Trip member | FR-15 |

**Request/response sketches**:
- `POST /api/search/courses`:
  ```
  {
    anchor: { type: "airport"|"city"|"coordinates"|"bounds", value },
    radius_miles?,
    drive_time_minutes?,
    date_start?, date_end?,
    price_band?: { min, max },
    num_golfers?,
    access_types?: ["public", "resort", "semi_private"],
    trip_id?, // for member-sponsored inventory resolution
    sort_by?: "trip_fit"|"distance"|"price"|"quality",
    page?, page_size?
  }
  ```
  Response:
  ```
  {
    courses: [{
      id, name, location: { lat, lng, city, state },
      access_type, access_badge, access_confidence,
      distance_miles, drive_time_minutes,
      price_band: { min, max },
      booking_window_status,
      quality: { community_score, composite_score },
      reasons_to_play,
      thumbnail_url
    }],
    total_count, page, page_size,
    member_unlocked_courses?: [{ ...course, access_explanation }],
    filter_suggestions?: []
  }
  ```

### 3.2 Course Detail

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/courses/:courseId` | Full course detail page data | Authenticated | FR-14 |
| GET | `/api/courses/:courseId/reviews` | Paginated community reviews | Authenticated | FR-17, FR-19 |
| POST | `/api/courses/:courseId/reviews` | Submit a structured review | Authenticated | FR-19 |
| PUT | `/api/courses/:courseId/reviews/:reviewId` | Update own review | Authenticated (author) | FR-19 |
| DELETE | `/api/courses/:courseId/reviews/:reviewId` | Delete own review | Authenticated (author) | FR-19 |
| POST | `/api/courses/:courseId/report` | Flag a course as misclassified | Authenticated | FR-16 |

**Request/response sketches**:
- `GET /api/courses/:courseId`:
  ```
  {
    id, name, location, access_type, access_confidence,
    public_times_available, public_times_rules,
    price_range: { min, max, guest_fees },
    booking_window_rule, cancellation_policy,
    max_players_per_tee_time,
    quality: {
      community_score, community_review_count,
      composite: { editorial_score, external_rank_score, value_score, trip_fit_inputs }
    },
    dimensions: { conditioning, layout, value, pace, service, vibe },
    amenities, photos[], airport_convenience_notes,
    reasons_to_play
  }
  ```
- `POST /api/courses/:courseId/reviews`:
  ```
  {
    dimensions: { conditioning: 1-5, layout: 1-5, value: 1-5, pace: 1-5, service: 1-5, vibe: 1-5 },
    text?,
    round_id?
  }
  ```

### 3.3 Course Scoring/Quality (Internal)

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/courses/:courseId/quality` | Get full quality breakdown | Authenticated | FR-17, FR-18, FR-21 |
| GET | `/api/courses/:courseId/trip-fit/:tripId` | Get trip-specific fit score | Trip member | FR-20, FR-26 |

### 3.4 Rate Limiting Considerations
- Search: 60 per minute per user (geo queries are expensive)
- Review submission: 5 per hour per user
- Report submission: 10 per hour per user

**Endpoint count**: ~13

---

## 4. Booking Orchestration Service

**Serves**: FR-29, FR-30, FR-31, FR-32, FR-33, FR-34, FR-36, FR-44

### 4.1 Course Booking Rules

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/courses/:courseId/booking-rules` | Get booking rules for a course | Authenticated | FR-29 |

### 4.2 Booking Requests

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/booking-requests` | Create a booking request for a round | Captain or trip member | FR-32, FR-33 |
| GET | `/api/trips/:tripId/booking-requests` | List all booking requests for a trip | Trip member | FR-30 |
| GET | `/api/trips/:tripId/booking-requests/:requestId` | Get booking request detail with split plan | Trip member | FR-31, FR-32 |
| PUT | `/api/trips/:tripId/booking-requests/:requestId` | Update request (time range, preferences) | Captain | FR-32 |
| DELETE | `/api/trips/:tripId/booking-requests/:requestId` | Cancel a booking request | Captain | FR-32 |

**Request/response sketches**:
- `POST /api/trips/:tripId/booking-requests`:
  ```
  {
    course_id,
    target_date,
    target_time_range: { earliest, latest },
    preferred_time?,
    num_golfers,
    notes?
  }
  ```
  Response:
  ```
  {
    id, trip_id, course_id,
    target_date, target_time_range,
    party_split: [{ group_num, player_ids[], target_time, tee_time_gap_minutes }],
    mode: "direct"|"guided_checkout"|"assisted",
    status: "candidate"|"window_pending"|"requested"|"partial_hold"|"booked"|"locked"|"canceled",
    booking_window_opens_at,
    fee_disclosure: { service_fee, pass_through_costs }
  }
  ```

### 4.3 Booking Room (Real-Time)

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/booking-room` | Get booking room state (all active requests, statuses, countdown) | Trip member | FR-32 |
| POST | `/api/trips/:tripId/booking-room/slots/:slotId/attempt` | Initiate a booking attempt for a specific slot | Captain or assigned user | FR-32, FR-33 |
| POST | `/api/trips/:tripId/booking-room/slots/:slotId/confirm` | Confirm a held slot (proceed to checkout) | Captain | FR-33, FR-34 |
| POST | `/api/trips/:tripId/booking-room/slots/:slotId/release` | Release a held slot | Captain | FR-32 |
| POST | `/api/trips/:tripId/booking-room/slots/:slotId/fallback` | Request assisted booking fallback | Trip member | FR-33 |
| WS | `/ws/trips/:tripId/booking-room` | Real-time booking room updates | Trip member | FR-32 |

**Request/response sketches**:
- Booking room state:
  ```
  {
    trip_id,
    booking_requests: [{
      id, course_name, target_date,
      window_opens_at, countdown_seconds,
      slots: [{
        slot_id, group_num, players[],
        target_time, status: "pending"|"attempting"|"held"|"confirmed"|"failed",
        assigned_to: { type: "user"|"automation"|"concierge", id, name },
        hold_expires_at?,
        confirmation?: { number, tee_time, players }
      }],
      fallback_actions: ["request_assisted", "try_alternate_time"]
    }]
  }
  ```

### 4.4 Reservations

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/reservations` | List all confirmed reservations | Trip member | FR-47, FR-48 |
| GET | `/api/trips/:tripId/reservations/:reservationId` | Get reservation detail | Trip member | FR-48 |
| PUT | `/api/trips/:tripId/reservations/:reservationId` | Update reservation details (confirmation info) | Captain or concierge | FR-48 |
| DELETE | `/api/trips/:tripId/reservations/:reservationId` | Cancel a reservation | Captain | FR-36 |

**Request/response sketches**:
- Reservation object:
  ```
  {
    id, booking_request_id, trip_id, course_id, course_name,
    supplier_confirmation, tee_time, players[],
    status: "confirmed"|"swappable"|"locked"|"played"|"canceled",
    fee_state: { service_fee, disclosed_at, charged: boolean },
    cancellation_policy, cancellation_deadline
  }
  ```

### 4.5 External Booking Capture (Link-Out Fallback)

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/external-bookings` | Capture a booking made outside the app | Trip member | FR-44 |
| GET | `/api/trips/:tripId/external-bookings` | List externally captured bookings | Trip member | FR-44 |
| PUT | `/api/trips/:tripId/external-bookings/:bookingId` | Update an external booking capture | Trip member (creator) | FR-44 |
| DELETE | `/api/trips/:tripId/external-bookings/:bookingId` | Remove an external booking | Trip member (creator) | FR-44 |

**Request/response sketches**:
- `POST /api/trips/:tripId/external-bookings`:
  ```
  {
    type: "golf"|"lodging"|"flight"|"other",
    source, confirmation_number?, date, time?,
    cost?, booking_contact?, notes?, link_url?
  }
  ```

### 4.6 Rate Limiting Considerations
- Booking attempts: 10 per slot per hour (prevent spam against aggregator APIs)
- External booking capture: 20 per trip per hour
- Concurrent hold requests: subject to aggregator API rate limits (see Section 11.3)

**Endpoint count**: ~18 (+ 1 WebSocket)

---

## 5. Optimization Service

**Serves**: FR-35, FR-36, FR-37, FR-38, FR-39, FR-40

### 5.1 Swap Suggestions

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/swap-suggestions` | List all pending/past swap suggestions | Trip member | FR-39 |
| GET | `/api/trips/:tripId/swap-suggestions/:suggestionId` | Get swap suggestion detail (side-by-side comparison) | Trip member | FR-37 |
| POST | `/api/trips/:tripId/swap-suggestions/:suggestionId/approve` | Captain approves a swap | Captain only | FR-37, FR-38 |
| POST | `/api/trips/:tripId/swap-suggestions/:suggestionId/decline` | Captain declines a swap (with optional reason) | Captain only | FR-37, FR-38 |

**Request/response sketches**:
- Swap suggestion object:
  ```
  {
    id, trip_id,
    current_reservation: { id, course_name, tee_time, cost_per_golfer, quality_score },
    proposed_replacement: { course_id, course_name, available_time, cost_per_golfer, quality_score },
    comparison: {
      cost_delta_per_golfer,
      quality_delta,
      drive_time_change_minutes,
      cancellation_deadline_current,
      cancellation_penalty,
      within_budget_constraints: boolean
    },
    rationale,
    status: "pending"|"approved"|"declined"|"expired",
    created_at, expires_at
  }
  ```

### 5.2 Swap Policy

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/swap-policy` | Get current swap policy | Trip member | FR-38 |
| PUT | `/api/trips/:tripId/swap-policy` | Set swap policy (notify_only / captain_approval / auto_upgrade) | Captain only | FR-38 |

### 5.3 Rebooking Timeline

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/rebooking-timeline` | Timeline of all swap activity (before/after/rationale) | Trip member | FR-39 |

### 5.4 Freeze Date

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/freeze-date` | Get the optimization freeze date | Trip member | FR-35 |
| PUT | `/api/trips/:tripId/freeze-date` | Set/update freeze date (default T-7) | Captain only | FR-35 |

**Endpoint count**: ~9

---

## 6. Travel Add-On Service

**Serves**: FR-41, FR-42, FR-43, FR-44, FR-45, FR-46, FR-49, FR-50

### 6.1 Lodging Search

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/lodging/search` | Search lodging near trip area | Trip member | FR-41 |
| GET | `/api/trips/:tripId/lodging/options` | List saved/viewed lodging options | Trip member | FR-41 |

### 6.2 Flight Search

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/flights/search` | Search flights for trip members | Trip member | FR-42 |
| GET | `/api/trips/:tripId/flights/options` | List saved flight options | Trip member | FR-42 |

### 6.3 Itinerary

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/itinerary` | Get full canonical itinerary (day-by-day) | Trip member | FR-45, FR-47 |
| POST | `/api/trips/:tripId/itinerary/items` | Add a manual itinerary item (dinner, rental car, etc.) | Trip member | FR-49 |
| PUT | `/api/trips/:tripId/itinerary/items/:itemId` | Update itinerary item | Trip member (creator) or captain | FR-49 |
| DELETE | `/api/trips/:tripId/itinerary/items/:itemId` | Remove itinerary item | Trip member (creator) or captain | FR-49 |

**Request/response sketches**:
- Itinerary response:
  ```
  {
    trip_id,
    days: [{
      date,
      items: [{
        id, type: "golf"|"lodging"|"flight"|"dinner"|"transport"|"note"|"other",
        title, time?, end_time?,
        location?: { address, lat, lng },
        confirmation_number?,
        participants?,
        contact_notes?,
        status, source: "platform"|"external"|"manual",
        notes?
      }]
    }]
  }
  ```

**Endpoint count**: ~10

---

## 7. Rounds, Games, and Betting Ledger Service

**Serves**: FR-51, FR-52, FR-53, FR-54, FR-55, FR-56

### 7.1 Rounds

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/rounds` | Create a round (assign players, teams, format) | Trip member | FR-51 |
| GET | `/api/trips/:tripId/rounds` | List rounds for a trip | Trip member | FR-51 |
| GET | `/api/trips/:tripId/rounds/:roundId` | Get round detail (scores, teams, games) | Trip member | FR-51 |
| PUT | `/api/trips/:tripId/rounds/:roundId` | Update round settings (teams, format) | Captain or round creator | FR-51 |
| POST | `/api/trips/:tripId/rounds/:roundId/finalize` | Finalize/lock round scores | Captain | FR-51 |

### 7.2 Score Entry

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| PUT | `/api/trips/:tripId/rounds/:roundId/scores` | Batch upsert scores for a player (optimistic, offline-capable) | Trip member (self) | FR-51 |
| GET | `/api/trips/:tripId/rounds/:roundId/scores` | Get all scores for a round (all players, all holes) | Trip member | FR-51 |
| GET | `/api/trips/:tripId/rounds/:roundId/scores/discrepancies` | Get discrepancy report across official cards | Trip member | FR-51 |
| POST | `/api/trips/:tripId/rounds/:roundId/scores/resolve-discrepancy` | Resolve a score discrepancy | Captain or involved players | FR-51 |
| WS | `/ws/trips/:tripId/rounds/:roundId/live` | Real-time score updates for live round | Trip member | FR-51 |

**Request/response sketches**:
- `PUT .../scores`:
  ```
  {
    player_id,
    entries: [{ hole_number: 1-18, strokes, net_strokes? }],
    client_timestamp
  }
  ```
  Response: `{ saved_entries[], sync_status: "synced"|"pending" }`
- Discrepancy: `{ hole_number, player_id, cards: [{ reporter_id, strokes }], resolved: boolean }`

### 7.3 Games

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/rounds/:roundId/games` | Create a game (stroke, best ball, skins, Nassau, custom) | Trip member | FR-52 |
| GET | `/api/trips/:tripId/rounds/:roundId/games` | List games for a round | Trip member | FR-52 |
| GET | `/api/trips/:tripId/rounds/:roundId/games/:gameId` | Get game detail with live standings/results | Trip member | FR-52 |
| PUT | `/api/trips/:tripId/rounds/:roundId/games/:gameId` | Update game (settings, manual results) | Game creator or captain | FR-52 |
| GET | `/api/trips/:tripId/rounds/:roundId/games/:gameId/results` | Get calculated game results | Trip member | FR-52 |

**Request/response sketches**:
- `POST .../games`:
  ```
  {
    format: "stroke_play"|"best_ball"|"skins"|"nassau"|"custom",
    name?,
    teams?: [{ name, player_ids[] }],
    custom_rules_text?,
    stakes_per_player?
  }
  ```

### 7.4 Side Bets

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/rounds/:roundId/bets` | Create a quick side bet | Trip member | FR-53, FR-55 |
| GET | `/api/trips/:tripId/rounds/:roundId/bets` | List bets for a round | Trip member | FR-53 |
| GET | `/api/trips/:tripId/bets` | List all bets for a trip | Trip member | FR-54 |
| PUT | `/api/trips/:tripId/rounds/:roundId/bets/:betId` | Update bet (e.g., add notes) | Bet creator | FR-55 |
| POST | `/api/trips/:tripId/rounds/:roundId/bets/:betId/accept` | Accept a proposed bet | Named participant | FR-53 |
| POST | `/api/trips/:tripId/rounds/:roundId/bets/:betId/decline` | Decline a proposed bet | Named participant | FR-53 |
| POST | `/api/trips/:tripId/rounds/:roundId/bets/:betId/void` | Void a bet | Captain or creator (before round starts) | FR-53 |
| POST | `/api/trips/:tripId/rounds/:roundId/bets/:betId/resolve` | Resolve/settle a bet outcome | Captain or system | FR-54 |

**Request/response sketches**:
- `POST .../bets`:
  ```
  {
    amount,
    participants: [{ user_id, side?: string }],
    trigger: string,
    name?,
    notes?
  }
  ```
- Bet object: `{ id, round_id, creator_id, amount, participants[], trigger, name, notes, state: "proposed"|"accepted"|"declined"|"resolved"|"voided"|"expired", outcome?, created_at }`

### 7.5 Bet Ledger & Settlement

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/bet-ledger` | Net positions across all bets (who owes whom) | Trip member | FR-54 |
| GET | `/api/trips/:tripId/rounds/:roundId/bet-ledger` | Settlement summary for a specific round | Trip member | FR-54 |
| POST | `/api/trips/:tripId/bet-ledger/settlement-link` | Generate settlement deep link (Venmo, etc.) | Trip member | FR-54 |

### 7.6 Historical Stats

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/users/:userId/golf-stats` | Cross-trip scoring, win/loss, bet performance | Authenticated | FR-56, FR-65 |
| GET | `/api/trips/:tripId/stats` | Trip-level leaderboard and stats | Trip member | FR-56 |
| GET | `/api/rivalry/:seriesId/stats` | Recurring trip series stats | Authenticated (series member) | FR-64, FR-65 |

**Endpoint count**: ~27 (+ 1 WebSocket)

---

## 8. Media and Microsite Service

**Serves**: FR-57, FR-58, FR-59, FR-60, FR-61, FR-62

### 8.1 Photo Upload & Management

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/photos` | Upload photo(s) to private album | Trip member | FR-57 |
| GET | `/api/trips/:tripId/photos` | List photos in trip album (with publish state) | Trip member | FR-57 |
| GET | `/api/trips/:tripId/photos/:photoId` | Get photo detail (tags, consent state, publish state) | Trip member | FR-57 |
| DELETE | `/api/trips/:tripId/photos/:photoId` | Delete own uploaded photo | Uploader or captain | FR-57 |
| POST | `/api/trips/:tripId/photos/upload-url` | Get presigned upload URL for direct S3 upload | Trip member | FR-57 |

### 8.2 Photo Tagging

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/photos/:photoId/tags` | Tag member(s) in a photo | Trip member | FR-59 |
| DELETE | `/api/trips/:tripId/photos/:photoId/tags/:userId` | Remove a tag | Tagged user or tagger | FR-59 |

### 8.3 Photo Consent & Veto

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/photos/:photoId/nominate` | Nominate a photo for public recap | Trip member or captain | FR-58 |
| POST | `/api/trips/:tripId/photos/:photoId/consent` | Approve or veto a photo for publication | Trip member (tagged) | FR-58 |
| POST | `/api/trips/:tripId/photos/:photoId/takedown` | Request post-publish takedown | Trip member | FR-61 |
| GET | `/api/trips/:tripId/photos/consent-queue` | Photos pending consent for current user | Trip member | FR-58 |
| GET | `/api/trips/:tripId/photos/audit-log` | Audit trail of consent decisions | Captain or admin | FR-62 |

### 8.4 Microsite

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/microsite` | Get microsite config and content | Captain | FR-60 |
| PUT | `/api/trips/:tripId/microsite` | Update microsite content (selected photos, sections) | Captain | FR-60 |
| POST | `/api/trips/:tripId/microsite/publish` | Publish the microsite | Captain only | FR-60 |
| PUT | `/api/trips/:tripId/microsite/visibility` | Toggle visibility (unlisted/noindex vs public promotion) | Captain only | FR-60 |
| POST | `/api/trips/:tripId/microsite/unpublish` | Unpublish the microsite | Captain or admin | FR-60, FR-78 |
| GET | `/api/recaps/:slug` | **Public** microsite view (no auth) | Public | FR-60 |

**Endpoint count**: ~18

---

## 9. Billing Service

**Serves**: FR-67, FR-68, FR-69, FR-70, FR-71, FR-80, FR-81, FR-82, FR-83

### 9.1 Fee Charges (Platform Revenue)

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/fees` | List all fee charges for a trip | Trip member | FR-70, FR-71 |
| GET | `/api/trips/:tripId/fees/:feeId` | Get fee detail | Trip member | FR-71 |
| GET | `/api/users/:userId/billing-history` | User's billing history across trips | Authenticated (self) | FR-71 |

### 9.2 Fee Disclosure (Pre-Confirmation)

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/billing/fee-estimate` | Get itemized fee estimate before confirming a booking/bet | Authenticated | FR-34, FR-70 |

**Request/response sketches**:
- `POST /api/billing/fee-estimate`:
  ```
  {
    type: "tee_time"|"bet"|"lodging"|"air",
    base_cost, num_golfers?,
    bet_amount?, bet_count?
  }
  ```
  Response:
  ```
  {
    service_fee, pass_through_costs,
    per_golfer_cap_applied?: boolean,
    total, line_items: [{ label, amount }]
  }
  ```

### 9.3 Trip Expense Ledger (Member-to-Member)

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/expenses` | Log a shared expense | Trip member | FR-80 |
| GET | `/api/trips/:tripId/expenses` | List all logged expenses | Trip member | FR-80 |
| PUT | `/api/trips/:tripId/expenses/:expenseId` | Update an expense | Expense creator or captain | FR-80 |
| DELETE | `/api/trips/:tripId/expenses/:expenseId` | Delete an expense | Expense creator or captain | FR-80 |
| GET | `/api/trips/:tripId/settlement-summary` | Net balances: who owes whom (includes bets + expenses) | Trip member | FR-81 |
| POST | `/api/trips/:tripId/settlement-summary/:userId/settle` | Generate settlement deep link for a specific balance | Trip member | FR-82 |
| PUT | `/api/trips/:tripId/settlement-summary/:userId/mark-settled` | Mark a balance as settled | Captain | FR-83 |
| POST | `/api/trips/:tripId/settlement-summary/:userId/confirm-receipt` | Member confirms they received payment | Trip member (payee) | FR-83 |

**Request/response sketches**:
- `POST /api/trips/:tripId/expenses`:
  ```
  {
    description, amount, payer_user_id,
    category: "tee_time"|"lodging"|"meal"|"transport"|"other",
    split_method: "equal"|"custom"|"exclude",
    custom_splits?: [{ user_id, amount }],
    excluded_user_ids?: []
  }
  ```
- Settlement summary:
  ```
  {
    trip_id,
    member_balances: [{
      user_id, user_name,
      net_position,
      owes_to: [{ user_id, user_name, amount }],
      owed_by: [{ user_id, user_name, amount }],
      settled: boolean, confirmed: boolean
    }],
    platform_fees: { total, per_member: [{ user_id, amount }] }
  }
  ```

### 9.4 Payment Processing

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/users/:userId/payment-methods` | Add payment method (Stripe) | Authenticated (self) | FR-68 |
| GET | `/api/users/:userId/payment-methods` | List payment methods | Authenticated (self) | FR-68 |
| DELETE | `/api/users/:userId/payment-methods/:methodId` | Remove payment method | Authenticated (self) | FR-68 |
| POST | `/api/billing/charge` | Charge a fee (internal/system use) | System only | FR-68 |
| POST | `/api/billing/refund/:feeId` | Refund a fee charge | Admin only | FR-68 |

**Endpoint count**: ~18

---

## 10. Notification Service

**Serves**: FR-72, FR-73, FR-74, FR-50

### 10.1 Notification Preferences

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/users/:userId/notification-preferences` | Get notification preferences | Authenticated (self) | FR-73 |
| PUT | `/api/users/:userId/notification-preferences` | Update preferences by channel and event type | Authenticated (self) | FR-73 |

### 10.2 In-App Notifications

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/users/:userId/notifications` | List in-app notifications (paginated) | Authenticated (self) | FR-72 |
| PUT | `/api/users/:userId/notifications/:notificationId/read` | Mark notification as read | Authenticated (self) | FR-72 |
| PUT | `/api/users/:userId/notifications/read-all` | Mark all as read | Authenticated (self) | FR-72 |
| GET | `/api/users/:userId/notifications/unread-count` | Get unread count for badge | Authenticated (self) | FR-72 |

### 10.3 Notification Dispatch (Internal)

These are not consumer-facing API endpoints but internal service interfaces:
- `dispatch(event_type, trip_id, user_ids[], payload)` -- sends via configured channels
- Critical events: invite, vote_deadline, booking_window_open, booking_confirmation, swap_suggestion, fee_event, score_reminder, photo_approval_request, microsite_publish
- Time-sensitive events trigger SMS when user has opted in

### 10.4 Booking Window Alerts

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| POST | `/api/trips/:tripId/booking-requests/:requestId/subscribe-alert` | Subscribe to booking window open alert | Trip member | FR-30 |
| DELETE | `/api/trips/:tripId/booking-requests/:requestId/subscribe-alert` | Unsubscribe from alert | Trip member | FR-30 |

**Endpoint count**: ~8

---

## 11. Admin / Operations Service

**Serves**: FR-4, FR-16, FR-22, FR-67, FR-75, FR-76, FR-77, FR-78, FR-79

All endpoints require admin or concierge role authentication, served on a **separate internal API surface** (`/admin/api/...`).

### 11.1 Course Curation

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/admin/api/courses` | List/search courses with admin filters | Admin | FR-75 |
| GET | `/admin/api/courses/:courseId` | Get full course record (including internal fields) | Admin | FR-75 |
| PUT | `/admin/api/courses/:courseId` | Update course record (access classification, amenities, etc.) | Admin | FR-75 |
| POST | `/admin/api/courses` | Create a new course record | Admin | FR-75 |
| PUT | `/admin/api/courses/:courseId/access-classification` | Classify/reclassify course access type | Admin | FR-75 |
| PUT | `/admin/api/courses/:courseId/booking-rules` | Update booking rules (window, cancellation, max players) | Admin | FR-29, FR-75 |
| PUT | `/admin/api/courses/:courseId/quality-scores` | Update editorial/external scores | Admin | FR-22, FR-75 |
| GET | `/admin/api/courses/reports` | List user-submitted course reports | Admin | FR-16, FR-75 |
| PUT | `/admin/api/courses/reports/:reportId` | Resolve a course report | Admin | FR-16, FR-75 |

### 11.2 Concierge Booking Operations

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/admin/api/booking-requests` | List all pending booking requests (sortable by urgency) | Concierge | FR-76 |
| GET | `/admin/api/booking-requests/:requestId` | Get booking request detail with trip context | Concierge | FR-76 |
| PUT | `/admin/api/booking-requests/:requestId/assign` | Assign request to a concierge | Concierge | FR-76 |
| POST | `/admin/api/booking-requests/:requestId/notes` | Add concierge notes | Concierge | FR-76 |
| PUT | `/admin/api/booking-requests/:requestId/status` | Update booking request status | Concierge | FR-76 |
| POST | `/admin/api/booking-requests/:requestId/confirmation` | Attach booking confirmation to a request | Concierge | FR-76 |
| GET | `/admin/api/booking-requests/escalated` | List escalated requests (unassigned > 4 hours) | Concierge | FR-76 |

### 11.3 Membership Verification

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/admin/api/memberships/pending` | List memberships pending verification | Admin | FR-4, FR-77 |
| PUT | `/admin/api/memberships/:membershipId/verify` | Approve or reject a membership claim | Admin | FR-4, FR-77 |
| PUT | `/admin/api/memberships/:membershipId/override` | Override entitlement | Admin | FR-77 |

### 11.4 Content Moderation

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/admin/api/moderation/photos` | List flagged or reported photos | Admin | FR-78 |
| DELETE | `/admin/api/moderation/photos/:photoId` | Remove a photo | Admin | FR-78 |
| POST | `/admin/api/moderation/microsites/:tripId/unpublish` | Unpublish a microsite | Admin | FR-78 |
| GET | `/admin/api/moderation/tickets` | List support tickets | Admin | FR-78 |
| PUT | `/admin/api/moderation/tickets/:ticketId` | Respond to / resolve a ticket | Admin | FR-78 |

### 11.5 System Configuration

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/admin/api/config/fee-schedules` | Get current fee schedules | Admin | FR-67, FR-79 |
| PUT | `/admin/api/config/fee-schedules` | Update fee schedules (flat, percentage, caps) | Admin | FR-67, FR-79 |
| GET | `/admin/api/config/swap-policies` | Get system-wide default swap policy settings | Admin | FR-79 |
| PUT | `/admin/api/config/swap-policies` | Update default swap policy settings | Admin | FR-79 |
| GET | `/admin/api/config/feature-flags` | Get feature flags | Admin | FR-79 |
| PUT | `/admin/api/config/feature-flags` | Update feature flags | Admin | FR-79 |
| GET | `/admin/api/config/thresholds` | Get configurable thresholds (swap quality %, cost delta, etc.) | Admin | FR-79 |
| PUT | `/admin/api/config/thresholds` | Update thresholds | Admin | FR-79 |

### 11.6 Admin Dashboard

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/admin/api/dashboard/stats` | Overview stats (trips, bookings, revenue) | Admin | FR-75 |
| GET | `/admin/api/dashboard/alerts` | System alerts (escalated bookings, reports, etc.) | Admin | FR-76 |

**Endpoint count**: ~28

---

## 12. Trip History and Series (Cross-Service)

**Serves**: FR-63, FR-64, FR-65, FR-66

| Method | Path | Description | Auth | FRs |
|--------|------|-------------|------|-----|
| GET | `/api/trips/:tripId/archive` | Get archived trip (read-only, full data) | Trip member | FR-63 |
| POST | `/api/trips/:tripId/archive` | Transition trip to archived state | Captain or system | FR-63 |
| POST | `/api/trip-series` | Create a recurring trip series | Authenticated | FR-64 |
| GET | `/api/trip-series/:seriesId` | Get series with linked trips | Series member | FR-64 |
| PUT | `/api/trip-series/:seriesId` | Update series metadata | Series creator | FR-64 |
| POST | `/api/trip-series/:seriesId/link-trip` | Link a trip to a series | Captain of the trip | FR-64 |
| GET | `/api/trip-series/:seriesId/leaderboard` | Cross-year leaderboard for a series | Series member | FR-65 |

**Endpoint count**: ~7

---

## Summary: Endpoint Count per Service

| # | Service | Consumer Endpoints | Admin Endpoints | WebSocket | Total |
|---|---------|-------------------|-----------------|-----------|-------|
| 1 | Identity and Profile | 14 | -- | -- | 14 |
| 2 | Trip and Collaboration | 24 | -- | -- | 24 |
| 3 | Discovery and Scoring | 13 | -- | -- | 13 |
| 4 | Booking Orchestration | 18 | -- | 1 | 19 |
| 5 | Optimization | 9 | -- | -- | 9 |
| 6 | Travel Add-On | 10 | -- | -- | 10 |
| 7 | Rounds, Games, Betting | 27 | -- | 1 | 28 |
| 8 | Media and Microsite | 18 | -- | -- | 18 |
| 9 | Billing | 18 | -- | -- | 18 |
| 10 | Notification | 8 | -- | -- | 8 |
| 11 | Admin / Operations | -- | 28 | -- | 28 |
| 12 | Trip History (cross-svc) | 7 | -- | -- | 7 |
| | **TOTAL** | **166** | **28** | **2** | **196** |

---

## Cross-Service Dependencies

### Dependency Matrix

| Calling Service | Depends On |
|----------------|------------|
| **Trip & Collaboration** | Identity (member lookup), Discovery (shortlist generation), Notification (state changes) |
| **Discovery & Scoring** | Identity (membership entitlements for access filtering), Trip (trip context for trip-fit scoring) |
| **Booking Orchestration** | Discovery (course rules), Trip (member list, captain), Billing (fee disclosure/capture), Notification (confirmations, window alerts), Admin/Ops (concierge assignment) |
| **Optimization** | Booking (current reservations), Discovery (alternative courses, scoring), Trip (constraints, swap policy, freeze date), Billing (cost delta), Notification (swap suggestions) |
| **Travel Add-On** | Trip (dates, anchor, members), Notification (itinerary changes) |
| **Rounds, Games, Betting** | Trip (member list, round-trip linking), Billing (bet fees), Notification (score reminders, bet proposals) |
| **Media & Microsite** | Trip (member list), Identity (user names/profiles), Notification (consent requests, publish events) |
| **Billing** | Trip (trip membership for per-golfer calculations), Rounds/Betting (bet states for fee eligibility), Booking (reservation states for fee triggers) |
| **Notification** | Identity (user preferences, contact info), all services (event sources) |
| **Admin / Operations** | Discovery (course CRUD), Booking (request management), Identity (membership verification), Billing (fee configuration), Media (moderation) |

### Critical Cross-Service Flows

1. **Booking Flow**: Trip -> Booking -> Discovery (rules) -> Billing (fee disclosure) -> Notification (confirmation) -> Admin/Ops (assisted fallback)
2. **Optimization Flow**: Optimization -> Discovery (alternatives) -> Booking (current reservation) -> Trip (constraints) -> Billing (cost impact) -> Notification (suggestion)
3. **Score-to-Settlement Flow**: Rounds -> Betting (outcomes) -> Billing (fees + ledger) -> Notification (settlement reminders)
4. **Photo-to-Microsite Flow**: Media (upload) -> Media (consent/veto) -> Notification (approval requests) -> Media (microsite publish)

---

## Real-Time / WebSocket Requirements

### WebSocket Channels

| Channel | Path | Purpose | FRs | Events |
|---------|------|---------|-----|--------|
| Booking Room | `/ws/trips/:tripId/booking-room` | Live booking status during booking window | FR-32 | `slot_status_changed`, `hold_acquired`, `hold_released`, `booking_confirmed`, `booking_failed`, `countdown_tick`, `fallback_triggered` |
| Live Round | `/ws/trips/:tripId/rounds/:roundId/live` | Real-time score updates during play | FR-51 | `score_entered`, `score_updated`, `discrepancy_detected`, `discrepancy_resolved`, `bet_proposed`, `bet_accepted`, `game_standing_updated` |

### Server-Sent Events (SSE) Candidates

| Channel | Purpose | FRs |
|---------|---------|-----|
| Trip Activity Feed | Push new activity items without polling | FR-74 |
| Notification Stream | Push notifications in real time | FR-72 |
| Booking Window Countdown | Timer updates for approaching booking windows | FR-30 |

### Offline / Sync Considerations (FR-51)

- Score entry must work offline on mobile browsers
- Client-side local storage (IndexedDB or localStorage) for scores
- Sync protocol: client sends entries with `client_timestamp`, server resolves conflicts via last-write-wins
- Sync endpoint: `POST /api/trips/:tripId/rounds/:roundId/scores/sync` (batch upsert with conflict resolution)

---

## External API Integrations

| Category | Candidates | Integration Type | Used By Service | FRs |
|----------|-----------|-----------------|-----------------|-----|
| Airport / Geocoding | Google Maps Geocoding, HERE, Mapbox | REST API | Discovery | FR-11 |
| Maps / Drive Time | Google Maps Directions, Mapbox, HERE | REST API | Discovery, Optimization | FR-12, FR-37, FR-40 |
| Course Data | NGF Database, Golf Course API | REST API / Data Import | Discovery, Admin | FR-14, FR-29 |
| Tee-Time Aggregator | GolfNow API, Supreme Golf API | REST API with cart-hold | Booking | FR-31, FR-32, FR-33 |
| Lodging | Airbnb API, VRBO/Expedia (affiliate) | REST API / Affiliate Links | Travel Add-On | FR-41 |
| Flights | Flight search API (TBD) | REST API / Affiliate Links | Travel Add-On | FR-42 |
| Payments | Stripe Connect | REST API + Webhooks | Billing | FR-67, FR-68 |
| Email | SendGrid, Postmark, SES | REST API | Notification | FR-72 |
| SMS | Twilio, AWS SNS | REST API | Notification | FR-72 |
| P2P Settlement | Venmo, Zelle, PayPal, Cash App | Deep Link URLs (no API) | Billing | FR-82 |
| Object Storage | AWS S3 / Compatible | SDK | Media | FR-57 |
| CDN | CloudFront / CloudFlare | Configuration | Media | FR-60 |

---

## Webhook / Callback Patterns

### Inbound Webhooks (External -> Our System)

| Source | Webhook Event | Handler | Purpose |
|--------|--------------|---------|---------|
| Stripe | `payment_intent.succeeded` | Billing Service | Confirm fee payment |
| Stripe | `payment_intent.failed` | Billing Service | Handle payment failure |
| Stripe | `charge.refunded` | Billing Service | Update refund status |
| Tee-Time Aggregator | `booking.confirmed` | Booking Service | External booking confirmation |
| Tee-Time Aggregator | `booking.canceled` | Booking Service | External cancellation notice |
| Tee-Time Aggregator | `hold.expired` | Booking Service | Cart hold expiration |

### Internal Event Bus

| Event | Producer | Consumer(s) |
|-------|----------|-------------|
| `trip.state_changed` | Trip Service | Notification, Booking, Optimization |
| `booking.confirmed` | Booking Service | Trip, Billing, Notification, Optimization |
| `booking.canceled` | Booking Service | Billing, Notification, Optimization |
| `reservation.cancellation_threshold_crossed` | Booking Service (scheduled) | Billing (fee capture) |
| `swap.suggested` | Optimization Service | Notification |
| `swap.approved` | Optimization Service | Booking, Notification |
| `bet.accepted` | Rounds/Betting Service | Billing (fee calculation) |
| `bet.resolved` | Rounds/Betting Service | Billing, Notification |
| `round.completed` | Rounds Service | Billing, Notification |
| `photo.nominated` | Media Service | Notification (consent requests) |
| `photo.vetoed` | Media Service | Media (update publish state) |
| `microsite.published` | Media Service | Notification |
| `vote.cast` | Trip Service | Notification |
| `vote.deadline_reached` | Trip Service (scheduled) | Notification |
| `booking_window.opening_soon` | Booking Service (scheduled) | Notification |
| `expense.logged` | Billing Service | Notification |
| `membership.verification_requested` | Identity Service | Admin/Ops |

---

## Admin vs Consumer API Separation

| Aspect | Consumer API | Admin API |
|--------|-------------|-----------|
| Base path | `/api/...` | `/admin/api/...` |
| Authentication | JWT/session tokens from consumer auth | Separate admin auth (possibly SSO) |
| Network access | Public internet | Restricted (VPN, IP allowlist, or internal network) |
| Rate limiting | Per-user, per-IP limits | Per-admin limits (more generous) |
| Audit logging | Standard | Enhanced (all write operations logged) |
| Error responses | User-friendly messages | Detailed technical information |

---

## FR-to-Endpoint Coverage Matrix

| FR | Service | Endpoint(s) |
|----|---------|-------------|
| FR-1 | Identity | `/api/auth/*` |
| FR-2 | Identity | `/api/users/:userId` GET/PUT |
| FR-3 | Identity | `/api/users/:userId/memberships` CRUD |
| FR-4 | Admin | `/admin/api/memberships/*/verify` |
| FR-5 | Identity | `/api/auth/me`, role checks on all endpoints |
| FR-6 | Trip | `/api/trips` POST/GET/PUT |
| FR-7 | Trip | `/api/trips/:tripId/invites` CRUD, share-link |
| FR-8 | Trip | `/api/trips/:tripId/members`, role transfer |
| FR-9 | Trip | `/api/trips/:tripId/members/:userId/constraints` |
| FR-10 | Trip | `/api/trips/:tripId/state` |
| FR-11 | Discovery | `/api/search/courses`, resolve-location, suggestions |
| FR-12 | Discovery | `/api/search/courses` (filter params) |
| FR-13 | Discovery | `/api/search/courses` (access filtering logic) |
| FR-14 | Discovery | `/api/search/courses` (card data), `/api/courses/:courseId` |
| FR-15 | Discovery | `/api/trips/:tripId/search-presets` |
| FR-16 | Discovery + Admin | `/api/courses/:courseId/report`, `/admin/api/courses/reports` |
| FR-17 | Discovery | `/api/courses/:courseId/reviews`, `/api/courses/:courseId/quality` |
| FR-18 | Discovery | `/api/courses/:courseId/quality` |
| FR-19 | Discovery | `/api/courses/:courseId/reviews` POST |
| FR-20 | Discovery | `/api/courses/:courseId/trip-fit/:tripId` |
| FR-21 | Discovery | `/api/courses/:courseId/quality` (value scoring) |
| FR-22 | Admin | `/admin/api/courses/:courseId/quality-scores` |
| FR-23 | Trip | `/api/trips/:tripId/options` CRUD, generate |
| FR-24 | Trip | `/api/trips/:tripId/options/:optionId/votes` |
| FR-25 | Trip | `/api/trips/:tripId/options/:optionId` (cost display) |
| FR-26 | Discovery + Trip | Trip-fit with constraint filtering |
| FR-27 | Trip | `/api/trips/:tripId/options/:optionId/override` |
| FR-28 | Trip | `/api/trips/:tripId/voting-mode` |
| FR-29 | Booking + Admin | `/api/courses/:courseId/booking-rules`, admin updates |
| FR-30 | Booking + Notification | `/api/trips/:tripId/booking-requests`, alert subscription |
| FR-31 | Booking | Booking request (split plan) |
| FR-32 | Booking | `/api/trips/:tripId/booking-room/*`, WebSocket |
| FR-33 | Booking | Booking room slots, mode display |
| FR-34 | Billing + Booking | `/api/billing/fee-estimate`, confirmation step |
| FR-35 | Optimization | Freeze date, background job |
| FR-36 | Optimization + Booking | Safe-swap logic, reservation cancellation |
| FR-37 | Optimization | Swap suggestions |
| FR-38 | Optimization | Swap policy |
| FR-39 | Optimization | Rebooking timeline |
| FR-40 | Optimization | Background scoring (airport proximity) |
| FR-41 | Travel | Lodging search |
| FR-42 | Travel | Flight search |
| FR-43 | Billing + Travel | Fee configuration for lodging/air |
| FR-44 | Booking | External bookings CRUD |
| FR-45 | Travel | Itinerary |
| FR-46 | -- | Out of scope for v1 |
| FR-47 | Travel | Itinerary |
| FR-48 | Travel + Booking | Itinerary detail with reservation data |
| FR-49 | Travel | Itinerary items CRUD |
| FR-50 | Notification + Travel | Itinerary change notifications |
| FR-51 | Rounds | Rounds, scores, discrepancies, WebSocket |
| FR-52 | Rounds | Games CRUD |
| FR-53 | Rounds | Bets CRUD, accept/decline |
| FR-54 | Rounds | Bet ledger, settlement |
| FR-55 | Rounds | Bet creation with custom name/notes |
| FR-56 | Rounds + Identity | Golf stats |
| FR-57 | Media | Photos CRUD |
| FR-58 | Media | Photo consent, nominate |
| FR-59 | Media | Photo tags |
| FR-60 | Media | Microsite, `/api/recaps/:slug` |
| FR-61 | Media | Photo takedown |
| FR-62 | Media | Photo audit log |
| FR-63 | Trip History | Archive |
| FR-64 | Trip History | Trip series CRUD |
| FR-65 | Trip History + Rounds | Series leaderboard, golf stats |
| FR-66 | -- | Post-launch (P2) |
| FR-67 | Admin + Billing | Fee schedules |
| FR-68 | Billing | Fee charge/refund logic |
| FR-69 | Billing | Bet fee logic (internal) |
| FR-70 | Billing | Fee estimate, pass-through disclosure |
| FR-71 | Billing | Fee listing, billing history |
| FR-72 | Notification | Dispatch + notifications list |
| FR-73 | Notification | Notification preferences |
| FR-74 | Trip | Activity feed |
| FR-75 | Admin | Course curation |
| FR-76 | Admin | Booking request management |
| FR-77 | Admin | Membership verification |
| FR-78 | Admin | Content moderation |
| FR-79 | Admin | System configuration |
| FR-80 | Billing | Expenses CRUD |
| FR-81 | Billing | Settlement summary |
| FR-82 | Billing | Settlement deep links |
| FR-83 | Billing | Mark settled / confirm receipt |

---

## Open Questions

1. **Aggregator API availability**: Cart-hold endpoint availability for concurrent tee-time holds is unconfirmed (PRD Section 11.3). Blocks booking room WebSocket architecture and the attempt/confirm/release endpoints. M1 spike recommended.

2. **Authentication strategy**: PRD specifies email-based auth (FR-1). Should we support OAuth providers (Google, Apple) at launch?

3. **Real-time transport**: WebSocket vs. SSE for booking room and live round. WebSocket recommended for bidirectional communication in booking room. SSE may suffice for activity feed and notification stream.

4. **API versioning**: Recommend `/api/v1/...` prefix from the start.

5. **Pagination strategy**: Cursor-based recommended for activity feed and notifications (append-heavy); offset-based acceptable for search results.

6. **File upload strategy**: Direct-to-S3 presigned URLs recommended for performance.

7. **Bet fee timing**: When exactly are bet fees calculated and charged? On acceptance, round completion, or trip completion?

8. **Captain-pays-upfront model**: Implies Billing service needs a charge-captain flow distinct from per-member fee collection.

9. **Score sync conflict resolution**: Offline-first score entry needs clear server-side conflict handling.

10. **Admin API authentication**: Same auth system with elevated roles, or completely separate identity system?

11. **PostGIS query rate limiting**: Drive-time calculations via PostGIS vs external Maps API affects performance and cost.

12. **Assisted-booking status values**: PRD Open Decision #7 blocks Booking Room API response schema.

13. **Multi-tenancy for trip data**: Row-level security or application-level tenant filtering required.

14. **Microsite SSR**: Public microsite needs server-side rendering with Open Graph metadata — may be a Next.js page route rather than pure API endpoint.
