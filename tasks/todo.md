# Golf Trip App — Master Roadmap

## M1: Planning Core (Apr 1 — May 27, 8 weeks)

### Phase 0: Project Bootstrap
- [ ] Initialize Next.js + TypeScript project
- [ ] Set up PostgreSQL + PostGIS
- [ ] Configure ESLint, Prettier, testing framework
- [ ] Set up CI pipeline
- [ ] db-architect: Initial schema design aligned to PRD §10 entities

### Phase 1: Identity & Auth (FR-1 to FR-5)
- [ ] pm-spec: Extract identity spec → `tasks/specs/identity.md`
- [ ] architect-review: Validate identity spec → `tasks/adrs/identity.md`
- [ ] db-architect: User, MembershipEntitlement tables + migrations
- [ ] identity-agent: Implement auth flow, profile, memberships
- [ ] frontend-builder: Auth components, profile UI
- [ ] test-writer: Identity acceptance criteria tests

### Phase 2: Trip Creation & Collaboration (FR-6 to FR-10)
- [ ] pm-spec: Extract trip spec
- [ ] architect-review: Validate trip spec
- [ ] db-architect: Trip, TripMember tables + state machine column
- [ ] trip-agent: Trip CRUD, invitations, captain role, state transitions
- [ ] frontend-builder: Trip home screen, invite flow
- [ ] test-writer: Trip acceptance criteria tests

### Phase 3: Course Discovery (FR-11 to FR-22)
- [ ] pm-spec: Extract discovery spec
- [ ] architect-review: Validate discovery spec
- [ ] db-architect: Course, CourseRule, CourseReview, CourseComposite tables + PostGIS indexes
- [ ] discovery-agent: Search, filters, quality model, access filtering, recommendations
- [ ] frontend-builder: Discovery screen, course cards, course detail page, map/list sync
- [ ] test-writer: Discovery acceptance criteria tests

### Phase 4: Voting & Shortlisting (FR-23 to FR-28)
- [ ] pm-spec: Extract voting spec
- [ ] architect-review: Validate voting spec
- [ ] db-architect: TripOption, Vote tables
- [ ] trip-agent: Voting logic, shortlist generation, captain override
- [ ] frontend-builder: Vote board screen
- [ ] test-writer: Voting acceptance criteria tests

### Phase 5: M1 Integration & Polish
- [ ] End-to-end flow: signup → create trip → invite → discover → shortlist → vote → converge
- [ ] Seed ≥500 U.S. courses for pilot testing
- [ ] M1 exit criteria validation: "pilot group converges on shortlist without ops help"

---

## M2: Billing Data Foundation
- [x] `src/lib/db/schema/fee-schedules.ts` — feeTypeEnum, feeCalculationMethodEnum, fee_schedules table
- [x] `src/lib/db/schema/fee-charges.ts` — feeChargeStatusEnum, fee_charges table
- [x] `src/services/billing/state-machines/fee-charge-sm.ts` — canTransition, getNextStates, validateTransition
- [x] `src/lib/validation/billing.ts` — feeEstimateSchema, updateFeeScheduleSchema, createFeeChargeSchema
- [x] `tests/unit/fee-charge-sm.test.ts` — all valid/invalid transitions, terminal states, lifecycle
- [x] `tests/unit/billing-validation.test.ts` — all three schemas with boundary tests
- [x] `src/lib/db/schema/index.ts` — barrel exports appended
- [x] `src/types/index.ts` — FeeType, FeeCalculationMethod, FeeChargeStatus types appended

## M2 Phase 2: Fee Disclosure, Endpoints, Jobs
- [x] `src/services/billing/fee-disclosure.service.ts` — computeFee (pure), calculateFeeEstimate, createFeeChargeForBooking, listTripFees
- [x] `src/app/api/billing/fee-estimate/route.ts` — POST fee estimate endpoint
- [x] `src/app/api/trips/[tripId]/fees/route.ts` — GET trip fees endpoint
- [x] `src/jobs/worker.ts` — BOOKING_ESCALATION and BOOKING_CONFIRMATION_CAPTURE handlers
- [x] `tests/unit/fee-disclosure.test.ts` — 20 tests for computeFee pure function

## M2: Concierge Admin Console (FR-76)
- [x] `src/lib/validation/admin-booking.ts` — Zod schemas (assign, note, status, confirmation)
- [x] `src/services/admin/booking-ops.service.ts` — 7 service functions (list, detail, assign, note, status, confirm, escalated)
- [x] `src/app/api/admin/booking-requests/route.ts` — GET list pending
- [x] `src/app/api/admin/booking-requests/[requestId]/route.ts` — GET detail
- [x] `src/app/api/admin/booking-requests/[requestId]/assign/route.ts` — PUT assign
- [x] `src/app/api/admin/booking-requests/[requestId]/notes/route.ts` — POST note
- [x] `src/app/api/admin/booking-requests/[requestId]/status/route.ts` — PUT status
- [x] `src/app/api/admin/booking-requests/[requestId]/confirmation/route.ts` — POST confirm (transactional)
- [x] `src/app/api/admin/booking-requests/escalated/route.ts` — GET escalated (4hr threshold)

## M2 Phase 2: Booking Services & API Routes (FR-29 to FR-34)
- [x] `src/lib/validation/booking.ts` — createBookingRequestSchema, updateBookingRequestSchema, captureExternalBookingSchema
- [x] `src/services/booking/booking-request.service.ts` — createRequest, getRequest, listRequests, updateRequest, cancelRequest, getBookingRoomState
- [x] `src/services/booking/booking-slot.service.ts` — createSlotsForRequest, updateSlotStatus, getSlotsForRequest
- [x] `src/services/booking/reservation.service.ts` — createReservation, listReservations, getReservation, cancelReservation
- [x] `src/services/booking/external-booking.service.ts` — createExternalBooking, listExternalBookings, updateExternalBooking, deleteExternalBooking
- [x] `src/services/booking/providers/assisted-booking.provider.ts` — AssistedBookingProvider (implements BookingProvider)
- [x] `src/app/api/trips/[tripId]/booking-requests/route.ts` — GET list, POST create
- [x] `src/app/api/trips/[tripId]/booking-requests/[requestId]/route.ts` — GET detail, PUT update, DELETE cancel
- [x] `src/app/api/trips/[tripId]/booking-room/route.ts` — GET booking room state
- [x] `src/app/api/trips/[tripId]/reservations/route.ts` — GET list
- [x] `src/app/api/trips/[tripId]/reservations/[reservationId]/route.ts` — GET detail
- [x] `src/app/api/trips/[tripId]/external-bookings/route.ts` — GET list, POST create
- [x] `src/app/api/trips/[tripId]/external-bookings/[bookingId]/route.ts` — PUT update, DELETE remove
- [x] `tests/unit/booking-validation.test.ts` — createBookingRequestSchema and captureExternalBookingSchema validation tests

## M2: Booking Core (May 28 — Jul 8, 6 weeks)
FR-29 to FR-34, fees, payment. Booking orchestration, tee-time coordination, party splitting, booking room, hybrid execution, reservation management.

## M3: Itinerary Service & API Routes (FR-47 to FR-50)
- [x] `src/lib/validation/itinerary.ts` — createItineraryItemSchema, updateItineraryItemSchema
- [x] `src/services/trip/itinerary.service.ts` — getCanonicalItinerary, createItem, updateItem, deleteItem
- [x] `src/app/api/trips/[tripId]/itinerary/route.ts` — GET canonical itinerary
- [x] `src/app/api/trips/[tripId]/itinerary/items/route.ts` — POST create item
- [x] `src/app/api/trips/[tripId]/itinerary/items/[itemId]/route.ts` — PUT update, DELETE item
- [x] `tests/unit/itinerary-validation.test.ts` — 33 tests for create/update schemas

## M3: Optimization Service (FR-35 to FR-40)
- [x] `src/types/index.ts` — SwapPolicy type added
- [x] `src/services/optimization/swap-constraints.ts` — SWAP_CONSTRAINTS config + 5 pure validation functions
- [x] `src/lib/validation/optimization.ts` — declineSwapSchema, updateSwapPolicySchema, updateFreezeDateSchema
- [x] `src/services/optimization/swap-suggestion.service.ts` — 9 service functions (list, get, create, approve, decline, swapPolicy CRUD, freezeDate CRUD, rebookingTimeline)
- [x] `src/app/api/trips/[tripId]/swap-suggestions/route.ts` — GET list suggestions
- [x] `src/app/api/trips/[tripId]/swap-suggestions/[suggestionId]/route.ts` — GET single suggestion
- [x] `src/app/api/trips/[tripId]/swap-suggestions/[suggestionId]/approve/route.ts` — POST approve (captain)
- [x] `src/app/api/trips/[tripId]/swap-suggestions/[suggestionId]/decline/route.ts` — POST decline (captain)
- [x] `src/app/api/trips/[tripId]/swap-policy/route.ts` — GET/PUT swap policy
- [x] `src/app/api/trips/[tripId]/rebooking-timeline/route.ts` — GET timeline
- [x] `src/app/api/trips/[tripId]/freeze-date/route.ts` — GET/PUT freeze date
- [x] `tests/unit/swap-constraints.test.ts` — 24 tests for all pure constraint functions
- [x] `tests/unit/optimization-validation.test.ts` — 22 tests for all validation schemas

## M4 Phase 3: Cost Splitting (FR-80-83) and Settlement Deep Links
- [x] `src/lib/validation/expenses.ts` — createExpenseSchema, updateExpenseSchema
- [x] `src/services/billing/expense.service.ts` — createExpense, listExpenses, getExpense, updateExpense, deleteExpense, calculateSettlement, calculateSettlementPure (pure)
- [x] `src/services/billing/settlement.service.ts` — buildDeepLinkUrl (pure), generateDeepLinks, listSettlementActions, markSettled, confirmReceipt
- [x] `src/app/api/trips/[tripId]/expenses/route.ts` — GET list, POST create (any trip member)
- [x] `src/app/api/trips/[tripId]/expenses/[expenseId]/route.ts` — PUT update, DELETE remove (creator or captain)
- [x] `src/app/api/trips/[tripId]/expenses/settlement/route.ts` — GET settlement summary
- [x] `src/app/api/trips/[tripId]/expenses/settlement/actions/route.ts` — GET list actions, POST generate deep links
- [x] `tests/unit/expense-settlement.test.ts` — 18 tests: settlement calc (equal/custom/exclude/multi/edge/fees) + deep link URLs
- [ ] Run tests and verify they pass (requires bash permission)

## M4 Phase 4: Photos, Consent, and Microsites (FR-57-62)
- [x] `src/lib/validation/media.ts` — uploadPhotoSchema, tagPhotoSchema, consentSchema, updateMicrositeSchema, visibilitySchema
- [x] `src/services/media/photo.service.ts` — uploadPhoto, listPhotos, getPhoto, deletePhoto, deletePhotoAsCaptain, getPresignedUploadUrl
- [x] `src/services/media/tagging.service.ts` — tagUsers, removeTag
- [x] `src/services/media/consent.service.ts` — nominateForPublication, submitConsent, requestTakedown, getConsentQueue, getAuditLog
- [x] `src/services/media/microsite.service.ts` — getMicrosite, createOrUpdateMicrosite, publishMicrosite, setVisibility, unpublishMicrosite, getPublicMicrosite
- [x] `src/app/api/trips/[tripId]/photos/route.ts` — GET list, POST upload
- [x] `src/app/api/trips/[tripId]/photos/[photoId]/route.ts` — GET detail, DELETE remove
- [x] `src/app/api/trips/[tripId]/photos/upload-url/route.ts` — POST get presigned URL
- [x] `src/app/api/trips/[tripId]/photos/[photoId]/tags/route.ts` — POST tag users
- [x] `src/app/api/trips/[tripId]/photos/[photoId]/tags/[userId]/route.ts` — DELETE remove tag
- [x] `src/app/api/trips/[tripId]/photos/[photoId]/nominate/route.ts` — POST nominate for publication
- [x] `src/app/api/trips/[tripId]/photos/[photoId]/consent/route.ts` — POST approve/veto
- [x] `src/app/api/trips/[tripId]/photos/[photoId]/takedown/route.ts` — POST request takedown
- [x] `src/app/api/trips/[tripId]/photos/consent-queue/route.ts` — GET pending consents
- [x] `src/app/api/trips/[tripId]/photos/audit-log/route.ts` — GET audit trail
- [x] `src/app/api/trips/[tripId]/microsite/route.ts` — GET config, PUT update content
- [x] `src/app/api/trips/[tripId]/microsite/publish/route.ts` — POST publish
- [x] `src/app/api/trips/[tripId]/microsite/visibility/route.ts` — PUT toggle visibility
- [x] `src/app/api/trips/[tripId]/microsite/unpublish/route.ts` — POST unpublish
- [x] `src/app/api/recaps/[slug]/route.ts` — GET public microsite (NO AUTH)
- [x] `tests/unit/photo-asset-sm.test.ts` — all valid/invalid photo state transitions
- [x] `tests/unit/media-validation.test.ts` — all five validation schemas
- [x] `tests/unit/consent-logic.test.ts` — consent workflow: all approved, any vetoed, partial pending

## M4 Phase 2: Rounds, Scoring, and Games (FR-51, FR-52, FR-55, FR-56)
- [x] `src/lib/validation/rounds.ts` — createRoundSchema, updateRoundSchema, batchScoreSchema, createGameSchema, createBetSchema, resolveBetSchema
- [x] `src/services/rounds/round.service.ts` — createRound, listRounds, getRound, updateRound, startRound, completeRound, finalizeRound
- [x] `src/services/rounds/score.service.ts` — batchUpsertScores, getScores, getDiscrepancies
- [x] `src/services/rounds/game.service.ts` — createGame, listGames, getGame, updateGame, calculateResults (stroke_play, best_ball, skins, nassau)
- [x] `src/services/rounds/bet.service.ts` — createBet, listBets, getBet, acceptBet, declineBet, resolveBet, voidBet, getBetLedger
- [x] `src/app/api/trips/[tripId]/rounds/route.ts` — GET list, POST create
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/route.ts` — GET detail, PUT update
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/finalize/route.ts` — POST (captain only)
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/scores/route.ts` — PUT batch upsert, GET all scores
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/scores/discrepancies/route.ts` — GET
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/games/route.ts` — GET list, POST create
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/games/[gameId]/route.ts` — GET detail, PUT update
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/games/[gameId]/results/route.ts` — GET calculated results
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/bets/route.ts` — GET list, POST create
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/bets/[betId]/route.ts` — GET detail
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/bets/[betId]/accept/route.ts` — POST accept
- [x] `src/app/api/trips/[tripId]/rounds/[roundId]/bets/[betId]/resolve/route.ts` — POST resolve (captain only)
- [x] `tests/unit/round-sm.test.ts` — round state machine transitions
- [x] `tests/unit/bet-sm.test.ts` — bet state machine transitions
- [x] `tests/unit/rounds-validation.test.ts` — all validation schemas
- [x] `tests/unit/game-results.test.ts` — game result calculations (stroke_play, best_ball, skins, nassau)

## M4: On-Trip + Recap (Aug 13 — Sep 16, 5 weeks)
Rounds, scoring, side bets, photos, consent/veto, recap microsite.

## M5: Travel Add-ons (Sep 17 — Oct 14, 4 weeks)
Lodging search, flight search, affiliate link-outs, external booking capture.

---

## Review
<!-- Post-completion notes, retrospectives, blockers encountered -->
