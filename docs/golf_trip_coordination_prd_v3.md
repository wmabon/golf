# Product Requirements Document

**Golf Trip Coordination Web App v1.0**

*Internal build-ready document for Product, Design, and Engineering*

Date: 12 March 2026

> **Document purpose**
>
> Define a launchable web product that helps 2-8 golfers plan, book, optimize, play, and memorialize U.S. golf trips. The app must eliminate non-playable private inventory by default, improve course selection quality, resolve group decision friction, coordinate tee times, support optional travel bookings, manage in-round games and side bets, and generate a shareable post-trip microsite.
>
> This PRD intentionally translates the user's desired 'buddy trip' vibe into a professional product plan. Brand expression may be rowdy and celebratory, but the underlying workflows must remain trustworthy, consent-safe, and operationally rigorous.

| **Status**            | Build-ready draft                                                                                    |
|-----------------------|------------------------------------------------------------------------------------------------------|
| **Primary platform**  | Responsive web app                                                                                   |
| **Launch geography**  | United States only                                                                                   |
| **Primary user mode** | Equal collaborators with trip-captain override                                                       |
| **Core trip profile** | 2-8 golfers, 2-4 days, 1 x 18-hole round per day, typical target of $100-$250 per golfer per round |

# 1. Executive Summary

Golf trip planning is currently spread across group chats, search tabs, golf course websites, booking portals, payment apps, and camera rolls. That fragmentation creates three business problems and three user problems at once: users waste time deciding, users end up on bad or inaccessible courses, and the company has too few dependable monetization points.

The product proposed here is a web-based operating system for buddy golf trips. It helps a group of 2-8 golfers define a destination area, discover only playable inventory, shortlist the best course mix, resolve disagreements quickly, coordinate adjacent tee times, optionally book lodging and flights, run games and side bets during the trip, and publish a consent-safe trip recap afterward.

The core product advantage is not merely search. It is decision compression plus operational follow-through: the app should move a friend group from 'where should we even go?' to 'book it' faster than a text thread can, then keep improving the itinerary until one week before travel.

> **Launch decisions baked into this PRD**
>
> Web app first. U.S. supply only. Responsive layouts must work on laptop and phone browser.
>
> Primary collaboration model is a group of equals; deadlocks are resolved by a designated trip captain.
>
> Only public, resort-open-to-public, and semi-private-with-public-times inventory appears by default. Private-only inventory stays hidden unless the trip has a verified member sponsor or reciprocal-access path.
>
> In-app golfer reviews remain a distinct score and must never be blended into the composite editorial/external/value model shown elsewhere.
>
> Booking is a hybrid product and operations problem. Direct integrations should be used where available; automation-first assisted-booking workflows bridge the long tail of fragmented course systems, with ops intervention reserved for exceptions.
>
> Side bets and payout calculations are in scope. Custody of pooled gambling funds is not required for launch; a social bet ledger and settlement workflow is sufficient unless legal/compliance explicitly approve something deeper.

# 2. Product Vision and Brand Direction

Vision: become the easiest way for a friend group to plan, book, play, and remember an annual golf trip.

Positioning: this is not a polite country-club planner. The product tone should feel celebratory, irreverent, and socially kinetic. It should reflect the fun of a group trip without becoming sloppy in the moments that require trust, such as payments, reservations, privacy, and itinerary changes.

| **Brand dimension**     | **Direction**                                                          | **Implementation guidance**                                                                                          |
|-------------------------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Emotional tone          | Rowdy, triumphant, adult buddy-trip energy                             | Use punchy copy and moments of humor in discovery, voting, scoring, and recap surfaces.                              |
| Trust posture           | Calm and serious when money or reservations are involved               | Booking confirmations, cancellations, fees, and consent flows should feel precise and unambiguous.                   |
| Visual feel             | Premium golf utility with nightlife energy, not country-club austerity | Lean on strong typography, large cards, subtle golf greens, and selective accent color rather than novelty graphics. |
| Social layer            | The app should create lore                                             | Year-over-year stats, microsites, recap pages, and side-bet receipts should feel shareable and memorable.            |
| Music/celebrity tie-ins | Optional brand expression, never launch-blocking                       | Any named song, master recording, or artist integration must sit behind licensing and feature flags.                 |

> **Brand guardrail**
>
> The product may be irreverent, but it must not encourage unsafe behavior, non-consensual sharing, or ambiguous fee handling. A good internal rule is: fun on the surface, disciplined underneath.

# 3. Problem Statement and Opportunity

| **Problem**                                         | **Why it matters**                                                                                      | **Required response**                                                                                                                  |
|-----------------------------------------------------|---------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Playable inventory is hard to find                  | Users search by airport or destination, but public access is mixed with irrelevant private inventory.   | Support airport-code and city/region search, hide private-only courses by default, and unlock member-sponsored inventory when allowed. |
| Course quality is misread                           | Raw review averages do not reliably predict whether a course is worth a $100-$250 round.              | Build a multi-signal quality model with separate community, editorial, ranking, and value lenses.                                      |
| Each course has its own booking rules               | Lead times, authentication, party-size rules, and cancellation windows vary by course.                  | Track booking windows, capture rules per course, and coordinate human or automated booking across systems.                             |
| Groups argue about cost, destination, and ownership | Planning stalls because nobody wants the wrong trip and nobody wants to be the villain.                 | Offer shortlist recommendations, rapid voting, visible budget guardrails, and a captain override path.                                 |
| Large groups cannot easily book adjacent tee times  | A group of 5-8 often needs multiple tee times, which fragmented systems do not make easy to coordinate. | Split parties intelligently, target back-to-back windows, and provide a live booking room or assisted-booking fallback.              |
| The trip experience itself is not managed           | Scoring, games, side bets, photos, and annual bragging rights end up scattered.                         | Provide on-trip score entry, a bet ledger, photo management with consent, and durable historical records.                              |

Monetization opportunity follows naturally from the operational pain. The product can charge mandatory service fees on tee-time bookings that remain active, on accepted bets, and on optional lodging or air reservations routed through the app.

# 4. Target Users, Roles, and Jobs to Be Done

| **Role**             | **Needs**                                                                                        | **Implications for product**                                                                                           |
|----------------------|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Equal collaborator   | Wants a say in cost, destination, course quality, and schedule without doing all the admin work. | Voting must be fast, transparent, and low effort. Each collaborator should feel heard before captain override is used. |
| Trip captain         | Needs authority to break ties, confirm bookings, and manage itinerary changes.                   | Captain controls final approvals, swap policies, and publication decisions while preserving audit trails.              |
| Member sponsor       | Can unlock private or reciprocal inventory for the group through club membership.                | Profile must support membership details, willingness to sponsor, and any access notes required by the group.           |
| Operations concierge | Needs a back-office view of booking requests, rules, and open issues.                            | An internal ops console is required because golf booking is too fragmented to be fully automated at launch.            |

Primary trip shape for v1 assumptions:

- 2-8 golfers.
- 2-4 travel days.
- 1 x 18-hole round per day.
- Typical price target of $100-$250 per golfer per round.
- Alcohol and social energy are a meaningful part of the trip context, so in-round UX must be low-attention and forgiving.
- U.S.-only supply at launch.

## 4.1 Jobs to be done

- When our group starts planning a golf trip, help us narrow a destination and course mix quickly without reading dozens of sites.
- When I search around an airport or destination, only show me courses we can actually play.
- When a course is expensive, help me know whether it is truly worth the money.
- When we need multiple tee times, coordinate the split and booking windows so our group can still play together.
- When better options appear before the trip, upgrade the itinerary without losing what we already have.
- When we are on the trip, make scores, games, and side bets quick to manage even when attention is low.
- When the trip is over, give us a durable bragging-rights record and a recap page we can share.

## 4.2 User Stories

> **Convention.** Stories are listed by persona in priority order. Each follows the standard format: "As a [role], I want [capability] so that [benefit]." Edge cases and error states are called out as sub-bullets.

### Equal Collaborator

- As an **equal collaborator**, I want to receive a trip invite via text or email and see the trip's current state (dates, destination area, shortlist) immediately after accepting so that I can contribute without asking the group to catch me up.
- As an **equal collaborator**, I want to search courses near our target area and see only courses our group can actually play so that I do not waste time evaluating private inventory we cannot access.
- As an **equal collaborator**, I want to vote In, Fine, or Out on shortlisted options and attach a brief comment so that my preferences are counted without requiring a long group-chat debate.
  - Edge case: If I am the last member to vote and my vote creates a tie, the system should surface the deadlock state and prompt the captain to resolve it.
- As an **equal collaborator**, I want to see the estimated cost per golfer for every shortlisted option so that I can make budget-informed decisions without asking someone to do the math.
- As an **equal collaborator**, I want to set a hard budget maximum on my profile so that options exceeding my limit are flagged or excluded without publicly calling me out as the blocker.
- As an **equal collaborator**, I want to enter hole-by-hole scores from my phone during a round so that I do not have to transcribe a paper scorecard later.
  - Edge case: If connectivity drops mid-round, my locally saved scores should sync when connectivity returns without data loss.
- As an **equal collaborator**, I want my own official card to remain editable and for the round UI to flag score discrepancies between cards so that mistakes are obvious before side bets or bragging rights are settled.
- As an **equal collaborator**, I want to upload trip photos to the private album and later approve or veto any photo that includes me before it is published so that nothing embarrassing goes public without my consent.

### Trip Captain

- As a **trip captain**, I want to see which collaborators have and have not voted before I use my override so that I know the group had a fair chance to weigh in.
- As a **trip captain**, I want to finalize a shortlist option when the group is deadlocked or when a decision deadline I set has expired so that planning keeps moving.
  - Edge case: If I override a majority-Out option, the activity feed should log the override and the option's prior vote distribution.
- As a **trip captain**, I want to review swap suggestions side-by-side with the current booking — including cost delta, cancellation penalty, drive-time change, and quality-model delta — so that I can approve or decline with confidence.
- As a **trip captain**, I want to set the trip's swap policy (notify only, captain approval, or auto-upgrade within guardrails) so that optimization behaves the way I expect.
- As a **trip captain**, I want to review all photos flagged for public recap inclusion and have the final say on microsite publication and public promotion so that nothing goes live without my sign-off.
- As a **trip captain**, I want to transfer the captain role to another member at any time so that if I cannot manage the trip, someone else can take over.

### Member Sponsor

- As a **member sponsor**, I want to add my club memberships and reciprocal network details to my profile so that the system can unlock private courses I can access for the group.
- As a **member sponsor**, I want to specify guest-policy constraints (guest limits, call-first requirements, blackout dates) so that the system only surfaces private courses the group can realistically play.
  - Edge case: If my guest limit is fewer than the group size, the system should show a warning rather than silently including the course.
- As a **member sponsor**, I want the product to clearly label why a private course is visible (e.g., "Playable through Alex's Invited access") so that the group understands the access path.

### Operations Concierge

- As an **ops concierge**, I want to see all pending booking requests sorted by booking-window urgency so that I handle time-sensitive requests first.
- As an **ops concierge**, I want to update a course's access classification, booking rules, and cancellation policy without requiring a code deploy so that supply data stays accurate as I learn new information.
- As an **ops concierge**, I want to attach a booking confirmation (confirmation number, tee time, player names) to a reservation record so that the trip members see verified status in real time.
- As an **ops concierge**, I want to flag a booking request as requiring manual outreach (phone call, pro-shop email) and record notes so that the next concierge can pick up where I left off.
  - Edge case: If a booking request has been unassigned for more than `[ASSUMPTION — EDIT: 4 hours]` while its booking window is open, the system should escalate with an alert.

### New Invitee (First-Time User)

- As a **new invitee who does not yet have an account**, I want to accept a trip invite and create my profile in under two minutes so that I do not hold up the group.
- As a **new invitee**, I want to be prompted for my handicap and home airport during onboarding but not be blocked from joining the trip if I skip those fields so that I can contribute immediately and fill in details later.

# 5. Product Goals, Non-Goals, and Experience Principles

## 5.1 Goals

- Reduce group planning and decision time.
- Increase the percentage of booked rounds that users rate as 'worth it' for the price paid.
- Increase successful booking completion for groups that require split tee times.
- Continuously optimize booked rounds until T-7 days without creating surprise cancellations.
- Drive repeat annual use through scorekeeping, side bets, trip history, and recap sharing.
- Create predictable service-fee revenue tied to bookings and engagement.

## 5.2 Non-goals for launch

- A native mobile app.
- International course inventory.
- Universal direct integration with every course reservation system.
- In-app custody of pooled gambling funds unless legal and payments review explicitly approve it.
- A full nightlife, dining, or rideshare platform beyond simple itinerary notes or links.
- Blocking launch on celebrity/music licensing.

### 5.2.1 Non-Goal Rationale

> **Why document rationale?** Non-goals without reasoning get relitigated in every stakeholder review. The explanations below prevent repeated re-opening of settled scope decisions.

| **Non-goal** | **Rationale** |
|---|---|
| Native mobile app | Responsive web covers all primary use cases (planning on desktop, scoring on phone browser). Native development would roughly double the engineering surface area without proportional user value at the expected launch user base. Revisit after post-launch retention data confirms mobile-specific gaps. `[ASSUMPTION — EDIT]` |
| International course inventory | U.S. supply curation, access classification, and booking-rule capture are complex enough for v1. International adds regulatory variation, currency handling, time-zone logic, and data-sourcing partnerships that would delay launch by an estimated 3-4 months. `[ASSUMPTION — EDIT]` |
| Universal direct integration with every course reservation system | Golf booking is extremely fragmented — hundreds of independent systems, many without APIs. The hybrid assisted-booking model lets us launch on broad supply without waiting for integration coverage that may never reach 100%. |
| In-app custody of pooled gambling funds | Fund custody introduces payment-money-transmitter licensing, state-by-state gambling regulation, escrow accounting, and significant compliance overhead. The social ledger plus settlement-reminder approach delivers 80% of the user value at 10% of the regulatory risk. `[ASSUMPTION — EDIT]` |
| Full nightlife/dining/rideshare platform | The core value proposition is golf-trip coordination; broadening into general travel concierge dilutes focus and competes with established platforms (Yelp, Uber, OpenTable). Simple itinerary notes and link-outs cover the need without building parallel systems. |
| Blocking launch on celebrity/music licensing | Licensing negotiations are unpredictable in timeline and cost. Music and celebrity integrations are brand-expression features, not core workflow features. Feature-flagging them preserves the option without creating a critical-path dependency. |

## 5.3 Experience principles

| **Principle**                     | **Definition**                                                                                                                                     |
|-----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| Public first                      | If a course is not playable by this group, it should not clutter the default experience.                                                           |
| Signal separation                 | Community opinion, editorial judgment, outside prestige, and value should each be visible and distinct.                                            |
| Consensus fast, captain last word | The system should compress discussion into quick signals and reserve manual override for deadlocks.                                                |
| Optimize until lock               | Once a trip is booked, the platform should keep looking for better-fit golf until the user-defined freeze date, with T-7 as the default hard stop. |
| Low cognitive load on course      | Scoring, bets, and side actions should be possible in seconds with large touch targets and recoverable mistakes.                                   |
| Consent before publication        | All photos stay private by default and must survive participant veto before appearing on public recap surfaces.                                    |
| Assisted path over dead ends      | Where APIs or automation fail, the user should experience a clear assisted-booking path, not a broken promise.                                      |

# 6. Scope Summary

| **Area**       | **Launch scope (v1.0)**                                                                                       | **Later / optional**                                              |
|----------------|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| Platform       | Responsive web application                                                                                    | Native iOS/Android apps                                           |
| Discovery      | Airport code, airport name, city/region, radius, drive time, dates, budget, group size, public-access filters | Course difficulty and advanced architectural filters              |
| Access control | Public, resort-open-to-public, semi-private with public times, private only when unlocked by member sponsor   | Automated reciprocal verification for every club network          |
| Booking        | Hybrid: direct integrations where available, guided or assisted-booking workflow elsewhere                    | Deep direct integrations across the full supply base              |
| Optimization   | Nightly/event-driven re-ranking and swap suggestions until T-7                                                | Automatic self-executing swaps on broad supply coverage           |
| Travel         | Optional lodging and air discovery, partner or assisted-booking where available, itinerary import fallback    | Full OTA-grade booking depth across all lodging and air suppliers |
| On-trip        | Scorecards, supported game templates, quick side bets, payout ledger, trip timeline                           | Shot tracking, GPS, swing video, wearables                        |
| Sharing        | Private album, veto workflow, public recap microsite                                                          | Video editing and richer social publishing tools                  |

> **Critical launch assumption**
>
> Direct vacation-rental and flight booking depth may depend on external partner access. The launch plan should not depend on those approvals. The product must still be able to surface options, capture selections, track itinerary items, and monetize through whichever combination of affiliate, partner, or assisted-booking paths is actually available at launch.

## 6.1 P0 Sub-Tiering: Core vs. Launch

> **Why sub-tier?** The current P0 set spans roughly 35 requirements across 15 product areas. Treating all of them as equally launch-critical makes it difficult to sequence work, run a meaningful internal alpha, or validate the planning-to-booking funnel before investing in on-trip and post-trip features. The sub-tiers below separate what must exist for the product to function at all (P0-Core) from what must exist before general availability but can trail core by one or more milestones (P0-Launch).
>
> Straw-man assignments are based on the document's own bottom-line statement: "If the team executes only one thing exceptionally well, it should be this: convert a chaotic group chat into a booked, improving golf trip that the users trust."

### P0-Core — Required for Internal Alpha `[ASSUMPTION — EDIT]`

These requirements constitute the minimum viable planning-to-booking loop. An internal alpha group should be able to complete this end-to-end workflow before any other P0 work ships.

| **Area** | **FR IDs** | **What it covers** |
|---|---|---|
| Accounts & profiles | FR-1, FR-2, FR-3, FR-5 | Account creation, golf-relevant profile, membership records, role model |
| Trip creation & collaboration | FR-6, FR-7, FR-8, FR-10 | Trip workspace, invites, captain designation, trip states |
| Discovery & access filtering | FR-11, FR-12, FR-13, FR-14 | Place-based search, access filtering, course cards |
| Quality model (foundation) | FR-17, FR-18, FR-19 | Community score separation, composite model, structured reviews |
| Shortlisting & voting | FR-23, FR-24, FR-25, FR-27 | Recommended shortlist, fast voting, cost-per-golfer, captain override |
| Booking intelligence | FR-29, FR-30, FR-31, FR-32, FR-33, FR-34 | Booking rules, window alerts, party splitting, booking room, hybrid execution, fee disclosure |
| Itinerary | FR-47, FR-48 | Canonical itinerary, confirmation details |
| Notifications (critical subset) | FR-72, FR-74 | Critical-event notifications, activity feed |
| Admin/ops (booking support) | FR-75, FR-76, FR-79 | Course curation, concierge ops console, configurable fee schedules |
| Fees (core) | FR-67, FR-68, FR-70 | Fee configuration, tee-time service fees, pass-through cost disclosure |

### P0-Launch — Required Before General Availability `[ASSUMPTION — EDIT]`

These requirements must ship before public launch but can be built after the core planning-to-booking loop is validated with internal alpha users.

| **Area** | **FR IDs** | **What it covers** |
|---|---|---|
| Continuous optimization | FR-35, FR-36, FR-37, FR-39 | Monitoring, safe-swap-only rule, constraint-aware suggestions, rebooking timeline |
| Scoring & games | FR-51, FR-52, FR-53, FR-54 | Scorecards, game templates (stroke, best ball, skins, Nassau), quick side bets, bet ledger |
| Photos & consent | FR-57, FR-58, FR-60 | Private album, veto workflow, recap microsite |
| Itinerary continuity | FR-44 | External booking capture for non-integrated booking paths |
| Trip archive | FR-63 | Completed-trip archival and browsability |
| Betting fees | FR-69 | Bet-related fee logic |

> **How to use this table.** If the team must cut scope to hit an alpha date, items in P0-Launch can slip without breaking the core product promise. Items in P0-Core cannot. Any movement of a requirement between tiers should be reviewed by Product and Engineering leads together.

# 7. End-to-End Product Flow

| **Stage**                    | **User outcome**                                                                        | **System responsibility**                                                               |
|------------------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| 1. Profile and access setup | Users have accounts, handicaps, home airports, and optional club memberships on file.   | Persist identity, preferences, and access entitlements.                                 |
| 2. Trip creation            | A trip exists with dates, target area, budget, group size, and collaboration settings.  | Create the planning workspace and invite collaborators.                                 |
| 3. Discovery and shortlist  | The group sees only playable courses and itinerary candidates that fit the trip.        | Search, classify, score, and rank inventory.                                            |
| 4. Decision                 | The group converges on a destination/course mix or the captain decides.                 | Collect votes, surface consensus, and record overrides.                                 |
| 5. Booking                  | Tee times and optional travel get requested and confirmed.                              | Track windows, orchestrate splits, manage confirmations, and charge fees transparently. |
| 6. Optimization             | The itinerary gets better when better-fit rounds become available before the lock date. | Monitor alternatives, recommend swaps, and protect against accidental loss.             |
| 7. Trip execution           | Scores, games, bets, notes, and logistics are easy to manage during the trip.           | Provide low-friction mobile-web usage and reliable sync.                                |
| 8. Recap and archive        | The group gets a curated share page and a permanent record.                             | Run consent workflow, publish microsite, and update historical stats.                   |

Primary launch screens / surfaces:

- Marketing / landing page.
- Authentication and profile setup.
- Trip creation wizard.
- Trip home dashboard.
- Course discovery map + list.
- Course detail page.
- Shortlist / vote board.
- Booking room and reservation timeline.
- Trip itinerary view.
- In-round score and side-bet mode.
- Photo review and microsite editor.
- Personal history / rivalry / leaderboard view.
- Internal ops console for course curation and assisted-booking exceptions.

# 8. Detailed Product Requirements

## 8.1 Accounts, Profiles, and Membership Access

Users need a lightweight profile that supports collaboration, golf-specific context, and access-based inventory filtering.

| **ID** | **Requirement**                                                                                                                                      | **Acceptance / notes**                                                                       |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| FR-1   | [P0] Users can create accounts with email-based authentication and can access the product from desktop or phone browser.                           | Signup should be completable in under two minutes without mandatory long-form profile entry. |
| FR-2   | [P0] Profiles store name, email, phone (optional but recommended), handicap (optional but recommended), home airport, and preferred home location. | Handicap can be empty, but the system should prompt for it before net games are created.     |
| FR-3   | [P0] Profiles include club memberships, reciprocal networks, and a flag indicating whether the user is willing to sponsor access for the group.    | Support free-text notes such as guest limits, call-first requirements, or blackout dates.    |
| FR-4   | [P1] The product can verify or manually approve claimed access entitlements through an admin workflow.                                             | Launch may start with manual verification and admin override.                                |
| FR-5   | [P0] Role model supports collaborator, trip captain, member sponsor, admin, and concierge ops.                                                     | Captain permissions are trip-scoped, not globally attached to the user.                      |

Access rules:

- Private-member-only inventory is hidden by default.
- If a trip contains a verified sponsoring member or reciprocal-access entitlement, eligible private inventory can be surfaced with explicit labeling.
- The UI must show why a private or semi-private course is visible, for example: 'Playable through Alex's Invited access.'
- Unknown access types should default to hidden from the recommended shortlist until clarified by data or admin review.

## 8.2 Trip Creation, Collaboration, and Roles

A trip is the system-of-record workspace for planning, booking, playing, and recapping.

| **ID** | **Requirement**                                                                                                                                                                                    | **Acceptance / notes**                                                                            |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| FR-6   | [P0] Any user can create a trip with a name, target dates or date window, number of golfers, target area, and trip budget preferences.                                                           | Trip defaults should reflect the product's core trip shape: 2-8 golfers, 2-4 days, 1 round/day.   |
| FR-7   | [P0] Trip creator can invite collaborators by email, share link, or SMS-friendly copy link.                                                                                                      | Invite state must be visible: pending, accepted, declined.                                        |
| FR-8   | [P0] A trip can designate one captain; all other accepted members retain equal participation rights in planning and voting.                                                                      | Captain can be changed at any time by the current captain or trip creator; transfer takes effect immediately for future actions, is logged, and does not reassign prior payments, bookings, or liabilities. |
| FR-9   | [P1] Each trip member can set hard constraints and soft preferences, including max budget, acceptable travel window, preferred airport, and willingness to play member-sponsored private rounds. | Hard constraints should remove options from personal consideration and feed the shortlist engine. |
| FR-10  | [P0] Trip has states: Draft, Planning, Voting, Booking, Locked, In Progress, Completed, Archived.                                                                                                | State transitions must be logged and visible in an activity feed.                                 |

> **Captain override rule**
>
> The product should encourage quick consensus first. Captain override appears only when a decision deadline is reached, the group remains split, or the captain explicitly chooses to finalize an option. All overrides should be logged for transparency, but no additional approval is required once the captain commits.

## 8.3 Course Discovery, Access Filtering, and Search

Discovery must start with place and end with truly playable inventory.

| **ID** | **Requirement**                                                                                                                                                        | **Acceptance / notes**                                                                                                               |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| FR-11  | [P0] Search accepts U.S. airport codes, airport names, city/region names, and map-based area selection.                                                              | Airport-code search should prioritize IATA-style three-letter codes and fuzzy airport name matches.                                  |
| FR-12  | [P0] Filters include radius from anchor, drive time from anchor, travel dates, price band, number of golfers, access type, and public-play eligibility.              | Course difficulty is intentionally excluded from launch filters.                                                                     |
| FR-13  | [P0] Results exclude private-member-only and unknown-access courses by default.                                                                                      | If the trip has member access, unlocked private results should be clearly marked and grouped separately from ordinary public supply. |
| FR-14  | [P0] Course cards show access badge, distance, drive time, indicative price band, tee-time window information, quality signals, and a short reasons-to-play summary. | Cards should be scannable in list view and tappable to open course detail.                                                           |
| FR-15  | [P1] Results support map/list synchronization and saved search presets per trip.                                                                                     | Map interactions should not lose active filters.                                                                                     |
| FR-16  | [P1] Users can flag a course as misclassified or report 'not actually public' / 'not worth the price.'                                                               | Reports should create an admin review task.                                                                                          |

Course detail page must include:

- Access type and confidence.
- Whether public times are available and under what rules.
- Price range and any known resort or guest fees.
- Lead-time / booking-window rule.
- Cancellation policy if known.
- Group-size notes such as maximum players per tee time.
- Quality breakdown across conditioning, layout, value, pace, service, and clubhouse/bar vibe.
- Last-day airport convenience as a secondary data point where available.

## 8.4 Course Quality, Value, and Recommendation Model

The app's differentiator is not just knowing where courses are. It is knowing which ones are worth the trip and for which type of group.

| **ID** | **Requirement**                                                                                                                                                | **Acceptance / notes**                                                                        |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| FR-17  | [P0] The product maintains a separate in-app community golfer score.                                                                                         | This score is never blended into the composite non-community score displayed elsewhere.       |
| FR-18  | [P0] The product maintains a composite course quality model built from editorial assessment, external ranking normalization, and price-to-quality value.     | This model is distinct from the community score and may be used in recommendation ranking.    |
| FR-19  | [P0] Reviews captured in-app must be structured across at least six dimensions: conditioning, layout/routing, value, pace, service, and trip vibe/clubhouse. | A free-text note field should also be available.                                              |
| FR-20  | [P1] Recommendation ranking should consider trip fit: access eligibility, budget fit, travel convenience, likely availability, and course-quality model.     | A course may have strong quality but low trip fit if it is too expensive or too hard to book. |
| FR-21  | [P1] The system should label overpriced disappointments through value scoring rather than relying on raw public star averages.                               | For example: 'Premium price, mixed value signal.'                                             |
| FR-22  | [P1] Editorial and external signals should be maintainable by admin tooling.                                                                                 | Ops must be able to update scores without code changes.                                       |

> **Recommended display model**
>
> Show two top-level signals on course cards and detail pages: (1) a community golfer score from the app's own users, and (2) a product-owned trip-fit or editor/value composite. This respects the user's request to keep the app-user score separate while still giving the system a reliable recommendation backbone.

## 8.5 Shortlisting, Decisioning, and Voting

The app should help the group stop debating and start deciding.

| **ID** | **Requirement**                                                                                                                                           | **Acceptance / notes**                                                      |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| FR-23  | [P0] After search, the system can generate a recommended shortlist of itinerary candidates or course combinations, not just a long results list.        | A shortlist should usually be 3-5 options to prevent analysis paralysis.    |
| FR-24  | [P0] Voting should be faster than freeform chat: each collaborator can mark an option as In, Fine, or Out and can attach a budget objection or comment. | Options with majority Out should sink quickly in ranking.                   |
| FR-25  | [P0] Each option should show estimated cost-per-golfer and the reasons it fits the group.                                                               | Budget clarity is mandatory because cost disagreement is a central problem. |
| FR-26  | [P1] The system should compress decisions by eliminating options that violate hard trip constraints set by multiple members.                            | Personal hard stops should be visible without publicly shaming the member.  |
| FR-27  | [P0] Captain override can finalize an option when the group is deadlocked or a deadline expires.                                                        | Override history should be visible in the trip activity feed.               |
| FR-28  | [P1] Users can switch from destination-level voting to course-level voting once a destination area is effectively chosen.                               | This supports a two-step decision pattern if needed.                        |

## 8.6 Booking Window Intelligence and Tee-Time Coordination

Booking is where most travel planning tools fail for golf. The platform must treat booking as a first-class workflow, not just a link-out.

| **ID** | **Requirement**                                                                                                                                     | **Acceptance / notes**                                                           |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| FR-29  | [P0] Each course record stores or can receive booking-window rules, party-size rules, cancellation policy, and known booking channel information. | Unknown rules must be markable and updatable by ops.                             |
| FR-30  | [P0] The trip dashboard shows when each target round becomes bookable and who is responsible for action.                                          | Users should be able to subscribe to alerts.                                     |
| FR-31  | [P0] The booking engine can split 2-8 golfers into one or more tee-time units based on course capacity and try to secure adjacent slots.          | For six golfers, two back-to-back groups of three should be a supported pattern. |
| FR-32  | [P0] A booking room coordinates attempts across users, automation, or concierge ops, showing target time ranges, assignments, live status, and fallback plans. | This is especially important for fragmented systems with separate logins.        |
| FR-33  | [P0] The app supports hybrid execution: direct booking where integrated; guided checkout or assisted-booking request where not integrated.        | The user should always know which mode applies.                                  |
| FR-34  | [P0] Service fees and pass-through costs must be disclosed before a booking is confirmed.                                                         | Fee disclosure is mandatory for trust and supportability.                        |

Booking-room behaviors:

- Countdown to booking-window open.
- Target slot plan, including acceptable tee-time gaps.
- Dynamic party split logic: 2, 3, 4, 2+2, 3+3, 4+4, 4+2, etc., depending on group size and course rules.
- Assignment of who or what is booking each slot.
- Confirmation capture and next action if only part of the block is secured.

## 8.7 Continuous Optimization and Rebooking

A defining requirement is that the system keeps searching for better golf after initial bookings exist.

| **ID** | **Requirement**                                                                                                                             | **Acceptance / notes**                                                                                                    |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| FR-35  | [P0] Once target rounds are booked, the system continues to monitor better-fit alternatives inside the trip's geographic range.           | Monitoring runs until the trip's freeze date, defaulting to seven days before travel.                                     |
| FR-36  | [P0] The system may only cancel an existing round after a better replacement has been confirmed.                                          | No speculative cancellations.                                                                                             |
| FR-37  | [P0] Swap suggestions must account for cancellation deadlines, penalties, drive time, access eligibility, cost delta, and captain policy. | A more expensive course should not be suggested if it violates hard budget rules unless the captain explicitly allows it. |
| FR-38  | [P1] The captain can choose a swap policy: notify only, captain approval required, or auto-upgrade within defined guardrails.             | Default should be captain approval required.                                                                              |
| FR-39  | [P0] Rebooking activity must be visible as a timeline with before/after state and rationale.                                              | Users should understand why the app recommended a change.                                                                 |
| FR-40  | [P1] Optimization should consider last-day airport proximity as a tie-breaker rather than a primary ranker.                               | This reflects the user's note that it is nice to have rather than core.                                                   |

> **Default swap policy recommendation**
>
> Launch with 'captain approval required' as the default. Full auto-upgrade is operationally attractive but increases trust risk if a user perceives that the app changed their trip behind their back.

### 8.7.1 Swap Suggestion Constraints

> **Why specify constraints?** Optimization features without clear behavioral boundaries tend to either annoy users (too many suggestions) or erode trust (suggestions that feel random). The constraints below define the guardrails for the v1 optimization engine.

| **Constraint** | **Rule** | **Rationale** |
|---|---|---|
| Minimum quality improvement threshold | A swap is only suggested if the replacement course's trip-fit score exceeds the current course's score by at least `[ASSUMPTION — EDIT: 15%]` on the composite model, OR if the replacement offers a cost saving of at least `[ASSUMPTION — EDIT: $25 per golfer]` at equal or higher quality. | Prevents low-value churn that makes the system feel noisy. |
| Maximum suggestion frequency | No more than `[ASSUMPTION — EDIT: 2 swap suggestions per booked round per trip]` between initial booking and freeze date. If both are declined, the system stops suggesting for that round. | Respects the captain's judgment and avoids alert fatigue. |
| Decline behavior | When a swap suggestion is declined, the system records the decline reason (if provided) and does not re-suggest the same course for the same round. The system may suggest a different course if it meets the quality threshold. | Prevents repetitive nudging on options the captain has already rejected. |
| Day and time-window stability | V1 swap suggestions must target the same calendar day and a tee-time window within `[ASSUMPTION — EDIT: 60 minutes]` of the existing reservation. Cross-day swaps are out of scope for v1. | Day changes cascade into lodging, flights, and other itinerary items — too complex for launch. |
| Cost ceiling | If the captain's swap policy is "auto-upgrade within guardrails," the system may not auto-approve any swap with a net cost increase exceeding `[ASSUMPTION — EDIT: $20 per golfer]` above the original booking. Increases above this threshold require explicit captain approval regardless of policy setting. | Prevents bill shock even when auto-upgrade is enabled. |
| Cancellation safety margin | The system must not initiate a swap if the existing reservation's cancellation deadline is within `[ASSUMPTION — EDIT: 48 hours]` unless the replacement is already confirmed and the cancellation can be executed without penalty. | Prevents the risk of losing the existing booking without a confirmed replacement. |

## 8.8 Optional Lodging and Air Travel

The product is a full itinerary planner, but golf remains the center of gravity. Travel modules should feel additive, not distracting.

| **ID** | **Requirement**                                                                                                                             | **Acceptance / notes**                                                                           |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| FR-41  | [P1] The app can surface lodging options aligned to the trip area, course cluster, dates, group size, and budget.                         | Launch may start with partner inventory, affiliate inventory, or manually curated listings.      |
| FR-42  | [P1] The app can surface optional air-travel options using participant origin airports and the trip destination.                          | Users may also record self-booked flights manually or via itinerary import.                      |
| FR-43  | [P1] Lodging and air bookings made through supported app paths can incur modest service fees, disclosed pre-booking.                      | Fee rules should be configurable in admin.                                                       |
| FR-44  | [P0] If a direct booking path is unavailable, the app must still support link-out plus lightweight itinerary capture so the trip remains centralized and complete. | Capture should be lightweight (source, confirmation number, date, time, cost, booking contact, notes) and available for golf, lodging, and air. |
| FR-45  | [P1] Lodging, flights, and golf must appear in one shared itinerary view.                                                                 | Users should not need separate tools to understand the trip.                                     |
| FR-46  | [P2] More advanced routing, split arrivals, and multi-home-airport optimization can follow after launch.                                  | Not required for v1.0.                                                                           |

## 8.9 Shared Itinerary and Logistics

| **ID** | **Requirement**                                                                                                                | **Acceptance / notes**                                                               |
|--------|--------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| FR-47  | [P0] Every trip has a canonical itinerary containing lodging, rounds, tee times, meeting points, flights, notes, and status. | The itinerary should support day-by-day grouping.                                    |
| FR-48  | [P0] Trip members can see addresses, confirmation numbers, participant assignments, and contact notes where appropriate.     | Sensitive payment details must never be displayed in full.                           |
| FR-49  | [P1] Manual itinerary items can be added for dinner plans, rental-car pickup, grocery stop, or general notes.                | This gives the product enough flexibility without becoming a general travel planner. |
| FR-50  | [P1] Itinerary changes should generate clear updates to affected members.                                                    | Change notices should state what changed, why, and whether any action is needed.     |

## 8.10 In-Round Scoring, Games, and Side Bets

The app should stay useful after booking. On-trip engagement increases retention, delight, and future-year lock-in.

| **ID** | **Requirement**                                                                                                                | **Acceptance / notes**                                                                                   |
|--------|--------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| FR-51  | [P0] Users can create rounds, assign players to teams, and record hole-by-hole scores on player-owned official cards.      | Each golfer owns an editable official card; the UI must flag discrepancies across cards and work well from a phone browser with weak connectivity. |
| FR-52  | [P0] Supported launch game templates should include at minimum stroke play, team best ball, skins, and Nassau-style scoring. | Custom game rules can be noted even if not fully automated.                                              |
| FR-53  | [P0] Users can create quick side bets in seconds with amount (including $0 pride bets), participants, trigger, and resolution state. | Large tap targets and low-text-entry flow are required for on-course use.                                |
| FR-54  | [P0] The system maintains a live bet ledger and end-of-round settlement summary.                                             | Actual custody of pooled funds is not required for launch; settlement links or reminders are acceptable. |
| FR-55  | [P1] The UI supports custom freeform side-bet names and lightweight notes to capture 'stupid bets' made during the round.    | The product should preserve the social spontaneity of the trip.                                          |
| FR-56  | [P1] Historical game and bet outcomes roll up into year-over-year stats and bragging-rights records.                         | Stats should be queryable per trip, per player, and across recurring trips.                              |

> **Launch recommendation for betting flows**
>
> Treat betting as a social ledger at launch: create bets, accept bets, calculate who owes whom, and provide one-tap settlement reminders or deep links. Do not make launch success depend on holding pooled funds or operating a real-money wallet. That can be revisited only after legal, payments, and jurisdiction review.
>
> **Pricing guardrail for bet fees**
>
> Zero-dollar pride bets are always free. Only accepted money bets can incur a fee. Proposed, rejected, expired, or voided bets must never generate a charge. To avoid a nickel-and-dime feel, bet fees should be summarized at round or trip level and subject to a visible per-golfer cap.

## 8.11 Trip Photos, Consent, and Shareable Microsites

The recap experience should turn every trip into reusable content and a growth surface, while respecting the fact that users may capture compromising or unwanted images.

| **ID** | **Requirement**                                                                                                                              | **Acceptance / notes**                                                           |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| FR-57  | [P0] Trip members can upload photos to a private trip album.                                                                               | Photos remain private by default.                                                |
| FR-58  | [P0] Before a photo is published to any public surface, trip members shown in the photo must be able to veto it.                           | A veto immediately makes the asset ineligible for public publication.            |
| FR-59  | [P1] V1 should support manual participant tagging; automated recognition can be deferred.                                                  | Manual tagging reduces launch complexity and privacy risk.                       |
| FR-60  | [P0] The app can generate a branded recap microsite with selected photos, scores, winners, itinerary highlights, and modest app promotion. | Microsite must have a shareable URL, social preview metadata, and default to unlisted/noindex unless the captain explicitly enables public promotion. |
| FR-61  | [P1] Participants should be able to request post-publish takedown as a safety valve even though pre-publish veto is the main control.      | Ops and captain tooling should support emergency removal.                        |
| FR-62  | [P1] Photo and microsite permissions must be auditable.                                                                                    | The system should preserve who approved, vetoed, published, or removed an asset. |

## 8.12 History, Rivalries, and Gamification

| **ID** | **Requirement**                                                                                                            | **Acceptance / notes**                                                              |
|--------|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| FR-63  | [P0] Completed trips are archived and remain browsable year over year.                                                   | Trip records should be immutable except for allowed admin corrections.              |
| FR-64  | [P1] The product supports recurring trip series so that annual editions of the same trip can be grouped together.        | Example: 'Pinehurst 2026' and 'Pinehurst 2027' belong to one rivalry/history track. |
| FR-65  | [P1] Historical views show wins, score averages, bet performance, captain record, and notable photo or recap highlights. | The goal is durable bragging rights rather than raw data exhaust.                   |
| FR-66  | [P2] Badge and achievement systems can follow after launch.                                                              | Not required if the archive, stats, and recap are strong enough.                    |

## 8.13 Fees, Billing, and Revenue Logic

Revenue needs to be configurable and transparent. The product should avoid hard-coding a fee schedule.

| **ID** | **Requirement**                                                                                                                                              | **Acceptance / notes**                                             |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| FR-67  | [P0] Admin can configure fee types for tee-time bookings, accepted bets, lodging bookings, and air bookings.                                               | Support flat and percentage-based fees where relevant, plus optional per-golfer caps for bet fees. |
| FR-68  | [P0] Tee-time service fees are charged only on bookings that remain active past the relevant cancellation threshold or are otherwise considered committed. | Refund or reversal behavior must be explicit.                      |
| FR-69  | [P0] Bet-related fees apply only to accepted money bets with amount greater than $0 that are not voided before the round begins.                          | Zero-dollar pride bets are always free. Proposed, rejected, expired, or voided bets do not incur fees. |
| FR-70  | [P0] External pass-through costs incurred by booking or cancellation must be shown and passed to the user where policy allows.                             | Users should never discover hidden service charges after the fact. |
| FR-71  | [P1] Billing events should be auditable by trip, user, booking, and bet.                                                                                   | Support operations and dispute resolution.                         |

### 8.13.1 Trip Cost Splitting and Reimbursement

> **Problem this addresses.** The Trip Captain typically fronts money for tee times, lodging deposits, and other shared costs, then spends days chasing reimbursement through Venmo, Zelle, or awkward text reminders. This is one of the most cited pain points in group trip planning and is not covered by the platform's own service-fee billing (Section 8.13), which handles what the *app* charges — not what *members owe each other*.

| **ID** | **Requirement** | **Acceptance / notes** |
|---|---|---|
| FR-80 | [P1] The app maintains a trip expense ledger that tracks shared costs (tee times, lodging, meals, transportation) and who paid for each. | Captain or any member can log an expense with amount, payer, category, and split method (equal, custom, or exclude specific members). |
| FR-81 | [P1] The system calculates net balances across all trip expenses and displays a clear "who owes whom" settlement summary. | Settlement summary must account for all logged shared expenses and bet outcomes to produce a clear member-to-member net position per member; platform fees remain itemized separately as obligations to the app. |
| FR-82 | [P1] The app provides one-tap settlement actions: deep links to Venmo, Zelle, PayPal, or Cash App pre-populated with the recipient and amount. | The app does not hold or transfer funds for peer-to-peer settlement at launch. It facilitates the handoff to external payment apps. `[ASSUMPTION — EDIT]` |
| FR-83 | [P1] The captain can mark a member's balance as settled, and the member can confirm receipt.  | Settlement status should be visible to all trip members for transparency. |

> **Design note.** The cost-splitting ledger is intentionally P1 rather than P0-Core. The planning-to-booking funnel works without it, and the Captain-pays-upfront model is the pragmatic v1 reality regardless (see Section 11.3 for why). However, this feature directly addresses a top user pain point and should ship before or alongside GA. It also creates a natural integration point: platform service fees, bet settlement, and shared-expense settlement can appear in one "trip finances" view while keeping "between members" balances visually distinct from "owed to the app" charges.

> **What this is NOT.** This is not an in-app payment processor or money-transmitter. The app calculates and tracks obligations; actual fund movement happens through external payment apps. This avoids the regulatory complexity of holding user funds while still solving the coordination problem. If legal and payments review later approve deeper integration (e.g., in-app payment collection via Stripe Connect), the ledger architecture should support it without redesign. `[ASSUMPTION — INVESTIGATE]`

## 8.14 Notifications and Communication

| **ID** | **Requirement**                                                                                                                                                                                            | **Acceptance / notes**                                                                                 |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| FR-72  | [P0] Critical events trigger notifications: invite, vote deadline, booking window open, booking confirmation, swap suggestion, fee event, score reminder, photo approval request, and microsite publish. | Email and in-app are required; SMS should be available for time-sensitive booking and trip-day events. |
| FR-73  | [P1] Users can tune notification preferences by channel and event type.                                                                                                                                  | Critical operational events may override quiet settings if the user opted into SMS.                    |
| FR-74  | [P0] The trip home should double as an activity feed so users can recover from missed notifications.                                                                                                     | Every meaningful state change should be logged.                                                        |

## 8.15 Admin, Editorial, and Concierge Operations

Operational tooling is part of the launch product because golf supply and booking fragmentation make pure self-serve unrealistic.

| **ID** | **Requirement**                                                                                                                 | **Acceptance / notes**                                            |
|--------|---------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| FR-75  | [P0] Internal admins can classify course access, edit booking rules, update scores, and resolve user-submitted supply issues. | Course data curation must not require database access.            |
| FR-76  | [P0] Concierge ops can view booking requests, assign owners, store notes, attach confirmations, and update status.            | This is the back office for hybrid booking.                       |
| FR-77  | [P1] Admin can verify memberships, override entitlements, and approve or reject private-access unlocks.                       | Actions must be logged.                                           |
| FR-78  | [P1] Content moderation tools can remove photos, unpublish microsites, and respond to support tickets.                        | Safety and privacy requests require fast turnaround.              |
| FR-79  | [P0] Fee schedules, swap policies, and certain feature flags should be configurable by admin.                                 | This reduces engineering dependence for routine business changes. |

## 8.16 Acceptance Criteria Addendum — P0 Requirements

> **Convention.** Each P0 requirement below is supplemented with testable acceptance criteria in Given/When/Then format. These are separated from the implementation notes in the original tables above. Where straw-man thresholds are used, they are flagged for review.

### FR-1: Account Creation

- Given a new user visiting the app for the first time, when they complete the signup flow, then an account is created and they are logged in within `[ASSUMPTION — EDIT: 2 minutes]` of starting, without being required to fill in handicap, phone, or club membership.
- Given a user on a phone browser, when they complete the signup flow, then all form fields are usable without horizontal scrolling or pinch-to-zoom.
- Given a user who already has an account, when they attempt to sign up with the same email, then they are shown a clear message directing them to log in instead.

### FR-2: Profile Fields

- Given a logged-in user, when they navigate to their profile, then they can view and edit: name, email, phone, handicap, home airport, and preferred home location.
- Given a user with an empty handicap, when they attempt to join a round that uses net scoring, then they are prompted to enter their handicap before the round can begin.
- Given a user, when they update their home airport, then future trip searches default to that airport as the anchor.

### FR-3: Club Membership and Sponsorship

- Given a user, when they add a club membership to their profile, then the membership record includes: club name, network/reciprocal affiliation, access type, and a free-text notes field.
- Given a user who has marked "willing to sponsor," when they are added to a trip, then the system includes their sponsored courses in the eligible inventory for that trip.
- Given a user with a sponsorship note that says "2-guest limit," when the trip has more golfers than the guest limit, then the system displays a warning on any private course surfaced through that sponsorship.

### FR-5: Role Model

- Given a trip, when a user is designated captain, then captain-specific controls (override, swap policy, microsite publish) are visible to that user and hidden from collaborators.
- Given a trip, when the captain role is transferred, then the previous captain loses captain controls and the new captain gains them immediately.
- Given a user with the "concierge ops" role, when they log in, then they see the ops console rather than the consumer trip view.

### FR-6: Trip Creation

- Given a logged-in user, when they create a trip, then the trip is initialized with: name, target dates (or date window), number of golfers, target area, and budget preferences, and defaults to the product's core trip shape (2-8 golfers, 2-4 days, 1 round/day).
- Given a trip with no invited collaborators, when the creator views the trip, then the trip is in Draft state and the creator is prompted to invite members.

### FR-7: Invitations

- Given a trip creator, when they send an invitation via email, then the recipient receives an email with a link that opens the trip in the app.
- Given a trip creator, when they generate a share link, then the link is copiable and works in SMS, messaging apps, and browsers.
- Given a trip, when invitations have been sent, then the invite list shows each invitee's status: pending, accepted, or declined.
- Given a user who accepts an invite, when they land on the trip, then they see the trip's current state (dates, destination, shortlist, votes) without needing to ask the group for context.

### FR-8: Captain Designation

- Given a trip, when the creator designates a captain, then exactly one captain exists at any time.
- Given a trip, when the current captain or trip creator transfers the captain role, then the new captain gains captain controls immediately for future actions, the prior captain loses those controls immediately, and the transfer is logged in the activity feed.
- Given a trip with existing bookings, fees, or liabilities, when the captain role is transferred, then previously created payments, booking requests, approvals, and liabilities remain attached to their original actor or payer.

### FR-10: Trip States

- Given a trip, when its state changes (e.g., Planning to Voting), then the transition is logged in the activity feed with a timestamp and the user or system event that triggered it.
- Given a trip in Completed state, when a user views it, then all planning, booking, scoring, and recap data is read-only except for admin corrections.

### FR-11: Search Inputs

- Given a user entering "MCO" in the search field, when they execute the search, then results are anchored to Orlando International Airport.
- Given a user entering "Scottsdale" in the search field, when they execute the search, then results are anchored to the Scottsdale, AZ region.
- Given a user drawing a region on the map, when they execute the search, then results are filtered to courses within the drawn boundary.
- Given a user entering a non-existent airport code (e.g., "ZZZ"), when they execute the search, then the system displays a "no results" message with a suggestion to try a city name or map selection.

### FR-12: Search Filters

- Given active filters for radius, drive time, dates, price band, group size, access type, and public-play eligibility, when results are returned, then every course in the results satisfies all active filters.
- Given a filter combination that returns zero results, when the user sees the empty state, then the system suggests broadening specific filters (e.g., "Try expanding your radius or price range").

### FR-13: Access Filtering

- Given a trip with no verified member sponsors, when search results are returned, then no private-member-only or unknown-access courses appear.
- Given a trip with a verified member sponsor for Club X, when search results are returned, then Club X appears in a clearly labeled separate group (e.g., "Private — playable through Alex's membership") below the public results.

### FR-14: Course Cards

- Given a course in search results, when the user views the card, then it displays: access badge, distance from anchor, drive time, indicative price band, tee-time window status, quality signals, and a reasons-to-play summary.
- Given a course card, when the user taps or clicks it, then the course detail page opens.

### FR-17: Community Score Separation

- Given a course with both community reviews and an editorial/composite score, when the user views the course card or detail page, then the community golfer score and the composite score are displayed as two distinct, labeled values that are never averaged or blended.

### FR-18: Composite Quality Model

- Given a course with editorial assessment, external ranking data, and price data, when the composite score is calculated, then it reflects all three inputs and is labeled as a product-owned score distinct from community reviews.

### FR-19: Structured Reviews

- Given a user who has completed a round, when they submit a review, then they rate at least six dimensions (conditioning, layout/routing, value, pace, service, trip vibe/clubhouse) plus optional free text.
- Given a user who skips one or more rating dimensions, when they attempt to submit, then the system prompts them to complete all six dimensions before the review is accepted.

### FR-23: Shortlist Generation

- Given a trip with search results, when the system generates a shortlist, then it produces `[ASSUMPTION — INVESTIGATE: 3-5]` itinerary candidates ranked by trip-fit score.
- Given a shortlist, when the user views it, then each option shows the courses included, estimated cost per golfer, and a brief rationale for why it fits the trip.

### FR-24: Voting

- Given a shortlist option, when a collaborator votes, then they can select exactly one of: In, Fine, or Out, and optionally attach a comment or budget objection.
- Given a shortlist option with majority Out votes, when the vote board is refreshed, then that option sinks below options with stronger support.
- Given a collaborator, when they change their vote, then the new vote replaces the old one and the change is logged.

### FR-25: Cost-Per-Golfer Display

- Given a shortlist option, when the user views it, then the estimated cost per golfer is displayed prominently alongside the option title.
- Given a shortlist option where cost data is incomplete, when the user views it, then the system shows a range or "estimated" label rather than a false-precision number.

### FR-27: Captain Override

- Given a trip in Voting state with a deadlock (no majority-In option) or an expired decision deadline, when the captain activates override, then the captain can select any option to finalize.
- Given a captain override, when it is executed, then the override is logged in the activity feed with: the option chosen, the vote distribution at the time of override, and a timestamp.
- Given a non-captain user, when they view the vote board during a deadlock, then they do not see the override control.
- Given a captain override has been executed, when any non-captain member views the vote board or trip home, then they see a clear, non-dismissible indicator that the decision was made via captain override (not consensus), including which option was chosen and the vote distribution at the time of override. This ensures transparency — members should never be confused about whether a decision was a group consensus or a unilateral call.

### FR-29: Booking Rules Storage

- Given a course record, when ops updates its booking rules, then the record stores: booking-window rule, cancellation policy, max players per tee time, and known booking channel.
- Given a course with unknown booking rules, when a user targets it, then the system displays "Booking rules unconfirmed — assisted booking will verify" rather than leaving fields blank.

### FR-30: Booking Window Dashboard

- Given a trip with targeted rounds, when the user views the trip dashboard, then each round shows: the date/time the booking window opens, the current status (not yet open, open, booked), and who is responsible for booking.
- Given a booking window that opens within `[ASSUMPTION — INVESTIGATE: 48 hours]`, when the responsible user has not subscribed to alerts, then the system prompts them to enable notifications.

### FR-31: Party Splitting

- Given a trip with 6 golfers targeting a course with a max of 4 per tee time, when the booking engine generates a split plan, then it produces two groups (e.g., 4+2 or 3+3) with target tee times no more than `[ASSUMPTION — INVESTIGATE: 15 minutes]` apart.
- Given a party split plan, when the user views it, then each group's composition and target tee time are visible.
- Given a course with a max of 4 per tee time and a trip of 2 golfers, when the booking engine generates a plan, then it produces a single group with no unnecessary split.

### FR-32: Booking Room

- Given a trip with a booking attempt in progress, when any trip member or concierge views the booking room, then they see: target time ranges, party split assignments, who is booking each slot, live status (attempting, partial hold, confirmed, failed), and fallback actions.
- Given a booking room where only part of the block is secured, when the user views the room, then a fallback action is visible (e.g., "Request assisted booking" or "Try alternate time").

### FR-33: Hybrid Booking Execution

- Given a course with a direct booking integration, when the user initiates booking, then the system executes the booking automatically and returns a confirmation.
- Given a course without a direct integration, when the user initiates booking, then the system creates an assisted-booking request and the user sees a live operational state such as "Queued," "Attempting," or "Needs manual action" rather than a fixed response-time promise.
- Given a course, when the user views the course detail or booking room, then the booking mode (direct, guided checkout, or assisted booking) is clearly labeled.

### FR-34: Fee Disclosure

- Given a booking about to be confirmed, when the user reaches the confirmation step, then all fees (service fee, pass-through costs, cancellation penalties) are itemized and displayed before the user can confirm.
- Given a user who has not yet confirmed, when they cancel out of the confirmation step, then no fees are charged.

### FR-35: Continuous Monitoring

- Given a trip with booked rounds, when the system runs its optimization cycle, then it scans for better-fit alternatives within the trip's geographic range.
- Given a trip whose freeze date has passed, when the optimization cycle runs, then no new swap suggestions are generated.

### FR-36: Safe-Swap-Only Rule

- Given a swap suggestion, when the system presents it, then the replacement course has already been confirmed as available before the existing booking is canceled.
- Given a scenario where the replacement cannot be confirmed, when the system evaluates the swap, then no suggestion is presented and no cancellation is initiated.

### FR-37: Constraint-Aware Suggestions

- Given a swap suggestion, when the captain views it, then it displays: cancellation deadline for the current booking, any cancellation penalty, drive-time change, cost delta per golfer, quality-model delta, and whether it respects the trip's budget constraints.
- Given a trip with hard budget rules, when a swap suggestion would exceed the hard budget, then the suggestion is suppressed unless the captain has explicitly enabled over-budget suggestions.

### FR-39: Rebooking Timeline

- Given a trip with one or more completed swaps, when the user views the rebooking timeline, then each swap entry shows: before state, after state, date of change, and the rationale for the suggestion.

### FR-44: Link-Out Fallback

- Given a course, lodging, or flight option without a direct booking path, when the user selects it, then the system provides a link to the external booking source and a lightweight form to capture the source, confirmation number, date, time, cost, booking contact, and notes back into the trip itinerary.
- Given a member who completes a booking externally, when they return to the trip and submit the capture form, then the itinerary item appears in the shared itinerary without requiring a direct partner integration.

### FR-47: Canonical Itinerary

- Given a trip with confirmed bookings, lodging, and flights, when a member views the itinerary, then all items appear in a single day-by-day view grouped by date.
- Given a trip with no lodging or flights added, when a member views the itinerary, then the golf rounds still appear and the lodging/flights sections show empty-state prompts rather than errors.

### FR-48: Itinerary Details

- Given a confirmed reservation, when a member views the itinerary detail, then they see: address, confirmation number, participant assignments, and contact notes.
- Given a confirmed reservation, when a member views the itinerary detail, then full credit-card numbers, CVVs, or other sensitive payment data are never displayed.

### FR-51: Score Entry

- Given a round in progress, when a player enters a score for a hole, then the score is saved immediately (optimistic save with sync) to that player's official card.
- Given a player, when they edit a previously entered hole score before the round is finalized or archived, then the updated score replaces the prior value and the latest edit time is preserved.
- Given two or more official cards that disagree for the same hole or player, when any trip member views round mode, then the UI displays a clear discrepancy indicator and any derived totals or bet outcomes are marked provisional until the discrepancy is resolved.
- Given weak or lost connectivity, when a player enters scores, then scores are persisted locally and sync when connectivity returns without data loss or duplication.
- Given a phone browser, when the player is on the scoring screen, then tap targets for score entry are at least `[ASSUMPTION — INVESTIGATE: 44x44 CSS pixels]`.

### FR-52: Game Templates

- Given a round, when the user selects a game format, then the system supports at minimum: stroke play, team best ball, skins, and Nassau-style scoring with automated calculation.
- Given a game format not in the supported template list, when the user creates a round, then they can enter a free-text game description and manually track results.

### FR-53: Quick Side Bets

- Given a round in progress, when a user creates a side bet, then the bet is created with: amount (which may be $0 for a pride bet), participants, trigger condition, and initial state (proposed).
- Given a proposed side bet, when all named participants accept, then the bet moves to "accepted" state.
- Given the scoring screen on a phone browser, when a user taps "Add Side Bet," then the bet creation flow requires no more than `[ASSUMPTION — INVESTIGATE: 3 taps and minimal text entry]`.

### FR-54: Bet Ledger

- Given a round with accepted bets, when the round is completed, then the system calculates net positions (who owes whom) and displays a settlement summary.
- Given a settlement summary, when a user taps "Settle," then the system provides a one-tap action to send a settlement reminder (e.g., Venmo deep link or SMS) — not an in-app fund transfer.

### FR-57: Photo Upload

- Given a trip member, when they upload a photo, then the photo is stored in the private trip album and is visible only to trip members.
- Given a photo upload, when it completes, then the photo's default publish state is "Private."

### FR-58: Photo Veto

- Given a photo nominated for public recap inclusion, when any trip member shown in the photo exercises a veto, then the photo immediately becomes ineligible for public publication and cannot be re-nominated without the vetoing member's reversal.
- Given a photo with no tagged members, when it is nominated for publication, then all trip members are given the opportunity to veto (since untagged does not mean no one is pictured).

### FR-60: Recap Microsite

- Given a trip in Completed state with at least one publish-eligible photo, when the captain publishes the microsite, then it is accessible via a unique, shareable URL that is unlisted and marked noindex by default.
- Given a published microsite, when the captain has not explicitly enabled public promotion, then the page remains unlisted/noindex and is not surfaced in public discovery surfaces controlled by the app.
- Given a published microsite, when a non-member visits the URL, then they see: selected photos, scores, winners, and itinerary highlights, plus a modest app promotion.
- Given a published microsite URL shared on social media, when the platform fetches metadata, then Open Graph tags render a preview with the trip name and a cover image.

### FR-63: Trip Archival

- Given a trip in Completed state, when it transitions to Archived, then all trip data (planning, booking, scoring, recap) remains browsable and read-only.
- Given an archived trip, when a non-admin user attempts to modify data, then the system prevents the edit and displays "This trip is archived."

### FR-67: Fee Configuration

- Given an admin, when they configure fee types, then they can set fees for: tee-time bookings, accepted bets, lodging bookings, and air bookings, each with flat or percentage-based amounts, and can configure optional per-golfer caps for bet fees.
- Given a fee configuration change, when it is saved, then it applies only to future transactions, not retroactively.

### FR-68: Tee-Time Service Fees

- Given a booking that is canceled before the cancellation threshold, when the system evaluates fees, then no service fee is charged.
- Given a booking that remains active past the cancellation threshold, when the system evaluates fees, then the service fee is charged.
- Given a service fee charge, when the user views their billing history, then the fee is itemized with the associated booking and amount.

### FR-69: Bet Fee Logic

- Given a side bet with amount $0, when all named participants accept it, then the bet is recorded as a pride bet and no platform fee is charged.
- Given a money bet that remains in proposed, rejected, expired, or voided state, when billing runs, then no bet fee is charged.
- Given multiple accepted money bets in the same round or trip, when billing is displayed, then the user sees a batched bet-fee summary and any configured per-golfer cap applied.

### FR-70: Pass-Through Cost Disclosure

- Given a booking or cancellation that incurs external costs, when the user is informed, then the pass-through cost is shown as a separate line item from the platform service fee.

### FR-72: Critical Notifications

- Given a critical event (invite, vote deadline, booking window open, booking confirmation, swap suggestion, fee event, score reminder, photo approval request, microsite publish), when it occurs, then the system sends at least one notification via email and displays an in-app notification.
- Given a time-sensitive event (booking window open within 24 hours, trip-day logistics), when the user has opted into SMS, then an SMS notification is also sent.

### FR-74: Activity Feed

- Given a trip, when any meaningful state change occurs, then it is logged in the trip's activity feed with: event description, user or system actor, and timestamp.
- Given a user who missed a notification, when they visit the trip home, then they can reconstruct what happened by reading the activity feed.

### FR-75: Admin Course Curation

- Given an admin, when they access the ops console, then they can classify course access type, edit booking rules, update quality scores, and resolve user-submitted reports without database access.

### FR-76: Concierge Ops Console

- Given a concierge, when they access the ops console, then they see pending booking requests sortable by urgency (booking-window proximity).
- Given a booking request, when a concierge assigns it to themselves, then other concierges see the assignment and can access the notes.
- Given a booking request, when a concierge attaches a confirmation, then the trip's reservation status updates in real time.

### FR-79: Admin Configuration

- Given an admin, when they update fee schedules, swap policies, or feature flags, then the changes take effect without a code deploy.

# 9. UX, Content, and Design Requirements

The product has two modes that must coexist cleanly: a pre-trip planning mode with social energy, and a high-trust operational mode for reservations, money, and privacy.

| **Area**           | **Requirement**                                                                                                                               |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Responsive web     | Design for desktop-first planning and phone-first trip-day use. No critical workflow may require a native app.                                |
| Low-attention mode | Score entry, side bets, and round management must use large tap targets, persistent save states, and minimal text entry.                      |
| Map/list discovery | Search should support quick scan patterns: big course cards, clear price and access badges, visible reasons to play, and immediate filtering. |
| Decision surfaces  | The vote board must make group sentiment legible within seconds. Avoid dense tables and hidden comments.                                      |
| Booking surfaces   | Confirmation, fee, and cancellation screens must be plainspoken, sober, and unambiguous.                                                      |
| Consent surfaces   | Photo sharing controls must default to privacy, with clear publication status and veto visibility.                                            |
| Copy voice         | Copy can be witty, but money, legal, and consent language must stay direct and explicit.                                                      |
| Accessibility      | Target WCAG 2.2 AA for the web app, including keyboard access, color contrast, and semantic structure.                                        |

## 9.1 Key screen requirements

| **Screen**       | **Must show**                                                                            | **Primary CTA**                 |
|------------------|------------------------------------------------------------------------------------------|---------------------------------|
| Trip home        | status, next action, target rounds, travel summary, unresolved votes, booking windows    | Continue planning / Review trip |
| Discovery        | filters, ranked course cards, map, access badges, quality signals, save/shortlist action | Add to shortlist                |
| Course detail    | access explanation, score breakdowns, price, booking rule, party-size rule, notes        | Target this course              |
| Vote board       | candidate options, cost estimate, member sentiment, captain controls, deadline           | Vote or finalize                |
| Booking room     | countdown, split plan, assignee status, confirmations, fallback actions                  | Request / Confirm booking       |
| Round mode       | scorecard, teams, current games, quick bet buttons, ledger summary, discrepancy indicators | Save score / Add side bet       |
| Photo review     | upload queue, tagged people, veto state, publish eligibility                             | Approve / Veto / Publish        |
| Microsite editor | cover image, selected photos, winners, stats, privacy/public-promotion state, share preview | Publish recap                   |

> **Practical design note**
>
> Do not make the booking, fee, and consent experiences feel like the jokey parts of the brand. The app can be fun overall while still using restrained, explicit, almost transactional UI in high-risk moments.

## 9.2 Accessibility Acceptance Criteria

> **Why operationalize accessibility?** A single-line WCAG 2.2 AA target is a meaningful commitment, but without specific criteria attached to high-interaction screens, compliance tends to be treated as a post-launch fix. The criteria below identify the screens with the highest accessibility risk and define testable requirements.

### Global Requirements (All Screens)

- All interactive elements must be reachable and operable via keyboard (Tab, Enter, Space, Escape, Arrow keys) without requiring a mouse or touch.
- All text must meet WCAG 2.2 AA contrast ratios: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold).
- All form inputs must have associated `<label>` elements or `aria-label` attributes.
- All images must have meaningful `alt` text or be marked as decorative (`alt=""`).
- Page structure must use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<h1>`–`<h6>`) in logical order.
- Focus indicators must be visible on all interactive elements.

### Score Entry (Round Mode) — Highest Risk `[ASSUMPTION — INVESTIGATE]`

- Score-entry controls must be operable with VoiceOver (iOS) and TalkBack (Android) screen readers.
- Team assignment must not rely solely on color to convey which team a player belongs to; a text label, icon, or pattern must also be present.
- Tap targets for score increment/decrement must be at least 44x44 CSS pixels.
- Score-entry state (current hole, current player, saved vs. unsaved) must be announced to assistive technology on change.

### Vote Board — High Risk

- Vote state (In, Fine, Out) for each option must be conveyed via text label, not solely via color or icon.
- The captain override control must have a descriptive `aria-label` (e.g., "Override vote and finalize this option").
- Comment attachments on votes must be accessible to screen readers.

### Booking Room — High Risk

- Countdown timers must be announced to screen readers via `aria-live` regions.
- Booking status changes (attempting, confirmed, failed) must update `aria-live` regions so screen-reader users are informed without manual page refresh.
- The party-split visualization must have a text-based alternative (e.g., "Group 1: Alex, Jordan, Sam — 9:00 AM. Group 2: Pat, Taylor — 9:12 AM").

### Photo Review / Consent — Medium Risk

- Veto and approval buttons must have descriptive labels ("Veto this photo" / "Approve this photo for public recap").
- Publication status (Private, Review Pending, Eligible, Published) must be conveyed via text, not solely via icon or color.
- Photo thumbnails in the review queue should have `alt` text describing the photo content or "Uploaded photo [number] — [uploader name]."

### Discovery Map — Medium Risk

- Map-based course results must have a list-view equivalent that provides the same information without requiring visual map interaction.
- Map markers must be keyboard-navigable and provide course name and key details on focus/hover.

# 10. Core Data Model

The following entity model is sufficient for launch planning. Exact schema names may change, but the domain boundaries should not.

> **Scope disclaimer:** This data model is an illustrative domain reference, not a schema contract. It communicates the key entities, relationships, and state machines to align Product, Design, and Engineering on domain boundaries. Field names, storage decisions, indexing strategies, foreign-key relationships, soft-delete patterns, and multi-tenancy approaches are owned by Engineering and may diverge from this reference during implementation. A companion technical design document should be created by Engineering to capture these implementation-level decisions.

## 10.1 Core planning entities

| **Entity**            | **Key fields**                                                                     | **Notes**                                                             |
|-----------------------|------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| User                  | id, name, email, phone, handicap, home_airport, status                             | Owns profile and cross-trip history.                                  |
| MembershipEntitlement | user_id, club_name, network_name, access_type, verified_status, notes              | Supports sponsor-based private or reciprocal access.                  |
| Trip                  | id, name, date_start, date_end, anchor_type, anchor_value, budget_settings, status | Primary workspace object.                                             |
| TripMember            | trip_id, user_id, role, response_status, hard_constraints, soft_preferences        | Stores collaborator vs captain state.                                 |
| TripOption            | trip_id, type, title, estimated_cost, fit_score, status                            | Represents itinerary or destination/course candidate shown in voting. |
| Vote                  | trip_option_id, user_id, vote_value, comment, timestamp                            | Supports In / Fine / Out pattern.                                     |

## 10.2 Course and booking entities

| **Entity**      | **Key fields**                                                                         | **Notes**                                                  |
|-----------------|----------------------------------------------------------------------------------------|------------------------------------------------------------|
| Course          | id, name, location, access_type, access_confidence, amenities, price_band              | Canonical course record.                                   |
| CourseRule      | course_id, booking_window_rule, cancellation_rule, max_players, source, updated_at     | Stores the operational rules needed for tee-time planning. |
| CourseReview    | course_id, user_id, dimensions, text, overall_user_score                               | App-native golfer review; displayed separately.            |
| CourseComposite | course_id, editorial_score, external_rank_score, value_score, trip_fit_inputs          | Supports ranking and recommendation.                       |
| BookingRequest  | trip_id, course_id, target_date, target_time_range, party_split, mode, status          | Tracks initial booking intent.                             |
| Reservation     | booking_request_id, supplier_confirmation, tee_time, players, status, fee_state        | Represents the committed tee time(s).                      |
| ReservationSwap | trip_id, old_reservation_id, new_reservation_id, recommendation_reason, approval_state | Tracks optimization changes.                               |

## 10.3 Play, media, and monetization entities

| **Entity**   | **Key fields**                                                     | **Notes**                              |
|--------------|--------------------------------------------------------------------|----------------------------------------|
| Round        | trip_id, course_id, date, format, teams, status                    | Canonical played round; each golfer owns an official editable card. |
| ScoreEntry   | round_id, player_id, hole_number, strokes, net_strokes, updated_at, discrepancy_state | Supports live and historical scoring and discrepancy detection. |
| Bet          | trip_id, round_id, creator_id, type, amount, participants, state   | Social wagering record.                |
| FeeCharge    | trip_id, user_id, fee_type, source_object_id, amount, status       | Tracks platform monetization events.   |
| PhotoAsset   | trip_id, uploader_id, storage_url, metadata, publish_state         | Private by default.                    |
| PhotoConsent | photo_asset_id, user_id, consent_state, timestamp                  | Publication gate for public recap use. |
| Microsite    | trip_id, slug, publish_state, visibility_mode, selected_assets, public_payload | Shareable recap page; unlisted/noindex by default. |

Recommended state models:

- Trip: Draft -> Planning -> Voting -> Booking -> Locked -> In Progress -> Completed -> Archived.
- BookingRequest: Candidate -> Window Pending -> Requested -> Partial Hold -> Booked -> Swappable -> Locked -> Played / Canceled.
- PhotoAsset: Private -> Review Pending -> Publish Eligible -> Published -> Withdrawn.

# 11. Technical Approach and Reference Architecture

The product requires durable workflows, strong relational data, geo-aware search, background jobs, and an operations console. A monolithic CRUD app will be insufficient once booking windows and optimization are live.

| **Layer**                      | **Recommended approach**                                                                  | **Why**                                                                                 |
|--------------------------------|-------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| Client                         | Next.js / React with TypeScript                                                           | Responsive web, fast iteration, SSR-friendly recap pages, shared components.            |
| Backend/API                    | TypeScript service layer with domain modules or services                                  | Keeps product and admin logic in one language family and supports structured workflows. |
| Primary database               | PostgreSQL                                                                                | Strong relational modeling for trips, bookings, votes, and fees.                        |
| Geo/search                     | PostGIS plus optional search index                                                        | Supports airport/radius logic and geographic ranking.                                   |
| Workflow engine                | Durable job orchestration for booking windows, alerts, and optimization                   | Required for time-based automation and safe retries.                                    |
| Cache / session / rate control | Redis-class store                                                                         | Supports hot reads, locks, and short-lived coordination states.                         |
| Object storage                 | S3-compatible storage + CDN                                                               | Needed for photos and public recap assets.                                              |
| Messaging                      | Email provider plus SMS provider                                                          | Critical for booking and trip-day alerts.                                               |
| Payments                       | Card-on-file or processor for platform fees; non-custodial settlement flows for side bets | Keeps revenue and social payouts distinct.                                              |
| Admin / ops                    | Separate internal web console                                                             | Concierge operations are a launch dependency, not an afterthought.                      |

## 11.1 Suggested service boundaries

- Identity and profile service.
- Trip and collaboration service.
- Discovery and scoring service.
- Booking orchestration service.
- Optimization service.
- Travel add-on service.
- Rounds, games, and betting ledger service.
- Media and microsite service.
- Billing service.
- Notification service.
- Admin / operations service.

## 11.2 Background jobs / scheduled workflows

- Booking window open alerts.
- Availability monitoring and re-ranking.
- Swap suggestion generation.
- Fee capture at cancellation-threshold crossing.
- Microsite asset processing and publish pipeline.
- Reminder jobs for unscored rounds, unresolved votes, and photo approvals.

## 11.3 Concurrent Cart-Hold Constraint: Potential Design Direction

> **Status: Potential design direction, subject to further technical investigation before engineering commits to an approach.** The pattern described below is informed by known aggregator API behavior but must be validated against actual API documentation and partner agreements before it is treated as the architectural plan.

**The problem.** When a group of 5-8 golfers needs back-to-back tee times (e.g., 8:00 AM and 8:10 AM), booking them sequentially creates a race condition: the first slot can be held, but a stranger may claim the second slot before the system completes the second request. If this happens, the group is split and the app has failed its core booking promise.

**Potential approach: all-or-nothing concurrent holds.** Most golf aggregator APIs (candidates include GolfNow and Supreme Golf — see Section 12.1) use a cart/hold system that temporarily locks inventory for `[ASSUMPTION — INVESTIGATE: 5-10 minutes]` while the user completes checkout. A potential architecture would:

1. **Fire concurrent hold requests** for all required tee-time slots simultaneously rather than sequentially.
2. **Evaluate the combined result.** If all slots are successfully held, proceed to checkout. If any slot fails (e.g., 409 Conflict), immediately release all successful holds via rollback and notify the captain with alternatives.
3. **Complete checkout within the hold window.** Because hold windows are short, this implies the Trip Captain (or the app on the captain's behalf) must be the paying party at checkout time. Collecting individual payments from `[ASSUMPTION — EDIT: 6-8]` members within a 5-10 minute hold window is not feasible. The captain-pays-upfront model (with post-trip reimbursement via the cost-splitting ledger in Section 8.13.1) is the pragmatic v1 approach.

**Why this needs further investigation before committing.** Several unknowns must be resolved:

- **Aggregator API terms:** Do target aggregators actually expose cart-hold endpoints for programmatic use? Some restrict this to their own consumer-facing checkout and do not offer it via API.
- **Anti-bot protections:** Rapid concurrent hold requests from a single server IP may trigger rate limiting or bot-detection blocks (e.g., Cloudflare). Official developer API keys and negotiated rate limits may be required.
- **Multi-hold restrictions:** Some aggregator APIs do not allow a single account to hold multiple consecutive tee times simultaneously (anti-hoarding rules). The backend may need to negotiate "group booking" endpoint access or use sub-account patterns, both of which require partner cooperation.
- **Fallback when concurrent holds are unavailable:** For courses booked via assisted-booking rather than direct API, this pattern does not apply. The assisted-booking workflow (FR-32, FR-33) remains the fallback, and the booking room must handle mixed-mode scenarios where some slots are API-held and others are ops-managed.

> **Recommendation.** Engineering should conduct a spike during M1 to evaluate the actual API capabilities of 2-3 target aggregators (see Section 12.1) and produce a short technical design document covering: hold-endpoint availability, rate limits, multi-hold policies, and rollback behavior. The booking orchestration service design (M2) should not be finalized until this spike is complete. Add this as an open decision in Section 17 if not resolved by M2 kickoff.

# 12. Integrations and External Dependencies

| **Dependency**                 | **Purpose**                                                           | **Launch stance**                                                      |
|--------------------------------|-----------------------------------------------------------------------|------------------------------------------------------------------------|
| Airport / geocoding source     | Resolve airport codes and place search to coordinates.                | Required.                                                              |
| Maps / route-time provider     | Drive-time filters and itinerary convenience.                         | Required.                                                              |
| Course data source(s)          | Seed course records, photos, and structured metadata where available. | Required but can be blended with manual ops curation.                  |
| Ranking / editorial inputs     | Support composite quality model.                                      | Optional at launch if internal editorial scoring can cover key supply. |
| Course reservation partners    | Enable direct or semi-direct booking.                                 | Nice to have; hybrid assisted-booking must exist regardless.           |
| Lodging partner / affiliate    | Optional stay discovery and monetization.                             | Helpful but not launch-blocking.                                       |
| Flight partner / affiliate     | Optional air search and monetization.                                 | Helpful but not launch-blocking.                                       |
| Email / SMS providers          | Critical communications.                                              | Required.                                                              |
| Payment processor              | Platform fee collection.                                              | Required.                                                              |
| Music licensing / media rights | Optional branded soundtrack moments.                                  | Strictly optional and non-blocking.                                    |

> **Dependency strategy**
>
> The platform should be designed so that external travel inventory depth and golf booking integrations improve monetization and convenience, but do not determine whether the core product works. The core product must still function with discovery, recommendation, assisted booking, itinerary tracking, and recap even if partner access is partial.

## 12.1 Vendor Candidates to Evaluate

> **These are candidates, not commitments.** The vendors listed below represent known options in each integration category based on market availability as of early 2026. Engineering and BizDev should evaluate each for API maturity, pricing, rate limits, group-booking support, and partnership terms before making commitments. This list is not exhaustive and should be updated as new options are identified.

| **Category** | **Candidates to Evaluate** | **Notes** |
|---|---|---|
| Tee-time aggregator APIs | **GolfNow API**, **Supreme Golf API** | Primary candidates for live inventory and pricing. Key investigation areas: cart-hold endpoint availability, concurrent-hold policies, rate limits, anti-bot restrictions, and group-booking support (see Section 11.3). GolfNow has the largest U.S. inventory footprint; Supreme Golf aggregates across multiple sources. Both may have restrictive terms — early outreach to developer relations is recommended. `[ASSUMPTION — INVESTIGATE]` |
| Golf course metadata | **National Golf Foundation (NGF)** database, **Golf Course API** (if available) | Needed for structured course data: slope, rating, architect, year built, hole count, access classification. May supplement or replace manual ops curation for initial supply seeding. Evaluate data coverage, update frequency, and licensing terms. `[ASSUMPTION — INVESTIGATE]` |
| Lodging | **Airbnb API**, **VRBO/Expedia API** (affiliate or partner programs) | Golf trips skew toward group lodging (houses, condos) rather than hotels. Airbnb and VRBO are the dominant platforms for this inventory type. Note: both have historically restricted full booking APIs; affiliate deep-linking may be the realistic v1 path, with assisted-booking as fallback. `[ASSUMPTION — INVESTIGATE]` |
| Payments / fee processing | **Stripe Connect** | Well-suited for multi-party payment routing: platform service fees routed to the business account, pass-through costs routed to suppliers. Also supports the captain-pays-upfront model described in Section 11.3. Evaluate Stripe Connect's "destination charge" and "separate charges and transfers" models for best fit. `[ASSUMPTION — INVESTIGATE]` |
| Peer-to-peer settlement links | **Venmo**, **Zelle**, **PayPal**, **Cash App** (deep-link only) | For cost-splitting settlement (Section 8.13.1). The app generates pre-populated deep links; it does not process P2P payments itself. Evaluate deep-link URL schemes and whether they support pre-filled recipient/amount fields. `[ASSUMPTION — INVESTIGATE]` |

# 13. Security, Privacy, and Compliance Requirements

This product touches identity, payments, photos, travel bookings, and social wagering. It therefore needs explicit risk boundaries from day one.

| **Area**            | **Requirement**                                                                                                                                     |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| Account security    | Use modern authentication, secure session management, rate limiting, and audit logging for sensitive actions.                                       |
| Payment scope       | Collect only the data needed for platform fees and defer card custody and compliance obligations to a trusted processor wherever possible.          |
| Betting scope       | Launch with a ledger and settlement workflow rather than an in-app gambling wallet unless legal and payments review approve deeper functionality.   |
| Photo privacy       | All uploaded media is private by default. Public distribution requires explicit publish eligibility, must honor participant veto, and recap pages remain unlisted/noindex unless the captain opts into public promotion. |
| Access entitlements | Club-membership data should be treated as sensitive profile information and editable by the user or admin only.                                     |
| Booking automation  | Any automation against third-party booking systems should respect permitted integration patterns; unsupported brittle automation should be avoided. |
| Travel compliance   | If the company takes a direct booking role for lodging or air, legal review is required on seller-of-travel and related obligations.                |
| Content rights      | Any music or artist content must be separately licensed before inclusion in the product.                                                            |

## 13.1 Internal release gates

- Legal sign-off on betting-language and settlement mechanics.
- Legal/ops sign-off on booking terms and any partner-assisted or assisted-booking pattern.
- Payments sign-off on fee capture, refunds, and pass-through cost handling.
- Privacy sign-off on photo consent and takedown workflow.
- Brand/legal sign-off on any licensed soundtrack or celebrity integration.

# 14. Analytics, KPIs, and Instrumentation

The first six months should measure whether the product is better at turning planning chaos into booked trips and whether those trips actually feel better.

| **Metric**                      | **Definition**                                                                        | **Why it matters**                        |
|---------------------------------|---------------------------------------------------------------------------------------|-------------------------------------------|
| Trip creation rate              | Trips created per active user or invited group.                                       | Early signal of planning demand.          |
| Invite acceptance rate          | Accepted invites divided by sent invites.                                             | Measures group collaboration adoption.    |
| Search-to-shortlist rate        | Trips with at least one shortlist candidate after search.                             | Validates discovery usefulness.           |
| Shortlist-to-booking conversion | Trips with confirmed golf reservations divided by trips that reached shortlist.       | Core monetization funnel.                 |
| Adjacent tee-time success rate  | Percentage of multi-group booking requests that secure acceptable tee-time adjacency. | Differentiating operational KPI.          |
| Optimization uplift             | Share of trips improved by at least one accepted rebooking before T-7.                | Measures ongoing itinerary value.         |
| Course satisfaction             | Post-round rating and value perception against price paid.                            | Validates quality model.                  |
| On-trip engagement              | Rounds scored, bets created, photos uploaded, recap pages published.                  | Measures retention and social stickiness. |
| Repeat trip rate                | Share of groups that create another trip within 12 months.                            | Best proof of enduring product value.     |
| Take rate / revenue per trip    | Total platform fees collected per completed trip.                                     | Business viability.                       |

## 14.1 Success Metric Targets and Measurement Plans

> **Convention.** Targets below are straw-man hypotheses based on comparable consumer travel and group-coordination products. All values should be reviewed by Product, Data, and Finance before beta launch. Targets are set for 30 days post-beta and 90 days post-GA unless otherwise noted.

### Primary Success Criteria `[ASSUMPTION — INVESTIGATE]`

These three metrics are the top-level indicators of whether the product is working. If these fail, the product thesis needs re-evaluation regardless of how other metrics perform.

| **Metric** | **30-Day Post-Beta Target** | **Stretch** | **90-Day Post-GA Target** | **Stretch** | **Measurement Method** |
|---|---|---|---|---|---|
| Shortlist-to-booking conversion | 40% | 55% | 50% | 65% | Count of trips with ≥1 confirmed reservation / count of trips reaching shortlist state. Measured weekly from analytics warehouse. |
| Course satisfaction (% "worth it") | 70% | 80% | 75% | 85% | Post-round survey: "Was this round worth the price?" (Yes/No). Measured per round, aggregated monthly. |
| Repeat trip rate | N/A (too early) | N/A | 25% | 40% | Groups that create a second trip within 12 months of completing their first. Measured quarterly starting 6 months post-GA. |

### Supporting Indicators `[ASSUMPTION — EDIT]`

| **Metric** | **30-Day Post-Beta Target** | **Stretch** | **90-Day Post-GA Target** | **Stretch** | **Measurement Method** |
|---|---|---|---|---|---|
| Trip creation rate | 0.3 trips/active user/month | 0.5 | 0.4 trips/active user/month | 0.6 | Trips created / MAU. Measured monthly. |
| Invite acceptance rate | 60% | 75% | 65% | 80% | Accepted / sent invites. Measured weekly. Exclude self-invites. |
| Search-to-shortlist rate | 70% | 85% | 75% | 90% | Trips with ≥1 shortlist candidate / trips with ≥1 search. Measured weekly. |
| Adjacent tee-time success | 60% | 75% | 70% | 85% | Multi-group requests with all slots within 20 min / total multi-group requests. Measured per booking. |
| Optimization uplift | 15% of trips | 25% | 20% of trips | 30% | Trips with ≥1 accepted swap / trips with ≥1 booked round. Measured monthly. |
| On-trip engagement | 50% of rounds scored in-app | 70% | 60% of rounds scored | 75% | Rounds with ≥1 ScoreEntry / Rounds with status=Played. Measured monthly. |
| Take rate / revenue per trip | $30 per completed trip | $50 | $40 per completed trip | $60 | Sum of FeeCharge.amount where status=collected / count of trips in Completed state. Measured monthly. |

### Evaluation Cadence `[ASSUMPTION — EDIT]`

| **Checkpoint** | **When** | **What to evaluate** | **Decision** |
|---|---|---|---|
| Beta health check | 2 weeks post-beta | Invite acceptance, search-to-shortlist, booking-room usability (qualitative) | Go/no-go for expanding beta cohort |
| Beta readout | 30 days post-beta | All primary + supporting metrics vs. targets | Go/no-go for GA launch |
| GA month-1 review | 30 days post-GA | All metrics; identify top 3 underperforming areas | Prioritize post-launch roadmap |
| GA quarter review | 90 days post-GA | Full metric review including early repeat-trip signal | Inform v2 planning and fundraise narrative |

## 14.2 Event taxonomy (initial)

| **Event**             | **Key properties**                                               | **Owner**       |
|-----------------------|------------------------------------------------------------------|-----------------|
| trip_created          | trip_id, creator_id, golfers_count, date_window, anchor_type     | Product         |
| membership_added      | user_id, network_name, verified_status                           | Product/Ops     |
| search_executed       | trip_id, anchor, radius, drive_time, dates, budget, result_count | Discovery       |
| option_shortlisted    | trip_id, option_id, option_type, estimated_cost                  | Discovery       |
| vote_cast             | trip_id, option_id, user_id, vote_value                          | Collaboration   |
| captain_override_used | trip_id, captain_id, option_id, reason_code                      | Collaboration   |
| captain_transferred   | trip_id, previous_captain_id, new_captain_id, actor_id           | Collaboration   |
| booking_window_opened | trip_id, course_id, target_date                                  | Booking         |
| reservation_confirmed | trip_id, course_id, tee_time, split_pattern, fee_amount          | Booking/Billing |
| swap_suggested        | trip_id, old_reservation_id, new_course_id, savings_or_upgrade   | Optimization    |
| bet_created           | trip_id, round_id, amount, bet_type, participants                | Gameplay        |
| microsite_published   | trip_id, asset_count, public_slug                                | Media/Growth    |

# 15. Delivery Plan and Milestones

Below is a pragmatic launch plan that aligns with the operational complexity of golf booking.

| **Milestone**                 | **Primary output**                                                                               | **Exit criteria**                                                                         |
|-------------------------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| M1 - Planning core            | Accounts, profiles, trip creation, search, access filtering, shortlist, voting, captain override | A pilot group can create a trip and converge on a shortlist without ops assistance.       |
| M2 - Booking core             | Booking rules, booking room, concierge ops console, reservation confirmations, fee engine        | A pilot group can secure real tee times and see all fees clearly.                         |
| M3 - Optimization + itinerary | Swap suggestions, reservation timeline, itinerary consolidation, external booking capture, notification layer | At least one pilot trip is successfully improved before lock date without user confusion. |
| M4 - On-trip + recap          | Scorecards, games, side-bet ledger, photos, consent workflow, microsite                          | A pilot trip is scored in-product and publishes a recap page.                             |
| M5 - Travel add-ons           | Optional lodging and air paths, partner or assisted-booking                                      | Travel add-ons are monetizable without breaking the golf-first experience.                |

## 15.1 Milestone Duration Estimates and Calendar Targets

> **Assumptions.** Estimates below assume a team of `[ASSUMPTION — EDIT: 3 full-stack engineers, 1 product designer, 1 product manager, 1 ops/concierge lead, and part-time QA support]`. Calendar targets assume work begins `[ASSUMPTION — EDIT: April 1, 2026]`. All dates carry +/- 2-week uncertainty bands and should be updated during sprint planning.

| **Milestone** | **Estimated Duration** | **Target Start** | **Target End** | **Key Dependencies** |
|---|---|---|---|---|
| M1 - Planning core | `[ASSUMPTION — EDIT: 8 weeks]` | Apr 1, 2026 | May 27, 2026 | Airport/geocoding and maps providers must be contracted. Course data source seeded with ≥500 U.S. courses. |
| M2 - Booking core | `[ASSUMPTION — EDIT: 6 weeks]` | May 28, 2026 | Jul 8, 2026 | Payment processor integration. At least 1 ops/booking support hire onboarded. Open Decision #7 (assisted-booking states) resolved. |
| M3 - Optimization + itinerary | `[ASSUMPTION — EDIT: 5 weeks]` | Jul 9, 2026 | Aug 12, 2026 | Email/SMS providers integrated. Open Decision #5 (captain override trigger) resolved. |
| M4 - On-trip + recap | `[ASSUMPTION — EDIT: 5 weeks]` | Aug 13, 2026 | Sep 16, 2026 | Open Decision #2 (game template automation scope) resolved. Object storage and CDN provisioned. |
| M5 - Travel add-ons | `[ASSUMPTION — EDIT: 4 weeks]` | Sep 17, 2026 | Oct 14, 2026 | Open Decision #3 (direct travel booking scope) resolved. Partner/affiliate agreements in place or deferred to link-out. |

### Calendar Summary `[ASSUMPTION — EDIT]`

| **Event** | **Target Date** | **Notes** |
|---|---|---|
| Internal alpha (M1 + partial M2) | Jun 15, 2026 | Synthetic trips + automation-run / ops-supervised booking simulations with internal team. |
| Private beta (M1–M3 complete) | Aug 18, 2026 | 5-10 real golf groups with tight ops monitoring. Beta health check at 2 weeks. |
| Beta readout | Sep 17, 2026 | 30-day metrics review. Go/no-go for GA. |
| General availability | Oct 1, 2026 | U.S. public/resort/semi-private supply. M4 features live. M5 may soft-launch or follow by 2 weeks. |
| Post-launch hardening | Oct–Nov 2026 | Classification accuracy, tee-time success rate, itinerary-change clarity. |
| GA quarter review | Jan 2027 | Full metric review. Inform v2 roadmap and fundraise narrative. |

## 15.2 Recommended pilot and launch sequence

- Internal alpha with synthetic trips and automation-run / ops-supervised booking simulations.
- Private beta with 5-10 real golf groups and tight ops monitoring.
- General launch in U.S. public/resort/semi-private supply with clear service-area coverage and support expectations.
- Post-launch hardening focused on classification accuracy, tee-time success, and itinerary-change clarity.

# 16. Risks and Mitigations

| **Risk**                              | **Impact**                                                                   | **Mitigation**                                                                                                   |
|---------------------------------------|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Course access misclassification       | Users lose trust if private or unplayable courses slip into recommendations. | Default-hide unknowns, add admin curation, and provide user reporting.                                           |
| Fragmented booking systems            | Impossible to fully automate launch supply.                                  | Ship hybrid assisted-booking model and booking room from day one.                                                |
| Low review density at launch          | Community score may be weak in smaller markets.                              | Use editorial and value model as the initial backbone; collect structured reviews aggressively after each round. |
| User distrust of itinerary swaps      | Optimization may feel invasive.                                              | Default to captain approval and show transparent rationale.                                                      |
| Photo/privacy incidents               | Public embarrassment or support burden.                                      | Private by default, veto before publish, emergency takedown path.                                                |
| Betting/payment compliance complexity | Could delay or constrain monetization features.                              | Launch as ledger + settlement workflow, not pooled-funds wallet.                                                 |
| Travel partner dependency             | Direct air/lodging monetization may lag.                                     | Use link-out, affiliate, or assisted-booking fallback paths.                                                     |
| Mandatory fees reduce adoption        | Users may balk at charges if value is unclear.                               | Disclose fees early, keep pride bets free, batch and cap bet fees, and tie charges to visible value: better courses, bookings handled, and logistics simplified. |
| Licensed music not secured            | Brand concept may feel less differentiated.                                  | Do not tie core UX or launch timeline to music rights.                                                           |
| Aggregator API cart-hold restrictions | Concurrent hold requests for back-to-back tee times may be blocked by anti-bot protections, rate limits, or anti-hoarding policies, breaking the core group-booking promise. | Conduct an engineering spike during M1 to test actual API behavior against 2-3 target aggregators (see Section 11.3). Negotiate official developer API keys and group-booking access early. Design the booking orchestration service to degrade gracefully to assisted-booking when API-based concurrent holds are unavailable or restricted. Do not finalize the booking engine architecture until the spike is complete. |
| Aggregator API access and partnership terms | Target aggregators (GolfNow, Supreme Golf) may restrict API access to approved partners, impose revenue-share requirements, or limit inventory visibility in ways that constrain the product's booking and pricing model. | Begin BizDev outreach to aggregator developer-relations teams during M1, well before M2 booking-core work begins. Identify fallback aggregators and evaluate whether assisted-booking-only (no direct API) is viable as a launch posture if partnership terms are unfavorable. See Section 12.1 for vendor candidates. |

# 17. Open Decisions for the Core Team

| **Decision**                                                                           | **Owner**         | **Needed by**                  |
|----------------------------------------------------------------------------------------|-------------------|--------------------------------|
| Exact fee schedule for bookings, bets, lodging, and air.                               | Product + Finance | Before beta                    |
| Which game templates are automated at launch versus captured as notes only.            | Product + Design  | Before round-mode build        |
| Whether direct travel booking is in launch scope or gated to partner readiness.        | Product + BizDev  | Before milestone M5 starts     |
| How aggressively to expose member-sponsored private inventory in recommendations.      | Product + Ops     | Before discovery QA            |
| Whether captain override is available at any time or only after a countdown/deadlock.  | Product + Design  | Before vote board finalization |
| Minimum data required before a course can appear as recommendation-eligible.           | Product + Ops     | Before supply ingest at scale  |
| What customer-facing assisted-booking statuses and fallback actions will be shown for non-integrated booking requests. | Product + Ops     | Before public beta             |
| Whether to include weather and after-round nightlife notes in the itinerary at launch. | Product           | Optional, can slip             |

## 17.1 Blocking Classification

> **Why classify?** Without distinguishing blocking from non-blocking decisions, the team either waits for all answers (wasting time) or starts everything and discovers blockers mid-sprint. The table below maps each open decision to the earliest milestone it blocks, so work on non-dependent milestones can begin immediately.

| **#** | **Decision** | **Blocks** | **Rationale** |
|---|---|---|---|
| 1 | Exact fee schedule | M2 (Booking core) — specifically FR-67, FR-68, FR-70 | M1 planning work can proceed without finalized fee amounts. Fee engine architecture can be built with placeholder values, but actual amounts must be set before beta users see real charges. |
| 2 | Game template automation scope | M4 (On-trip + recap) — specifically FR-52 | M1–M3 do not depend on game templates. Scoring infrastructure (FR-51) can be built before this decision, but the game-mode UI requires knowing which formats are fully automated vs. notes-only. |
| 3 | Direct travel booking scope | M5 (Travel add-ons) — specifically FR-41, FR-42, FR-43 | M1–M4 do not depend on travel booking depth. The fallback path (FR-44, link-out + itinerary capture) is already in M3 itinerary scope and does not require this decision. |
| 4 | Private inventory aggressiveness | M1 (Discovery QA) — specifically FR-13, FR-20 | Discovery architecture can be built with the default "hidden" behavior, but QA and pilot testing require knowing how aggressively to surface sponsored inventory in recommendation rankings. Non-blocking for engineering start; blocking for QA sign-off. |
| 5 | Captain override trigger | M1 (Vote board) — specifically FR-27 | **Blocking for M1 design and build.** The vote board UX depends on whether the override button is always visible vs. appears only after a countdown or deadlock detection. This must be resolved before vote board design is finalized. |
| 6 | Minimum course data threshold | M1 (Supply ingest at scale) — primarily FR-23, FR-14 | Non-blocking for engineering build. Blocking for supply ops: the team needs to know how much data a course record needs before it can appear in shortlists. Can be resolved in parallel with M1 engineering work. |
| 7 | Assisted-booking states and fallback actions | M2 (Booking core, public beta) — specifically FR-76, FR-33 | Non-blocking for M1. Blocking for M2 beta: users in the booking room need clear status labels and fallback actions for non-integrated booking requests, but not a human-response SLA promise. |
| 8 | Weather and nightlife notes | None — non-blocking | Explicitly optional per the original table. Can be added at any point without affecting any milestone's critical path. |

### Recommended Resolution Sequence `[ASSUMPTION — EDIT]`

| **Priority** | **Decision #** | **Resolve By** | **Rationale** |
|---|---|---|---|
| 1 | #5 (Captain override trigger) | Before M1 design sprint (week 2) | Blocks vote board design, which is on the critical path for M1. |
| 2 | #4 (Private inventory aggressiveness) | Before M1 QA (week 6) | Does not block engineering start but blocks QA sign-off. |
| 3 | #6 (Minimum course data threshold) | Before M1 QA (week 6) | Same rationale — supply ops needs this to seed data for pilot. |
| 4 | #1 (Fee schedule) | Before M2 build start (week 9) | Fee engine can be architected with placeholders, but amounts needed for M2 build. |
| 5 | #7 (Assisted-booking states and fallback actions) | Before beta launch (week 20) | Needed for beta UX but not for engineering build. |
| 6 | #2 (Game templates) | Before M4 build start (week 20) | No upstream dependency. |
| 7 | #3 (Direct travel booking) | Before M5 build start (week 24) | No upstream dependency. |
| 8 | #8 (Weather/nightlife) | Whenever convenient | Non-blocking. |

# 18. Build-Ready Checklist by Function

| **Function**     | **Ready when**                                                                                                                           |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Product          | User flows, fee logic, swap policy, and launch scope are frozen; legal/compliance assumptions are documented.                            |
| Design           | Responsive designs exist for the core twelve screens, including round mode, booking room, and photo consent flows.                       |
| Engineering      | Entity model, workflow jobs, integration contracts, and admin console requirements are decomposed into implementation tickets.           |
| Ops              | Course-classification process, editorial scoring rubric, membership verification process, and assisted-booking / exception-handling playbook are documented. |
| Data / analytics | KPI definitions and event taxonomy are implemented before beta.                                                                          |

> **Bottom line**
>
> If the team executes only one thing exceptionally well, it should be this: convert a chaotic group chat into a booked, improving golf trip that the users trust. Everything else - side bets, recaps, branded flair, even optional travel - becomes more valuable once that operating system is in place.

# Appendix A. Launch Glossary

| **Term**               | **Definition**                                                                                                                 |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Anchor                 | The place from which search and itinerary convenience are calculated, such as an airport code, city, or destination region.    |
| Playable inventory     | Courses the current group can realistically book and play, given public access or verified member-sponsored access.            |
| Trip option            | A recommended itinerary candidate, destination package, or course mix shown in the vote board.                                 |
| Booking room           | A coordinated view used when multiple users, automation, or concierge ops must secure one or more tee times during the same booking window. |
| Swap / rebooking       | Replacing a current reservation with a better-fit confirmed reservation before the trip freeze date.                           |
| Community golfer score | The in-app user review score, shown separately from editorial/external/value signals.                                          |
| Trip fit score         | The product-owned recommendation score that accounts for quality, value, access, budget, availability, and convenience.        |
| Microsite              | The shareable recap page for a completed trip, built from approved photos and trip highlights and unlisted/noindex by default. |

# Appendix B. Priority shorthand

| **Priority** | **Meaning**                                                                    |
|--------------|--------------------------------------------------------------------------------|
| P0           | Launch-critical. Without this, the v1 product promise is broken.               |
| P1           | High-value and near-term. Can slip only if required to protect launch quality. |
| P2           | Explicitly post-launch or dependency-gated.                                    |

# Appendix C. Summary of v2 Additions

> **What changed between v1 and v2?** This appendix lists every section added in v2 for easy review. No original v1 text was modified or removed.

| **Section** | **What was added** | **Why** |
|---|---|---|
| 4.2 | User Stories by persona (collaborator, captain, member sponsor, ops concierge, new invitee) | Provides estimable, testable scenarios organized by role. Exposes edge cases not visible in requirements tables. |
| 5.2.1 | Non-goal rationale table | Prevents repeated re-litigation of scope decisions by documenting the "why" behind each exclusion. |
| 6.1 | P0 sub-tiering (P0-Core vs. P0-Launch) | Separates the minimum viable planning-to-booking loop from features that can trail by one or more milestones, enabling earlier alpha validation. |
| 8.7.1 | Swap suggestion constraints | Defines behavioral guardrails for the optimization engine: quality thresholds, frequency limits, decline behavior, day/time stability, cost ceilings, and cancellation safety margins. |
| 8.16 | Acceptance criteria addendum for all P0 requirements | Provides testable Given/When/Then criteria separated from implementation notes. Enables unambiguous QA and sprint-review pass/fail decisions. |
| 9.2 | Accessibility acceptance criteria by screen | Operationalizes the WCAG 2.2 AA commitment with specific, testable requirements for the highest-risk screens (score entry, vote board, booking room, photo review, discovery map). |
| 10 (intro) | Data model scope disclaimer | Clarifies that the entity model is an illustrative domain reference, not a schema contract, and that Engineering owns implementation-level decisions. |
| 14.1 | Success metric targets, measurement plans, and evaluation cadence | Adds numeric targets (30-day and 90-day), measurement methods, and a review calendar so the team can answer "did this work?" |
| 15.1 | Milestone duration estimates, calendar targets, and team-size assumptions | Converts the milestone sequence into a datable plan with dependencies, enabling stakeholders and ops to align their own timelines. |
| 17.1 | Open decision blocking classification and resolution sequence | Maps each decision to the milestone it blocks and recommends a resolution order, so engineering can start non-dependent work immediately. |
| 8.13.1 | Trip cost splitting and reimbursement (FR-80 through FR-83) | Addresses the Trip Captain reimbursement problem — tracking shared expenses, calculating net balances, and facilitating settlement via external payment apps. |
| 8.16 (FR-27) | Captain override visibility acceptance criterion | Ensures non-captain members see a clear indicator when a decision was made via override rather than consensus. |
| 11.3 | Concurrent cart-hold constraint: potential design direction | Documents the all-or-nothing concurrent-hold pattern as a candidate architecture for back-to-back tee-time booking, with explicit unknowns and a recommendation for an M1 engineering spike. |
| 12.1 | Vendor candidates to evaluate | Names specific vendors (GolfNow, Supreme Golf, NGF, Airbnb/VRBO, Stripe Connect, Venmo/Zelle/PayPal/Cash App) as starting points for engineering and BizDev evaluation. |
| 16 (table) | Two new risks: aggregator API cart-hold restrictions and aggregator partnership terms | Captures the operational risks of anti-bot protections, rate limits, and unfavorable partnership terms that could constrain the booking engine. |
| Appendix C | This summary | Quick reference for reviewers to see what changed. |
