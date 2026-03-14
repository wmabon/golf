# Background Jobs, Scheduled Workflows, and Async Processes Map

> Comprehensive analysis derived from PRD v3 (12 March 2026).
> Covers all explicit jobs (Section 11.2) and implied async operations across all FR tables.

---

## 1. Job Catalog

### 1.1 booking-window-open-alert

- **Trigger type:** Time-window-based
- **Trigger details:** Fires when a course's booking window opens (or is about to open). Per FR-30, the dashboard must show when each target round becomes bookable. Per FR-72/FR-76, alerts are sent when a booking window opens within 24-48 hours.
- **Input data:** BookingRequest records with status=Window Pending; CourseRule.booking_window_rule; TripMember notification preferences; trip target dates.
- **Processing logic:** For each trip with targeted rounds, evaluate each CourseRule booking_window_rule against the current datetime. When a window opens (or is within the configurable alert threshold, e.g., 48h), transition BookingRequest status from "Window Pending" to a notifiable state. Determine responsible parties (assigned booker, captain, concierge).
- **Output/side effects:** Push notifications (email + in-app + SMS for opted-in users). BookingRequest status transition. Activity feed entry. If the responsible user has not subscribed to alerts, prompt them (FR-30 acceptance criteria).
- **Failure handling:** Retry notification delivery with exponential backoff. Log failures. If notification delivery fails for a time-sensitive window, escalate to ops. Idempotent -- re-running should not duplicate notifications.
- **FRs served:** FR-30, FR-72, FR-74
- **Service boundary:** Booking Orchestration Service + Notification Service
- **Priority:** P0
- **Milestone:** M2

---

### 1.2 availability-monitor

- **Trigger type:** Cron schedule (nightly) + event-driven (on booking confirmation, itinerary change)
- **Trigger details:** Per FR-35, the system continuously monitors better-fit alternatives once rounds are booked. Section 6 scope table says "nightly/event-driven re-ranking." Runs until the trip's freeze date (default T-7).
- **Input data:** Trips with status=Booking or Locked and freeze_date > now. Booked reservations. Trip geographic range, budget constraints, hard member constraints. Course inventory within range. CourseComposite scores.
- **Processing logic:** For each active trip with booked rounds: query available courses within geographic range. Compute trip-fit scores for alternatives. Compare against currently booked courses. Filter candidates that meet the 8.7.1 constraints (15% quality improvement threshold OR $25/golfer savings at equal quality). Respect the 2-suggestion-per-round maximum. Check that no previously declined course is re-suggested for the same round. Verify tee-time window stability (same calendar day, within 60 minutes). Check cancellation safety margin (48h rule).
- **Output/side effects:** Generates candidate swap suggestions stored as ReservationSwap records with approval_state=pending. Does NOT create notifications directly -- that is the swap-suggestion-notify job's responsibility.
- **Failure handling:** Retry on transient API failures (external availability checks). Log and skip courses where data is stale. Must be idempotent -- re-running should not create duplicate suggestions. Circuit breaker on external API calls.
- **FRs served:** FR-35, FR-36, FR-37, FR-40
- **Service boundary:** Optimization Service
- **Priority:** P0
- **Milestone:** M3

---

### 1.3 swap-suggestion-notify

- **Trigger type:** Event-driven (new ReservationSwap record created by availability-monitor)
- **Trigger details:** Fires when the availability-monitor creates a new swap suggestion. Per FR-38, behavior depends on captain's swap policy.
- **Input data:** ReservationSwap record. Captain swap policy setting (notify-only, captain-approval-required, auto-upgrade-within-guardrails). Trip budget constraints. Cost delta, quality delta. Captain notification preferences.
- **Processing logic:** Based on swap policy: (a) notify-only: send informational notification to captain; (b) captain-approval: send actionable notification requiring captain response; (c) auto-upgrade: if within cost ceiling ($20/golfer), auto-approve and trigger rebooking workflow; if over ceiling, fall back to captain-approval. Update ReservationSwap.approval_state accordingly.
- **Output/side effects:** Notifications to captain (email + in-app + SMS if opted in). Activity feed entry. For auto-upgrade: triggers the rebooking-execute job. ReservationSwap state transition.
- **Failure handling:** Retry notification delivery. For auto-upgrade failures, fall back to captain-approval flow. Never auto-cancel without confirmed replacement (FR-36).
- **FRs served:** FR-37, FR-38, FR-39
- **Service boundary:** Optimization Service + Notification Service
- **Priority:** P0 (FR-37), P1 (FR-38 auto-upgrade)
- **Milestone:** M3

---

### 1.4 rebooking-execute

- **Trigger type:** Event-driven (captain approves swap OR auto-upgrade triggers)
- **Trigger details:** Fires when a swap suggestion is approved (either by captain action or auto-upgrade policy).
- **Input data:** ReservationSwap record with approval_state=approved. Old Reservation details. New course availability and booking channel. Party split plan. Captain payment details.
- **Processing logic:** (1) Confirm the replacement booking first (direct API or assisted-booking request). (2) Only after replacement is confirmed, cancel the old reservation. (3) Update Reservation records. (4) Update the itinerary. (5) Record fee adjustments (refunds/new charges). (6) Log the swap in the rebooking timeline (FR-39). Must follow the safe-swap-only rule (FR-36) -- no speculative cancellations.
- **Output/side effects:** New Reservation record. Old Reservation marked canceled. FeeCharge adjustments. Itinerary update. Activity feed entry. Notifications to all trip members about the change. Rebooking timeline entry.
- **Failure handling:** If replacement booking fails, do NOT cancel old reservation. Mark ReservationSwap as failed. Notify captain of failure. Retry replacement booking with backoff. If old reservation cancellation fails after replacement is confirmed, alert ops immediately (critical failure requiring manual intervention).
- **FRs served:** FR-35, FR-36, FR-37, FR-39
- **Service boundary:** Optimization Service + Booking Orchestration Service
- **Priority:** P0
- **Milestone:** M3

---

### 1.5 fee-capture-at-cancellation-threshold

- **Trigger type:** Time-window-based (cron, evaluated periodically)
- **Trigger details:** Per FR-68, tee-time service fees are charged only on bookings that remain active past the cancellation threshold. This job evaluates whether bookings have crossed their course-specific cancellation deadline.
- **Input data:** Active Reservation records with fee_state=pending. CourseRule.cancellation_rule for each reservation. Current datetime.
- **Processing logic:** For each active reservation: check if current time has passed the cancellation threshold defined in CourseRule. If yes, transition FeeCharge.status from pending to collectible/charged. Trigger payment capture via payment processor. If the booking is canceled before the threshold, mark fee as waived.
- **Output/side effects:** FeeCharge status transitions. Payment processor charge initiated. Billing event logged. Notification to user confirming fee charge. Activity feed entry.
- **Failure handling:** Retry payment capture with backoff. If payment fails, flag for ops review. Do not block the booking -- capture the fee async. Idempotent -- must not double-charge.
- **FRs served:** FR-67, FR-68, FR-70, FR-71
- **Service boundary:** Billing Service
- **Priority:** P0
- **Milestone:** M2

---

### 1.6 bet-fee-capture

- **Trigger type:** Event-driven (round completion or bet state change)
- **Trigger details:** Per FR-69, bet fees apply only to accepted money bets with amount > $0 that are not voided before the round begins. Evaluate at round start (to filter voided bets) and at round completion (to batch and apply per-golfer caps).
- **Input data:** Bet records with state=accepted and amount > 0 for the round. Fee configuration (flat/percentage, per-golfer cap). Round status.
- **Processing logic:** When a round begins: snapshot accepted money bets eligible for fees. When a round completes: calculate fees for all eligible bets. Apply per-golfer cap. Generate batched fee summary. Create FeeCharge records. Initiate payment capture.
- **Output/side effects:** FeeCharge records created. Payment processor charges. Batched fee summary visible to users. Billing event logged.
- **Failure handling:** Retry payment capture. If capture fails, flag for ops. Zero-dollar pride bets are always excluded. Proposed/rejected/expired/voided bets must never incur fees (hard invariant).
- **FRs served:** FR-67, FR-69, FR-71
- **Service boundary:** Billing Service + Rounds/Games/Betting Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.7 microsite-asset-processing

- **Trigger type:** Event-driven (photo nominated for recap inclusion OR microsite publish initiated)
- **Trigger details:** Per Section 11.2, this covers asset processing for the microsite publish pipeline. Triggered when photos move to "Publish Eligible" state or when captain initiates microsite generation.
- **Input data:** PhotoAsset records with publish_state=Publish Eligible. Microsite configuration (selected assets, cover image, scores, winners, itinerary highlights). Trip data for content generation.
- **Processing logic:** (1) Generate optimized image variants (thumbnails, social-preview sizes, responsive sizes). (2) Generate Open Graph metadata and social preview images (FR-60). (3) Compile scores, winners, itinerary highlights into microsite payload. (4) Generate the shareable URL/slug. (5) Set visibility defaults (unlisted, noindex). (6) Store processed assets in CDN-backed object storage.
- **Output/side effects:** Processed image variants in object storage. Microsite record with public_payload populated. CDN cache populated. Microsite.publish_state updated.
- **Failure handling:** Retry image processing on transient failures. If an individual asset fails, skip it and flag for review rather than blocking the entire microsite. Log all processing steps for audit.
- **FRs served:** FR-57, FR-60, FR-62
- **Service boundary:** Media and Microsite Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.8 photo-upload-processing

- **Trigger type:** Event-driven (photo uploaded by trip member)
- **Trigger details:** When a trip member uploads a photo (FR-57), it needs async processing before it is viewable.
- **Input data:** Raw uploaded image file. Uploader user_id. Trip_id. Upload metadata (device, timestamp, geolocation if available).
- **Processing logic:** (1) Validate file type and size. (2) Strip sensitive EXIF data (GPS coords may be retained for trip context but personal device IDs removed). (3) Generate display-quality variants (thumbnail, medium, full). (4) Store originals and variants in object storage. (5) Create PhotoAsset record with publish_state=Private. (6) Scan for policy violations (optional at launch).
- **Output/side effects:** PhotoAsset record created. Image variants stored in S3-compatible storage. Photo appears in private trip album for all trip members.
- **Failure handling:** Retry upload processing. If processing fails, store original and mark as "processing" so user knows it is in progress. Alert on repeated failures.
- **FRs served:** FR-57, FR-62
- **Service boundary:** Media and Microsite Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.9 photo-veto-deadline-reminder

- **Trigger type:** Time-window-based
- **Trigger details:** Per FR-58, trip members must be able to veto photos before public publication. When photos are nominated for the recap, members need a reminder window to exercise their veto rights before the captain can publish. Implied by the consent workflow.
- **Input data:** PhotoAsset records with publish_state=Review Pending. PhotoConsent records. Tagged/all trip members who have not responded. Time since nomination.
- **Processing logic:** For photos in Review Pending state: check if all relevant members have responded. If not, after a configurable window (e.g., 24-48h), send reminder notifications. Track escalation -- if still unresponded after extended window, either auto-approve (with clear logging) or block publication until response.
- **Output/side effects:** Reminder notifications (email + in-app). PhotoConsent state updates. Activity feed entries.
- **Failure handling:** Retry notification delivery. Never auto-publish without consent workflow completion.
- **FRs served:** FR-58, FR-60, FR-62, FR-72
- **Service boundary:** Media and Microsite Service + Notification Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.10 unresolved-vote-reminder

- **Trigger type:** Time-window-based (cron or scheduled per-trip)
- **Trigger details:** Per Section 11.2 (reminder jobs for unresolved votes). When a trip is in Voting state and members have not voted, send reminders. Also relates to vote deadlines set by the captain (FR-27).
- **Input data:** Trips in Voting state. TripOption records with active votes. TripMember records with missing votes. Captain-set vote deadlines if any. Member notification preferences.
- **Processing logic:** For each trip in Voting state: identify members who have not voted on any active option. If a vote deadline is set, calculate time remaining. Send reminders at configurable intervals (e.g., 24h before deadline, 1h before deadline). If deadline expires and group is deadlocked, notify captain that override is available.
- **Output/side effects:** Reminder notifications to non-voting members. Deadline-approaching alerts. Captain notification on deadline expiry/deadlock. Activity feed entries.
- **Failure handling:** Retry notification delivery. Idempotent -- do not spam reminders.
- **FRs served:** FR-24, FR-27, FR-72, FR-74
- **Service boundary:** Trip and Collaboration Service + Notification Service
- **Priority:** P0
- **Milestone:** M1

---

### 1.11 unscored-round-reminder

- **Trigger type:** Time-window-based (fires after a round's scheduled tee time)
- **Trigger details:** Per Section 11.2 (reminder jobs for unscored rounds). After a round is expected to be complete, remind players who have not entered scores.
- **Input data:** Round records with status indicating the round date/time has passed. ScoreEntry records (or lack thereof) per player. TripMember notification preferences.
- **Processing logic:** After a round's scheduled end time (tee time + estimated round duration, e.g., 4.5 hours): check which assigned players have incomplete scorecards. Send reminders at configurable intervals. Also prompt for structured course review (FR-19) after scoring is complete.
- **Output/side effects:** Reminder notifications to players with incomplete scores. Review prompt after scoring. Activity feed entries.
- **Failure handling:** Retry notification delivery. Cap reminder frequency to avoid annoyance.
- **FRs served:** FR-51, FR-19, FR-72
- **Service boundary:** Rounds/Games/Betting Service + Notification Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.12 booking-request-escalation

- **Trigger type:** Time-window-based (cron, evaluated periodically)
- **Trigger details:** Per FR-76 and user story 4.2 (ops concierge), if a booking request has been unassigned for more than 4 hours while its booking window is open, the system should escalate with an alert.
- **Input data:** BookingRequest records with status=Requested and no assigned concierge. BookingRequest creation timestamp. CourseRule booking window status.
- **Processing logic:** For each unassigned booking request where the booking window is currently open: check if time since request creation exceeds the escalation threshold (4 hours). If yes, send escalation alert to ops lead/team. Optionally auto-assign based on concierge workload.
- **Output/side effects:** Escalation notification to ops team. Possible auto-assignment. BookingRequest flagged as escalated. Activity feed entry in ops console.
- **Failure handling:** Retry alert delivery. Log escalation events for SLA tracking.
- **FRs served:** FR-76, FR-32
- **Service boundary:** Admin/Operations Service + Notification Service
- **Priority:** P0
- **Milestone:** M2

---

### 1.13 concurrent-cart-hold-orchestrator

- **Trigger type:** Event-driven (booking attempt initiated for multi-group tee times)
- **Trigger details:** Per Section 11.3, when a group of 5-8 golfers needs back-to-back tee times, the system fires concurrent hold requests for all required slots simultaneously.
- **Input data:** BookingRequest with party_split plan. Target time ranges for each group. Aggregator API credentials. Captain payment details. Course booking channel info.
- **Processing logic:** (1) Fire concurrent hold requests for all required tee-time slots simultaneously. (2) Wait for all responses (with timeout). (3) Evaluate combined result: if all slots held, proceed to checkout within hold window (5-10 min). If any slot fails (409 Conflict), immediately release all successful holds via rollback. (4) On full success, complete checkout using captain-pays-upfront model. (5) On partial failure, notify captain with alternatives.
- **Output/side effects:** Reservation records created on success. Hold releases on failure. Captain notification with alternatives on failure. BookingRequest status updates. FeeCharge records on successful booking. Activity feed entries.
- **Failure handling:** Timeout handling for unresponsive APIs. Automatic rollback of partial holds. Rate-limit awareness (anti-bot protections). Fallback to assisted-booking when API holds are unavailable. Circuit breaker pattern for unreliable APIs. This is a critical orchestration with strict time constraints (5-10 minute hold windows).
- **FRs served:** FR-31, FR-32, FR-33, FR-34
- **Service boundary:** Booking Orchestration Service
- **Priority:** P0
- **Milestone:** M2

---

### 1.14 trip-state-transition-engine

- **Trigger type:** Event-driven (various trip lifecycle events)
- **Trigger details:** Per FR-10, the trip progresses through states: Draft -> Planning -> Voting -> Booking -> Locked -> In Progress -> Completed -> Archived. Some transitions are time-based (e.g., trip start date triggers In Progress, trip end triggers Completed).
- **Input data:** Trip record. Trip dates. Booking status. Current trip state. Time-based trigger rules.
- **Processing logic:** Evaluate conditions for state transitions: (a) Draft -> Planning: when first collaborator accepts invite or first search executed. (b) Planning -> Voting: when shortlist is generated. (c) Voting -> Booking: when option is finalized (consensus or captain override). (d) Booking -> Locked: when freeze date is reached (T-7 default). (e) Locked -> In Progress: on trip start date. (f) In Progress -> Completed: on trip end date (or manual trigger). (g) Completed -> Archived: after recap workflow completion or time-based (configurable). Log all transitions.
- **Output/side effects:** Trip.status updates. Activity feed entries for each transition. Notifications to trip members on significant transitions. Downstream job triggers (e.g., Locked state stops optimization jobs).
- **Failure handling:** State transitions must be atomic. If notification fails, the transition still completes but notification is retried. Invalid transitions are rejected and logged.
- **FRs served:** FR-10, FR-74
- **Service boundary:** Trip and Collaboration Service
- **Priority:** P0
- **Milestone:** M1 (partial), M2 (booking states), M3 (locked), M4 (in-progress, completed, archived)

---

### 1.15 optimization-freeze-enforcer

- **Trigger type:** Time-window-based (evaluates daily)
- **Trigger details:** Per FR-35, monitoring runs until the trip's freeze date (default T-7 days before travel). When freeze date arrives, optimization must stop.
- **Input data:** Trips with active optimization. Trip.date_start. Freeze date configuration (default T-7).
- **Processing logic:** For each trip with active optimization: check if freeze date has been reached. If yes: (a) Cancel any pending swap suggestions. (b) Stop the availability-monitor from generating new suggestions for this trip. (c) Transition any "Swappable" reservations to "Locked" state. (d) Notify captain that the itinerary is now locked.
- **Output/side effects:** BookingRequest status transitions to Locked. Pending ReservationSwap records canceled. Trip state may transition to Locked. Captain notification. Activity feed entry.
- **Failure handling:** Must be reliable -- failure to freeze could result in unwanted last-minute swap suggestions. Retry on failure. Alert ops if freeze enforcement fails.
- **FRs served:** FR-35, FR-37
- **Service boundary:** Optimization Service
- **Priority:** P0
- **Milestone:** M3

---

### 1.16 notification-dispatcher

- **Trigger type:** Event-driven (internal notification events from all services)
- **Trigger details:** Central notification delivery job that processes notification requests from all services and dispatches them via appropriate channels (email, in-app, SMS).
- **Input data:** Notification event payload (recipient, channel preferences, event type, template, data). User notification preferences (FR-73). Channel-specific provider credentials.
- **Processing logic:** (1) Receive notification event from internal queue. (2) Check user preferences for this event type. (3) Determine channels (email always for critical, SMS for time-sensitive if opted in, in-app always). (4) Render templates per channel. (5) Dispatch via email provider, SMS provider, or in-app notification store. (6) Track delivery status.
- **Output/side effects:** Email sent. SMS sent (if applicable). In-app notification record created. Delivery status tracked.
- **Failure handling:** Per-channel retry with exponential backoff. Dead letter queue for persistent failures. Fallback channel if primary fails (e.g., if SMS fails, ensure email is sent). Rate limiting to prevent spam. Provider failover if primary email/SMS provider is down.
- **FRs served:** FR-72, FR-73, FR-74
- **Service boundary:** Notification Service
- **Priority:** P0
- **Milestone:** M2 (critical subset), M3 (full layer)

---

### 1.17 invite-delivery

- **Trigger type:** Event-driven (trip creator sends invite)
- **Trigger details:** Per FR-7, invitations are sent via email, share link, or SMS. The delivery and tracking of invitations is an async process.
- **Input data:** Invitee email/phone. Trip details. Invite link/token. Sender info.
- **Processing logic:** (1) Generate unique invite token/link. (2) Dispatch via selected channel (email or SMS). (3) Track invite state (pending). (4) On link access, verify token and associate with user account (existing or new).
- **Output/side effects:** Email/SMS sent with invite link. TripMember record created with response_status=pending. Activity feed entry.
- **Failure handling:** Retry delivery. Track bounce/failure. Notify sender if delivery fails.
- **FRs served:** FR-7, FR-72
- **Service boundary:** Trip and Collaboration Service + Notification Service
- **Priority:** P0
- **Milestone:** M1

---

### 1.18 score-sync-reconciler

- **Trigger type:** Event-driven (connectivity restored after offline scoring)
- **Trigger details:** Per FR-51, scores saved locally during connectivity loss must sync when connectivity returns without data loss or duplication.
- **Input data:** Locally cached score entries with timestamps. Server-side ScoreEntry records. Conflict resolution rules.
- **Processing logic:** (1) Receive batch of locally cached scores from client. (2) For each entry, check for conflicts with server state (same hole, same player, different values). (3) Apply last-write-wins or flag for manual resolution. (4) Merge without duplication. (5) Recompute derived values (game outcomes, bet positions).
- **Output/side effects:** ScoreEntry records updated. Discrepancy flags set if conflicts detected. Game/bet recalculations triggered. Client sync confirmation.
- **Failure handling:** Retry sync. Never silently drop scores. Flag all conflicts for visibility. Preserve both versions until conflict is resolved.
- **FRs served:** FR-51, FR-54
- **Service boundary:** Rounds/Games/Betting Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.19 bet-settlement-reminder

- **Trigger type:** Time-window-based (fires after round completion)
- **Trigger details:** Per FR-54, the system provides settlement reminders. After a round completes and net positions are calculated, remind participants to settle.
- **Input data:** Bet records with state=accepted for completed rounds. Net position calculations. Settlement status per member pair. Member contact info for deep links.
- **Processing logic:** (1) After round completion, calculate final net positions. (2) Generate settlement summary. (3) Send initial settlement notification with deep links (Venmo, Zelle, etc. per FR-82). (4) Schedule follow-up reminders at configurable intervals if not marked as settled (FR-83).
- **Output/side effects:** Settlement summary notifications. Deep links to payment apps. Reminder notifications. Bet ledger updates.
- **Failure handling:** Retry notification delivery. Cap reminder frequency. Stop reminders once captain marks balance as settled.
- **FRs served:** FR-54, FR-82, FR-83
- **Service boundary:** Rounds/Games/Betting Service + Notification Service
- **Priority:** P0 (FR-54), P1 (FR-82/83)
- **Milestone:** M4

---

### 1.20 expense-settlement-reminder

- **Trigger type:** Time-window-based (fires after trip completion)
- **Trigger details:** Per FR-81/FR-82, the system calculates net balances across all trip expenses and provides settlement actions. Reminders continue until all balances are settled.
- **Input data:** Trip expense ledger records. Bet settlement outcomes. Net member-to-member positions. Settlement status (FR-83).
- **Processing logic:** (1) After trip completion (or on demand), calculate consolidated net positions including shared expenses and bet outcomes but excluding platform fees (which are itemized separately). (2) Generate who-owes-whom summary. (3) Send settlement notifications with pre-populated deep links. (4) Schedule follow-up reminders for unsettled balances.
- **Output/side effects:** Settlement summary. Deep-link notifications. Reminder schedule. Settlement status tracking.
- **Failure handling:** Retry notifications. Cap frequency. Stop on settlement confirmation.
- **FRs served:** FR-80, FR-81, FR-82, FR-83
- **Service boundary:** Billing Service + Notification Service
- **Priority:** P1
- **Milestone:** M4 or M5

---

### 1.21 course-composite-score-recalculator

- **Trigger type:** Event-driven (new review submitted, editorial score updated, external ranking data imported)
- **Trigger details:** Per FR-18, the composite quality model is built from editorial assessment, external ranking normalization, and price-to-quality value. Must be recalculated when any input changes.
- **Input data:** CourseReview records (community scores). Editorial scores. External ranking data. Price data. Course metadata.
- **Processing logic:** (1) Aggregate community reviews into dimensional scores. (2) Normalize external rankings. (3) Compute value score (quality vs. price). (4) Blend into composite score. (5) Recompute trip-fit scores for any active trips targeting this course.
- **Output/side effects:** CourseComposite record updated. Trip-fit scores recalculated for affected trips. May trigger availability-monitor to re-evaluate swap candidates.
- **Failure handling:** Retry on transient failures. Score updates should be eventually consistent. Queue recomputation if load is high.
- **FRs served:** FR-17, FR-18, FR-20, FR-21
- **Service boundary:** Discovery and Scoring Service
- **Priority:** P0
- **Milestone:** M1

---

### 1.22 shortlist-generation

- **Trigger type:** Event-driven (user requests shortlist, or trip transitions to shortlisting phase)
- **Trigger details:** Per FR-23, the system generates a recommended shortlist of 3-5 itinerary candidates. This may involve computationally expensive ranking and combination evaluation.
- **Input data:** Trip parameters (dates, anchor, budget, group size). Search results. CourseComposite scores. Member hard constraints (FR-9). Access eligibility. Drive-time data. Booking window availability.
- **Processing logic:** (1) Fetch eligible courses from search results. (2) Apply member constraints (budget, access). (3) Generate candidate itinerary combinations (course mixes across trip days). (4) Score each combination on trip-fit. (5) Rank and select top 3-5. (6) Estimate cost-per-golfer for each. (7) Generate rationale text for why each fits.
- **Output/side effects:** TripOption records created with estimated costs and fit scores. Trip may transition to Voting state. Activity feed entry. Notifications to members that shortlist is ready.
- **Failure handling:** Retry on transient failures. If insufficient data for ranking, fall back to simpler scoring. Flag courses with incomplete data.
- **FRs served:** FR-23, FR-25, FR-26
- **Service boundary:** Discovery and Scoring Service + Trip and Collaboration Service
- **Priority:** P0
- **Milestone:** M1

---

### 1.23 assisted-booking-request-processor

- **Trigger type:** Event-driven (booking request created for non-integrated course)
- **Trigger details:** Per FR-33, when a course does not have direct integration, the system creates an assisted-booking request. This enters the ops queue for concierge processing.
- **Input data:** BookingRequest record with mode=assisted. Course contact info. Target date, time range, party split. Trip member details.
- **Processing logic:** (1) Create ops work item in concierge console. (2) Assign priority based on booking window urgency. (3) Pre-populate booking details for concierge. (4) Set escalation timer (4h unassigned threshold per user story). (5) Track status transitions (Queued -> Attempting -> Needs Manual Action -> Confirmed/Failed).
- **Output/side effects:** Ops console work item created. Status visible in booking room. BookingRequest status transitions. If confirmed, Reservation record created with supplier_confirmation.
- **Failure handling:** Escalation at 4h if unassigned. Clear status visibility for trip members. Fallback actions surfaced in booking room.
- **FRs served:** FR-32, FR-33, FR-76
- **Service boundary:** Booking Orchestration Service + Admin/Operations Service
- **Priority:** P0
- **Milestone:** M2

---

### 1.24 itinerary-change-notifier

- **Trigger type:** Event-driven (any itinerary item created, updated, or removed)
- **Trigger details:** Per FR-50, itinerary changes should generate clear updates to affected members stating what changed, why, and whether action is needed.
- **Input data:** Changed itinerary item (reservation, lodging, flight, manual item). Change type (add/update/remove). Change details (before/after). Affected trip members.
- **Processing logic:** (1) Detect what changed (diff). (2) Determine affected members. (3) Generate human-readable change description. (4) Classify whether action is needed from any member. (5) Send notifications.
- **Output/side effects:** Notifications to affected members. Activity feed entry. Change record for audit.
- **Failure handling:** Retry notification delivery. Changes must be logged even if notification fails.
- **FRs served:** FR-50, FR-72, FR-74
- **Service boundary:** Trip and Collaboration Service + Notification Service
- **Priority:** P1
- **Milestone:** M3

---

### 1.25 trip-archival

- **Trigger type:** Event-driven (trip transitions to Completed state) or time-window-based (auto-archive after configurable period)
- **Trigger details:** Per FR-63, completed trips are archived and remain browsable. The archival process may involve data finalization and historical stat computation.
- **Input data:** Trip record in Completed state. All associated records (rounds, scores, bets, photos, microsite).
- **Processing logic:** (1) Finalize all pending scores and bet settlements. (2) Compute final trip stats (winners, score averages, bet performance). (3) Mark trip as Archived. (4) Make all data read-only. (5) Update historical/rivalry records (FR-64, FR-65). (6) Generate year-over-year stat rollups.
- **Output/side effects:** Trip.status -> Archived. Historical stat records updated. Trip data becomes read-only. Rivalry/series records updated if applicable.
- **Failure handling:** Retry stat computation. Archival should be atomic -- either all data is finalized or rollback. Alert ops on failure.
- **FRs served:** FR-63, FR-64, FR-65
- **Service boundary:** Trip and Collaboration Service + Rounds/Games/Betting Service
- **Priority:** P0 (FR-63), P1 (FR-64, FR-65)
- **Milestone:** M4

---

### 1.26 admin-review-task-creator

- **Trigger type:** Event-driven (user flags a course, membership claim submitted, photo reported)
- **Trigger details:** Per FR-16, users can flag courses as misclassified. Per FR-4/FR-77, membership verification requires admin review. Per FR-61, post-publish takedown requests need ops handling.
- **Input data:** User report (course_id, issue type, description). Membership claim (user_id, club details). Takedown request (photo_asset_id, reason).
- **Processing logic:** (1) Create admin review task in ops console. (2) Categorize by type and urgency. (3) Assign to appropriate admin queue (course curation, membership verification, content moderation). (4) Track resolution status.
- **Output/side effects:** Admin task record created. Ops console updated. Priority queue assignment.
- **Failure handling:** Retry task creation. Ensure no user report is lost.
- **FRs served:** FR-4, FR-16, FR-61, FR-77, FR-78
- **Service boundary:** Admin/Operations Service
- **Priority:** P1
- **Milestone:** M1 (FR-16), M2 (FR-4, FR-77), M4 (FR-61, FR-78)

---

### 1.27 booking-confirmation-capture

- **Trigger type:** Event-driven (concierge attaches confirmation OR direct API returns confirmation)
- **Trigger details:** Per FR-76, when a concierge attaches a booking confirmation, the trip's reservation status should update in real time. Per FR-48, confirmation details must be visible in the itinerary.
- **Input data:** Confirmation details (confirmation number, tee time, player names, booking channel). BookingRequest record. Trip and itinerary records.
- **Processing logic:** (1) Validate confirmation data. (2) Create or update Reservation record. (3) Update BookingRequest status to Booked. (4) Update itinerary with confirmation details. (5) Trigger FeeCharge creation (pending state). (6) Notify trip members. (7) Start optimization monitoring for this round (FR-35).
- **Output/side effects:** Reservation record created/updated. Itinerary updated. FeeCharge record created. Notifications sent. Optimization monitoring activated. Activity feed entry.
- **Failure handling:** Validate data integrity before writing. Retry notifications. Alert ops if data is inconsistent.
- **FRs served:** FR-48, FR-76, FR-35
- **Service boundary:** Booking Orchestration Service + Admin/Operations Service
- **Priority:** P0
- **Milestone:** M2

---

### 1.28 cancellation-deadline-monitor

- **Trigger type:** Time-window-based (cron, evaluated periodically)
- **Trigger details:** Per FR-37 and 8.7.1, swap suggestions must account for cancellation deadlines. The system must also warn when cancellation deadlines are approaching, especially for the 48-hour safety margin rule.
- **Input data:** Active Reservation records. CourseRule.cancellation_rule. Current datetime.
- **Processing logic:** (1) For each active reservation: calculate time until cancellation deadline. (2) When within the 48h safety margin: flag reservation as swap-restricted (per 8.7.1). (3) When approaching deadline: notify captain/trip members if any action is needed. (4) Track deadline passage for fee capture triggering.
- **Output/side effects:** Reservation metadata updated (swap-restricted flag). Notifications to captain about approaching deadlines. Input signal to fee-capture-at-cancellation-threshold job.
- **Failure handling:** Must be reliable -- missing a deadline notification could result in unexpected fees. Retry checks. Alert ops on failure.
- **FRs served:** FR-37 (8.7.1 cancellation safety margin), FR-68
- **Service boundary:** Booking Orchestration Service + Optimization Service
- **Priority:** P0
- **Milestone:** M2 (fee aspect), M3 (optimization aspect)

---

### 1.29 activity-feed-writer

- **Trigger type:** Event-driven (all significant state changes across all services)
- **Trigger details:** Per FR-74, every meaningful state change should be logged in the trip activity feed. This is a cross-cutting concern that consumes events from all services.
- **Input data:** Event type, actor (user or system), trip_id, timestamp, event description, related entity IDs.
- **Processing logic:** (1) Receive event from internal event bus. (2) Format into activity feed entry. (3) Write to activity feed store. (4) Ensure chronological ordering. (5) Support pagination and filtering.
- **Output/side effects:** Activity feed entries created. Trip home feed updated.
- **Failure handling:** Must be highly available -- activity feed is the user's recovery mechanism for missed notifications. Dead letter queue for failed writes. Eventual consistency acceptable but target low latency.
- **FRs served:** FR-10, FR-74
- **Service boundary:** Trip and Collaboration Service (or cross-cutting)
- **Priority:** P0
- **Milestone:** M1

---

### 1.30 score-discrepancy-detector

- **Trigger type:** Event-driven (score entry submitted or updated)
- **Trigger details:** Per FR-51, the UI must flag score discrepancies between cards. When multiple players record scores for the same golfer/hole, the system should detect mismatches.
- **Input data:** ScoreEntry records for the round. All official cards for the same golfer/hole.
- **Processing logic:** (1) On each score entry, check if another official card has a different value for the same player/hole. (2) If discrepancy found, set discrepancy_state flag on affected entries. (3) Mark derived totals and bet outcomes as provisional. (4) Notify affected players of the discrepancy.
- **Output/side effects:** ScoreEntry.discrepancy_state updated. Bet outcomes marked provisional. In-app discrepancy indicators shown. Notifications to affected players.
- **Failure handling:** Retry on write failures. Discrepancy detection must be real-time (low latency). Never silently ignore discrepancies.
- **FRs served:** FR-51, FR-54
- **Service boundary:** Rounds/Games/Betting Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.31 game-outcome-calculator

- **Trigger type:** Event-driven (score entry, score update, round completion)
- **Trigger details:** Per FR-52 and FR-54, game outcomes (stroke play, best ball, skins, Nassau) and bet settlement positions must be calculated from scores. Recalculates as scores change.
- **Input data:** Round record (format, teams). All ScoreEntry records for the round. Game template rules. Bet records with triggers. Player handicaps (for net scoring).
- **Processing logic:** (1) Apply game template rules to current scores. (2) Calculate running standings, leaders, skins allocations, Nassau positions. (3) Evaluate bet triggers against game state. (4) Calculate net positions for the bet ledger. (5) On round completion, finalize outcomes (unless discrepancies exist).
- **Output/side effects:** Game standing records updated. Bet outcome calculations. Bet ledger positions. Settlement summary (on round completion).
- **Failure handling:** Recalculation must be idempotent. If scores have discrepancies, outcomes are marked provisional. Retry on transient failures.
- **FRs served:** FR-52, FR-54, FR-56
- **Service boundary:** Rounds/Games/Betting Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.32 microsite-publish-pipeline

- **Trigger type:** Event-driven (captain initiates microsite publication)
- **Trigger details:** Per FR-60, the captain publishes the microsite. This involves final asset compilation, URL generation, and CDN deployment.
- **Input data:** Microsite record with selected assets. All PhotoConsent records (must verify all vetoes honored). Trip data (scores, winners, highlights). Visibility settings. Public promotion setting.
- **Processing logic:** (1) Verify all selected photos have passed consent workflow (no active vetoes). (2) Run final asset processing if not already done. (3) Generate static or semi-static microsite payload. (4) Deploy to CDN-backed hosting. (5) Generate shareable URL with slug. (6) Set SEO metadata (noindex unless captain enabled public promotion). (7) Generate Open Graph tags and social preview. (8) Notify trip members of publication.
- **Output/side effects:** Microsite deployed and accessible via URL. Microsite.publish_state -> Published. Notifications to trip members. Activity feed entry. Analytics event (microsite_published).
- **Failure handling:** If any selected photo fails consent verification, block publication and alert captain. Retry deployment on CDN failures. Rollback capability if post-publish issues found.
- **FRs served:** FR-60, FR-62, FR-72
- **Service boundary:** Media and Microsite Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.33 photo-takedown-processor

- **Trigger type:** Event-driven (post-publish takedown request from participant or ops)
- **Trigger details:** Per FR-61, participants can request post-publish takedown as a safety valve. Per FR-78, content moderation tools can remove photos and unpublish microsites.
- **Input data:** Takedown request (photo_asset_id or microsite_id, requestor, reason). Current publication state.
- **Processing logic:** (1) Immediately mark asset as withdrawn (PhotoAsset.publish_state -> Withdrawn). (2) Remove from active microsite. (3) Purge from CDN cache. (4) Regenerate microsite without the removed asset. (5) Log the action for audit (FR-62). (6) Notify captain and ops.
- **Output/side effects:** Photo removed from public surfaces. CDN cache purged. Microsite regenerated. Audit log entry. Notifications.
- **Failure handling:** CDN purge may have propagation delay -- log expected purge completion time. Retry purge. This is a safety-critical path -- must be reliable and fast.
- **FRs served:** FR-61, FR-62, FR-78
- **Service boundary:** Media and Microsite Service + Admin/Operations Service
- **Priority:** P1
- **Milestone:** M4

---

### 1.34 external-booking-import

- **Trigger type:** Event-driven (user submits external booking capture form)
- **Trigger details:** Per FR-44, when direct booking is unavailable, users can capture external booking details into the trip itinerary via a lightweight form.
- **Input data:** User-submitted form data (source, confirmation number, date, time, cost, booking contact, notes). Trip and itinerary context.
- **Processing logic:** (1) Validate form data. (2) Create itinerary item record. (3) If it is a golf booking, create corresponding Reservation record with mode=external. (4) Update the canonical itinerary. (5) Notify trip members of the new item.
- **Output/side effects:** Itinerary item created. Reservation record (if golf). Itinerary updated. Activity feed entry. Notifications.
- **Failure handling:** Minimal -- user-submitted data. Validate for completeness. Allow partial entries.
- **FRs served:** FR-44, FR-47
- **Service boundary:** Trip and Collaboration Service
- **Priority:** P0
- **Milestone:** M3

---

### 1.35 handicap-prompt-check

- **Trigger type:** Event-driven (user attempts to join a round with net scoring)
- **Trigger details:** Per FR-2 acceptance criteria, when a user with an empty handicap attempts to join a round that uses net scoring, they must be prompted.
- **Input data:** User profile (handicap field). Round format (net vs. gross).
- **Processing logic:** Check if round format requires handicap. If user handicap is empty, trigger a blocking prompt before round entry is allowed.
- **Output/side effects:** Prompt displayed to user. User either enters handicap (profile updated) or is prevented from joining the net-scoring round.
- **Failure handling:** This is primarily a synchronous UI check, but the profile update is an async write.
- **FRs served:** FR-2
- **Service boundary:** Identity and Profile Service + Rounds/Games/Betting Service
- **Priority:** P0
- **Milestone:** M4

---

### 1.36 course-data-import

- **Trigger type:** Cron schedule (periodic bulk import) + event-driven (admin triggers import)
- **Trigger details:** Implied by FR-75 and Section 12 -- course data must be seeded and maintained from external sources (NGF database, Golf Course API, etc.) and admin curation.
- **Input data:** External data source feeds. Admin manual entries. User-submitted corrections (FR-16).
- **Processing logic:** (1) Fetch data from external sources. (2) Normalize and validate. (3) Reconcile with existing Course records (update vs. create). (4) Compute/update access classifications. (5) Flag records needing admin review. (6) Trigger composite score recalculation for updated courses.
- **Output/side effects:** Course records created/updated. CourseRule records created/updated. Admin review tasks for flagged records. Composite score recalculations triggered.
- **Failure handling:** Partial import should not fail the entire batch. Log and skip problematic records. Alert ops on data quality issues.
- **FRs served:** FR-75, FR-14, FR-29
- **Service boundary:** Discovery and Scoring Service + Admin/Operations Service
- **Priority:** P0
- **Milestone:** M1

---

### 1.37 drive-time-calculator

- **Trigger type:** Event-driven (search executed, shortlist generated, swap suggestion evaluated)
- **Trigger details:** Per FR-12, FR-14, FR-37, and FR-40, drive time from anchor is a key filter, display field, and optimization constraint. Requires async calls to maps/route-time provider.
- **Input data:** Anchor coordinates. Course coordinates. Time of day (for traffic-aware routing, optional).
- **Processing logic:** (1) Batch drive-time calculations for search results. (2) Cache results (drive times do not change frequently). (3) Recalculate for swap suggestions (comparison of current vs. proposed drive time). (4) Factor into last-day airport proximity (FR-40).
- **Output/side effects:** Drive time values stored/cached per anchor-course pair. Search results enriched. Swap suggestion drive-time deltas computed.
- **Failure handling:** Cache stale results rather than blocking search. Retry API calls. Fall back to straight-line distance if API unavailable.
- **FRs served:** FR-12, FR-14, FR-37, FR-40
- **Service boundary:** Discovery and Scoring Service
- **Priority:** P0
- **Milestone:** M1

---

### 1.38 billing-audit-log-writer

- **Trigger type:** Event-driven (any fee charge, refund, or billing event)
- **Trigger details:** Per FR-71, billing events should be auditable by trip, user, booking, and bet.
- **Input data:** FeeCharge records. Payment processor events. Refund events.
- **Processing logic:** (1) Record every billing event with full context (trip, user, booking/bet reference, amount, status, timestamp). (2) Ensure immutable audit trail. (3) Support query by trip, user, booking, or bet.
- **Output/side effects:** Billing audit records. Queryable billing history per user.
- **Failure handling:** Billing audit writes must be durable. Use write-ahead patterns. Never lose a billing event.
- **FRs served:** FR-71
- **Service boundary:** Billing Service
- **Priority:** P1
- **Milestone:** M2

---

---

## 2. Summary Sections

### 2.1 Jobs by Trigger Type

#### Cron Schedule (periodic execution)

| Job | Schedule | Notes |
|-----|----------|-------|
| availability-monitor | Nightly (primary) | Also event-driven on booking confirmation |
| course-data-import | Periodic (daily or weekly) | External data source refresh |

#### Event-Driven (fires in response to a specific event)

| Job | Triggering Event |
|-----|-----------------|
| swap-suggestion-notify | New ReservationSwap record created |
| rebooking-execute | Swap approved by captain or auto-upgrade |
| bet-fee-capture | Round completion / bet state change |
| microsite-asset-processing | Photo nominated or microsite publish initiated |
| photo-upload-processing | Photo uploaded by trip member |
| trip-state-transition-engine | Various lifecycle events |
| notification-dispatcher | All notification events from all services |
| invite-delivery | Trip creator sends invite |
| score-sync-reconciler | Connectivity restored after offline scoring |
| activity-feed-writer | All significant state changes |
| score-discrepancy-detector | Score entry submitted or updated |
| game-outcome-calculator | Score entry, update, or round completion |
| microsite-publish-pipeline | Captain initiates publication |
| photo-takedown-processor | Takedown request from participant or ops |
| external-booking-import | User submits external booking capture |
| handicap-prompt-check | User joins net-scoring round |
| course-composite-score-recalculator | Review submitted, editorial score updated |
| shortlist-generation | User requests shortlist |
| assisted-booking-request-processor | Booking request for non-integrated course |
| booking-confirmation-capture | Concierge attaches confirmation |
| concurrent-cart-hold-orchestrator | Multi-group booking attempt initiated |
| itinerary-change-notifier | Itinerary item modified |
| admin-review-task-creator | User flags course, membership claim, takedown request |
| drive-time-calculator | Search, shortlist, swap evaluation |
| billing-audit-log-writer | Any billing event |

#### Time-Window-Based (evaluates deadlines and triggers at specific points in time)

| Job | Time Logic |
|-----|-----------|
| booking-window-open-alert | When booking window opens or approaches (48h) |
| fee-capture-at-cancellation-threshold | When booking passes cancellation deadline |
| photo-veto-deadline-reminder | Configurable window after photo nomination |
| unresolved-vote-reminder | Before/at vote deadline |
| unscored-round-reminder | After scheduled round end time |
| booking-request-escalation | 4h after unassigned request with open window |
| optimization-freeze-enforcer | At trip freeze date (T-7) |
| cancellation-deadline-monitor | Approaching and passing cancellation deadlines |
| bet-settlement-reminder | After round completion, recurring until settled |
| expense-settlement-reminder | After trip completion, recurring until settled |
| trip-archival | After trip completion (time-based trigger) |

---

### 2.2 Jobs by Service Boundary

| Service | Jobs |
|---------|------|
| **Identity and Profile Service** | handicap-prompt-check |
| **Trip and Collaboration Service** | trip-state-transition-engine, unresolved-vote-reminder, invite-delivery, activity-feed-writer, itinerary-change-notifier, external-booking-import, trip-archival |
| **Discovery and Scoring Service** | availability-monitor (partial), course-composite-score-recalculator, shortlist-generation, course-data-import, drive-time-calculator |
| **Booking Orchestration Service** | booking-window-open-alert, concurrent-cart-hold-orchestrator, assisted-booking-request-processor, booking-confirmation-capture, cancellation-deadline-monitor |
| **Optimization Service** | availability-monitor, swap-suggestion-notify, rebooking-execute, optimization-freeze-enforcer |
| **Rounds/Games/Betting Service** | bet-fee-capture, score-sync-reconciler, score-discrepancy-detector, game-outcome-calculator, unscored-round-reminder, bet-settlement-reminder |
| **Media and Microsite Service** | microsite-asset-processing, photo-upload-processing, photo-veto-deadline-reminder, microsite-publish-pipeline, photo-takedown-processor |
| **Billing Service** | fee-capture-at-cancellation-threshold, billing-audit-log-writer, expense-settlement-reminder |
| **Notification Service** | notification-dispatcher (central dispatcher, consumed by nearly all other jobs) |
| **Admin/Operations Service** | booking-request-escalation, admin-review-task-creator |

---

### 2.3 Jobs by Milestone

| Milestone | Jobs |
|-----------|------|
| **M1 - Planning Core** | unresolved-vote-reminder, invite-delivery, activity-feed-writer, course-composite-score-recalculator, shortlist-generation, course-data-import, drive-time-calculator, trip-state-transition-engine (partial), admin-review-task-creator (FR-16 subset) |
| **M2 - Booking Core** | booking-window-open-alert, fee-capture-at-cancellation-threshold, concurrent-cart-hold-orchestrator, assisted-booking-request-processor, booking-confirmation-capture, booking-request-escalation, cancellation-deadline-monitor (fee aspect), notification-dispatcher (critical subset), billing-audit-log-writer |
| **M3 - Optimization + Itinerary** | availability-monitor, swap-suggestion-notify, rebooking-execute, optimization-freeze-enforcer, cancellation-deadline-monitor (optimization aspect), itinerary-change-notifier, external-booking-import, notification-dispatcher (full layer), trip-state-transition-engine (locked state) |
| **M4 - On-Trip + Recap** | bet-fee-capture, microsite-asset-processing, photo-upload-processing, photo-veto-deadline-reminder, unscored-round-reminder, score-sync-reconciler, score-discrepancy-detector, game-outcome-calculator, microsite-publish-pipeline, photo-takedown-processor, bet-settlement-reminder, trip-archival, trip-state-transition-engine (in-progress, completed, archived) |
| **M5 - Travel Add-ons** | expense-settlement-reminder (if not in M4), handicap-prompt-check (could be M4) |

---

### 2.4 Event Bus / Queue Requirements

The following events need to be published on an internal event bus or message queue for downstream consumers:

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `trip.created` | Trip Service | activity-feed-writer |
| `trip.state_changed` | Trip Service | trip-state-transition-engine, activity-feed-writer, notification-dispatcher, optimization-freeze-enforcer |
| `trip.member_invited` | Trip Service | invite-delivery, activity-feed-writer |
| `trip.member_accepted` | Trip Service | trip-state-transition-engine, activity-feed-writer |
| `vote.cast` | Trip Service | unresolved-vote-reminder, activity-feed-writer |
| `vote.deadline_expired` | Trip Service (timer) | notification-dispatcher (captain alert) |
| `shortlist.generated` | Discovery Service | trip-state-transition-engine, notification-dispatcher, activity-feed-writer |
| `search.executed` | Discovery Service | drive-time-calculator |
| `course.updated` | Discovery Service | course-composite-score-recalculator |
| `review.submitted` | Discovery Service | course-composite-score-recalculator |
| `booking_request.created` | Booking Service | assisted-booking-request-processor, notification-dispatcher, activity-feed-writer |
| `booking_window.opened` | Booking Service (timer) | booking-window-open-alert, notification-dispatcher |
| `booking.confirmed` | Booking Service | booking-confirmation-capture, availability-monitor, fee-capture-at-cancellation-threshold, activity-feed-writer, notification-dispatcher |
| `booking.canceled` | Booking Service | fee-capture-at-cancellation-threshold, activity-feed-writer, notification-dispatcher |
| `reservation.cancellation_threshold_passed` | cancellation-deadline-monitor | fee-capture-at-cancellation-threshold |
| `reservation.cancellation_approaching` | cancellation-deadline-monitor | notification-dispatcher |
| `swap.suggested` | Optimization Service | swap-suggestion-notify, activity-feed-writer |
| `swap.approved` | Optimization Service | rebooking-execute |
| `swap.declined` | Optimization Service | availability-monitor (decline tracking) |
| `swap.completed` | rebooking-execute | itinerary-change-notifier, activity-feed-writer, notification-dispatcher |
| `itinerary.item_changed` | Trip Service | itinerary-change-notifier, notification-dispatcher |
| `round.started` | Rounds Service | bet-fee-capture (snapshot eligible bets) |
| `round.completed` | Rounds Service | game-outcome-calculator, bet-settlement-reminder, unscored-round-reminder, activity-feed-writer |
| `score.entered` | Rounds Service | score-discrepancy-detector, game-outcome-calculator |
| `score.synced` | score-sync-reconciler | score-discrepancy-detector, game-outcome-calculator |
| `bet.created` | Rounds Service | notification-dispatcher, activity-feed-writer |
| `bet.accepted` | Rounds Service | bet-fee-capture |
| `bet.voided` | Rounds Service | bet-fee-capture (exclude from fees) |
| `photo.uploaded` | Media Service | photo-upload-processing |
| `photo.nominated_for_recap` | Media Service | photo-veto-deadline-reminder, notification-dispatcher |
| `photo.vetoed` | Media Service | microsite-publish-pipeline (block), activity-feed-writer |
| `photo.takedown_requested` | Media Service | photo-takedown-processor |
| `microsite.publish_initiated` | Media Service | microsite-publish-pipeline, microsite-asset-processing |
| `microsite.published` | Media Service | notification-dispatcher, activity-feed-writer |
| `fee.charged` | Billing Service | billing-audit-log-writer, notification-dispatcher |
| `fee.refunded` | Billing Service | billing-audit-log-writer, notification-dispatcher |
| `expense.logged` | Billing Service | expense-settlement-reminder |
| `settlement.confirmed` | Billing Service | expense-settlement-reminder (stop reminders), bet-settlement-reminder (stop reminders) |
| `course.flagged` | Discovery Service | admin-review-task-creator |
| `membership.claimed` | Identity Service | admin-review-task-creator |
| `captain.transferred` | Trip Service | activity-feed-writer, notification-dispatcher |

---

### 2.5 Failure / Retry Patterns Needed

| Pattern | Jobs That Need It | Notes |
|---------|-------------------|-------|
| **Exponential backoff with jitter** | notification-dispatcher, all notification-producing jobs | Prevents thundering herd on email/SMS providers |
| **Dead letter queue (DLQ)** | notification-dispatcher, activity-feed-writer, billing-audit-log-writer | Critical events must never be silently lost |
| **Circuit breaker** | availability-monitor, concurrent-cart-hold-orchestrator, drive-time-calculator, course-data-import | External API dependency protection |
| **Idempotency keys** | fee-capture-at-cancellation-threshold, bet-fee-capture, booking-confirmation-capture, concurrent-cart-hold-orchestrator | Prevent double-charges and duplicate bookings |
| **Saga / compensating transactions** | concurrent-cart-hold-orchestrator, rebooking-execute | Multi-step orchestration with rollback on partial failure |
| **At-least-once delivery with dedup** | activity-feed-writer, billing-audit-log-writer | Ensures no event is lost while preventing duplicates |
| **Timeout with auto-rollback** | concurrent-cart-hold-orchestrator | Hold windows are 5-10 minutes; must release on timeout |
| **Poison pill isolation** | course-data-import, photo-upload-processing | Single bad record/file should not block the entire batch |

---

### 2.6 Concurrency Concerns (Jobs That Must Not Run in Parallel)

| Constraint | Jobs Affected | Reason |
|-----------|---------------|--------|
| **Per-trip optimization lock** | availability-monitor, swap-suggestion-notify, rebooking-execute | Must not generate new suggestions while a swap is being executed for the same trip. The suggestion count limit (2 per round) requires consistent state. |
| **Per-reservation fee capture lock** | fee-capture-at-cancellation-threshold, rebooking-execute | Must not capture fee on a reservation being swapped out. The old reservation's fee state must be resolved before replacement fee is created. |
| **Per-trip state transition lock** | trip-state-transition-engine | Multiple concurrent state transitions for the same trip must be serialized to prevent invalid state sequences. |
| **Per-round score/game calculation lock** | score-discrepancy-detector, game-outcome-calculator | Score updates and game recalculations for the same round must be serialized to prevent inconsistent derived state. |
| **Per-booking-request hold orchestration** | concurrent-cart-hold-orchestrator | Only one hold orchestration attempt should be active per booking request at a time to prevent double-booking. |
| **Per-course composite score recalculation** | course-composite-score-recalculator | Multiple concurrent recalculations for the same course should be coalesced, not run in parallel (last-write-wins risk). |

---

### 2.7 Time-Sensitive Jobs (Booking Windows, Hold Expirations)

| Job | Time Constraint | Consequence of Delay |
|-----|----------------|---------------------|
| **concurrent-cart-hold-orchestrator** | Must complete checkout within 5-10 minute hold window | Holds expire; group loses reserved tee times |
| **booking-window-open-alert** | Must fire within minutes of window opening | User misses booking window; course becomes unavailable |
| **cancellation-deadline-monitor** | Must detect deadline crossing accurately | Incorrect fee capture or missed optimization opportunity |
| **optimization-freeze-enforcer** | Must activate on freeze date (T-7) | Unwanted swap suggestions after freeze |
| **fee-capture-at-cancellation-threshold** | Must capture at the right moment relative to cancellation deadline | Too early = unjustified charge; too late = missed revenue |
| **booking-request-escalation** | 4-hour SLA for unassigned requests | Booking window may close without action |
| **photo-takedown-processor** | Safety-critical: must execute quickly | Embarrassing/harmful content remains public |
| **rebooking-execute** | Must confirm replacement before canceling existing (potentially within cancellation deadline) | Risk of losing existing booking without replacement |

---

### 2.8 Open Questions

1. **Availability monitoring frequency:** The PRD says "nightly/event-driven" but does not specify exact cron schedule. Should it run once per night? Multiple times? Only during booking windows? The frequency affects API rate limits and external provider costs.

2. **Hold window duration variability:** Section 11.3 assumes 5-10 minute hold windows, but this varies by aggregator. The concurrent-cart-hold-orchestrator needs configurable, per-provider timeout settings. How should the system handle providers with very short (2 min) or very long (30 min) hold windows?

3. **Notification batching vs. real-time:** Some events (score updates, game recalculations) fire frequently during a round. Should notifications be batched (e.g., every 5 minutes) or sent in real-time? Batching reduces noise but delays information.

4. **Swap suggestion generation timing:** The PRD limits suggestions to 2 per booked round per trip. Should the system space these out (e.g., one in the first half of the booking-to-freeze window, one in the second half), or generate them as soon as a qualifying alternative is found?

5. **Fee capture timing precision:** FR-68 says fees are charged on bookings "past the cancellation threshold." How is this threshold defined for courses with ambiguous or unknown cancellation policies? What is the default behavior when CourseRule.cancellation_rule is unknown?

6. **Offline score sync conflict resolution:** FR-51 mentions sync without data loss, but what happens when two players both entered scores offline for the same golfer/hole with different values? Last-write-wins may be insufficient. Does the system need a manual conflict resolution UI?

7. **Photo consent timeout:** What happens if a tagged member never responds to a veto prompt? Does the photo remain in "Review Pending" forever, blocking publication? Should there be an auto-approve timeout (with clear disclosure)?

8. **Trip archival timing:** FR-63 says completed trips are archived, but when does the transition happen? Immediately on completion? After the recap is published? After a configurable delay to allow late scoring and photo uploads?

9. **External data source refresh frequency:** Course data import frequency affects data freshness vs. API costs. Should it be daily for active markets and weekly for less active ones? How should the system handle courses that have been removed from external sources?

10. **Auto-upgrade guardrails validation:** When the captain selects auto-upgrade, the $20/golfer cost ceiling is checked. But should the system also validate that the trip's total spend does not exceed a trip-level budget ceiling? The PRD has per-member hard budget constraints (FR-9) but does not explicitly address aggregate trip spend limits in the auto-upgrade context.

11. **Assisted-booking request timeout:** The PRD mentions a 4-hour escalation for unassigned requests but does not specify a maximum total time for assisted booking resolution. What is the SLA? When should the system give up and suggest alternatives?

12. **Event bus technology choice:** The event bus requirements span from fire-and-forget (activity feed) to exactly-once (fee capture). Should this be a single message broker (e.g., Redis Streams, SQS, Kafka) or multiple systems optimized for different delivery guarantees?

13. **Cancellation deadline data quality:** Many courses may have unknown or inaccurate cancellation policies. How does the fee-capture-at-cancellation-threshold job handle courses where the cancellation rule is "unknown"? Does it default to a conservative threshold, or does it require ops to populate the rule before fees can be captured?
