# Aggregator API Research Findings

> **Spike type**: Research / technical investigation
> **Date**: 2026-03-13
> **Status**: Draft — live API verification pending (WebSearch/WebFetch were unavailable during this research session; findings below are based on training knowledge through mid-2025 and PRD context. Items marked `[NEEDS LIVE VERIFICATION]` require follow-up with actual web research, developer portal access, or vendor outreach.)
> **PRD references**: Section 11.3 (Concurrent Cart-Hold Constraint), Section 12.1 (Vendor Candidates), FR-29 through FR-34

---

## 1. Provider Analysis

### 1.1 GolfNow / GN Connect API

**Company context.** GolfNow is owned by NBC Sports / Golf (a Comcast subsidiary, formerly Golf Channel). It is the largest tee-time marketplace in the U.S., with relationships to 9,000+ courses. GolfNow operates both a consumer marketplace (golfnow.com) and provides tee-sheet software to courses via its **G1** platform (formerly part of the EZLinks acquisition).

**API availability.**
- **GN Connect** is a B2B distribution API that allows approved partners to access GolfNow's tee-time inventory programmatically. It is NOT a public developer API — access requires a business relationship and a signed distribution agreement.
- No public developer portal or self-serve API key registration has been observed. There is no `developer.golfnow.com` equivalent. `[NEEDS LIVE VERIFICATION]`
- GN Connect exposes endpoints for: inventory search (course, date, time, player count), pricing, and booking. The exact endpoint structure and authentication method (likely OAuth2 client credentials or API key) are disclosed only under NDA/partnership agreement. `[NEEDS LIVE VERIFICATION]`

**Cart-hold behavior (inferred).**
- The consumer GolfNow checkout flow uses a cart-hold model: selecting a tee time creates a temporary reservation (typically 5-10 minutes) during which the user completes payment. If payment is not completed, the hold expires and inventory is released.
- Whether the GN Connect API exposes an explicit `hold` endpoint (vs. a direct `book` endpoint that charges immediately) is **unknown and critical to our architecture**. `[NEEDS LIVE VERIFICATION]`
- GolfNow's consumer site has bot-detection (Cloudflare, CAPTCHA challenges), suggesting they actively prevent automated scraping/booking. An official API partnership would bypass these protections.

**Pricing model.** GolfNow's distribution model typically involves:
- Hot Deals: courses give GolfNow blocks of tee times at steep discounts in exchange for marketing exposure. GolfNow takes a commission or buys the inventory at wholesale.
- Marketplace listings: courses list available times at their preferred prices; GolfNow takes a booking fee (typically $2-$4 per golfer or a percentage).
- For API partners, the revenue-share model would be negotiated. Expect either a per-transaction fee or a commission split. `[NEEDS LIVE VERIFICATION]`

**Access requirements.**
- Business development outreach required. Contact NBC Sports Golf / GolfNow partnership team.
- Likely requirements: demonstrated distribution value (user base, marketing reach), insurance/liability coverage, compliance with their booking terms.
- Timeline expectation: 2-6 months from initial outreach to API access, based on typical enterprise B2B API partnerships. `[NEEDS LIVE VERIFICATION]`

**Limitations.**
- Inventory is GolfNow's core asset — they may restrict API access to prevent competitors from building a better consumer experience on top of their supply.
- Multi-hold (holding multiple tee times simultaneously for the same group) is likely restricted or not supported by default. This is the critical gap for our concurrent-hold architecture (PRD Section 11.3).
- GolfNow may require that bookings made through their API display GolfNow branding or redirect users to their checkout flow ("powered by GolfNow" model).

**Assessment: HIGH VALUE, HIGH DIFFICULTY.** Largest inventory but hardest partnership to secure. Early outreach essential.

---

### 1.2 Supreme Golf API

**Company context.** Supreme Golf is a tee-time meta-search aggregator. Unlike GolfNow (which operates its own tee-sheet software and has direct course relationships), Supreme Golf aggregates inventory from **multiple sources** including GolfNow, TeeOff, and potentially direct course feeds. Think of it as the "Kayak of golf tee times."

**API availability.**
- Supreme Golf does not appear to offer a public developer API. `[NEEDS LIVE VERIFICATION]`
- Their business model is consumer-facing (supremegolf.com, mobile apps) with monetization through booking commissions and advertising.
- A partnership/affiliate API may exist for approved partners, but this would require business development outreach similar to GolfNow.

**Coverage model.**
- Supreme Golf's value proposition is breadth: they claim to aggregate tee times from 15,000+ courses by pulling from multiple booking platforms. `[NEEDS LIVE VERIFICATION]`
- Coverage sources likely include: GolfNow/TeeOff inventory, foreUP courses, Chronogolf/Lightspeed courses, and potentially direct course website scraping or feed agreements.
- This makes Supreme Golf interesting as a **single integration point for broad coverage**, but the abstraction layer introduces latency and reduces control over booking mechanics.

**Cart-hold behavior.**
- Supreme Golf's checkout flow forwards users to the underlying booking platform for payment. The hold behavior would depend on the source platform (GolfNow hold window for GolfNow-sourced times, etc.).
- A Supreme Golf API partnership would need to clarify whether holds are managed at the Supreme Golf layer or passed through to the underlying platform. `[NEEDS LIVE VERIFICATION]`

**Limitations.**
- Aggregator-of-aggregators model means: longer latency, less reliable availability data (stale inventory), and less control over the booking experience.
- If Supreme Golf sources from GolfNow, we'd effectively be double-intermediated (us → Supreme Golf → GolfNow → course), which adds cost and reduces reliability.
- Supreme Golf may have been acquired or changed their model — status needs verification. `[NEEDS LIVE VERIFICATION]`

**Assessment: MEDIUM VALUE, MEDIUM DIFFICULTY.** Useful as a breadth play if direct GolfNow access is unavailable, but adds a layer of indirection.

---

### 1.3 TeeOff.com

**Company context.** TeeOff.com is a GolfNow property — it is a subsidiary/brand within the NBC Sports Golf / GolfNow ecosystem. It was originally a separate company (acquired by GolfNow's parent).

**API availability.**
- TeeOff.com does not have a separate API program. Its inventory is a subset of GolfNow's inventory (focused on discounted "hot deal" style tee times).
- Integrating with TeeOff would effectively happen through a GN Connect partnership.
- There is no meaningful reason to pursue TeeOff separately from GolfNow.

**Assessment: REDUNDANT with GolfNow.** Pursue via GN Connect.

---

### 1.4 Chronogolf / Lightspeed Golf

**Company context.** Chronogolf was a Canadian golf management software company (tee-sheet, POS, membership management) that was acquired by **Lightspeed Commerce** (TSX: LSPD) in 2019. It now operates as **Lightspeed Golf**. Lightspeed is a major commerce platform, which gives Chronogolf/Lightspeed Golf more technical resources and API maturity than most golf-specific vendors.

**API availability.**
- Lightspeed Commerce has a well-documented REST API platform for its retail and restaurant products. `[NEEDS LIVE VERIFICATION — does the Golf vertical have API parity?]`
- Chronogolf/Lightspeed Golf historically had an API for tee-sheet integration used by resort and course-group management companies. Whether this is available to third-party consumer-facing platforms is unclear.
- Documentation, if it exists, would likely be at `developers.lightspeedhq.com` or similar. `[NEEDS LIVE VERIFICATION]`

**Coverage.** Lightspeed Golf is estimated to serve 500-1,000+ courses, primarily in Canada but with growing U.S. presence, especially among resort and premium municipal courses. `[NEEDS LIVE VERIFICATION]`

**Integration approach.** If API access exists, this would be a **direct tee-sheet integration** (not aggregator). This means:
- Real-time inventory accuracy (no stale data problem).
- Potential access to hold/book mechanics at the course level.
- But: only covers courses that use Lightspeed Golf software.

**Assessment: MEDIUM VALUE, MEDIUM DIFFICULTY.** Worth pursuing for the courses it covers; Lightspeed's commerce DNA suggests better-than-average API quality. Good complement to an aggregator integration.

---

### 1.5 foreUP

**Company context.** foreUP is a cloud-based golf course management platform (tee-sheet, POS, CRM) based in Utah. It serves primarily U.S. courses, with strong penetration in municipal and daily-fee segments.

**API availability.**
- foreUP has a documented REST API used for integrations with other golf industry tools. `[NEEDS LIVE VERIFICATION — is it available to consumer-facing third parties?]`
- Their API has historically been available to approved integration partners, not as a public self-serve developer program.
- Known integrations exist with other golf industry platforms, suggesting API access is feasible with a partnership agreement.

**Coverage.** foreUP serves an estimated 1,000-2,000+ courses in the U.S. `[NEEDS LIVE VERIFICATION]` Strong in public/municipal and daily-fee segments, which aligns well with our "playable inventory" focus.

**Integration approach.** Direct tee-sheet integration similar to Lightspeed Golf:
- Real-time inventory from courses running foreUP software.
- Booking would go directly through foreUP's system.
- Hold mechanics would depend on foreUP's booking flow configuration per course.

**Assessment: MEDIUM-HIGH VALUE for U.S. coverage.** Municipal/daily-fee strength aligns with our access model. Worth pursuing in parallel with aggregator outreach.

---

### 1.6 EZLinks Golf

**Company context.** EZLinks was a golf tee-time distribution and technology platform. It was **acquired by GolfNow** (then Golf Channel Solutions) around 2015-2016. EZLinks' distribution network was folded into GolfNow's platform.

**API availability.**
- EZLinks as a standalone entity no longer exists in a meaningful way. Its technology and course relationships were absorbed into GolfNow's G1 platform and distribution network.
- Any EZLinks API endpoints that may have existed are likely deprecated or migrated to GN Connect.

**Assessment: DEPRECATED / absorbed into GolfNow.** Not a separate integration target.

---

### 1.7 Club Prophet

**Company context.** Club Prophet is a golf course management software system (tee-sheet, POS, handicapping) that has been in the market for a long time, primarily serving smaller or independent courses.

**API availability.**
- Club Prophet has historically had limited or no public API. It is a more traditional on-premise or hosted software product, not an API-first cloud platform.
- Integration typically requires custom development or use of Club Prophet's proprietary data export mechanisms.
- The course segment using Club Prophet tends to be smaller independent courses that may not be high-priority targets for a trip-focused product (which skews toward destination/resort courses).

**Assessment: LOW VALUE, HIGH DIFFICULTY.** Limited API surface, smaller course segment, and not aligned with our target supply. Deprioritize.

---

### 1.8 Other Notable Platforms

**GOLF Business Solutions (formerly Club Caddie)**
- Cloud-based tee-sheet and management platform with growing market share. `[NEEDS LIVE VERIFICATION]`
- May have API capabilities worth investigating as tee-sheet market evolves.

**TeeSnap**
- Mobile-first tee-sheet platform serving smaller courses.
- Limited API availability expected. Low priority for our use case.

**Jonas Club Software / Northstar Club Management**
- Enterprise club management systems for private clubs.
- Not relevant for public/playable inventory.

**Quick18 / GolfBack / other smaller aggregators**
- Various smaller tee-time aggregation services exist.
- May offer affiliate or API programs but with limited coverage.
- GolfBack in particular offers a distribution API for courses using its platform. `[NEEDS LIVE VERIFICATION]`

---

## 2. Cart-Hold Pattern Analysis

### 2.1 How Cart-Hold Works in Golf Booking

The golf tee-time booking flow typically follows this pattern:

1. **Search**: User queries for available times at a course on a given date.
2. **Select**: User selects a specific tee time. At this point, most platforms create a **temporary hold** (also called cart reservation, pending booking, or lock).
3. **Hold window**: The selected time is removed from available inventory for a fixed period (typically **5-10 minutes** on most platforms). `[NEEDS LIVE VERIFICATION — exact windows per platform]`
4. **Checkout**: User provides payment information and confirms the booking within the hold window.
5. **Confirmation or expiry**: If checkout completes, the booking is confirmed. If the hold expires, inventory is released back to the pool.

### 2.2 Hold Windows by Platform (Estimated)

| Platform | Estimated Hold Window | Source |
|----------|----------------------|--------|
| GolfNow (consumer) | 7-10 minutes | Inferred from consumer checkout flow `[NEEDS LIVE VERIFICATION]` |
| GolfNow (GN Connect API) | Unknown — may differ from consumer | `[NEEDS LIVE VERIFICATION]` |
| Supreme Golf | Depends on underlying platform | Pass-through model |
| foreUP | Configurable per course (typically 5-10 min) | `[NEEDS LIVE VERIFICATION]` |
| Lightspeed Golf | Unknown | `[NEEDS LIVE VERIFICATION]` |

### 2.3 Multi-Hold Restrictions

This is the **critical architectural question** for our concurrent-hold pattern (PRD Section 11.3):

**The problem restated.** For a group of 6, we need to hold TWO tee times simultaneously (e.g., 8:00 AM and 8:10 AM). Sequential booking creates a race condition where a stranger can claim the second slot while we're checking out the first.

**Known constraints:**
- **Anti-hoarding rules**: Most platforms limit the number of active holds per user/session/IP to prevent inventory hoarding. A single account holding 2-3 consecutive tee times may trigger these restrictions.
- **Rate limiting**: Rapid successive hold requests from a single IP/API key may be rate-limited or blocked.
- **Account-level restrictions**: Some platforms tie holds to a registered user account, making it impossible to hold multiple times under one account simultaneously without explicit group-booking support.

**Potential workarounds (each with risks):**
1. **Negotiate group-booking endpoints** with the aggregator. Best approach but requires partner cooperation.
2. **Use multiple API keys/accounts** to hold slots concurrently. Violates most ToS and risks account termination.
3. **Sequential book-then-hold**: Fully complete the first booking, then hold the second. Eliminates the race condition window but commits the captain to payment on the first slot before knowing if the second is available. Rollback requires cancellation (which may incur fees or have a delay).
4. **Assisted-booking fallback**: For multi-slot scenarios, fall back to ops-assisted booking where a human concierge coordinates with the course pro shop directly (phone/email).

### 2.4 Anti-Bot Protections

Golf booking platforms employ various anti-automation measures:

- **Cloudflare / WAF**: GolfNow and many course websites use Cloudflare or similar CDN/WAF services that detect and block automated requests.
- **CAPTCHA challenges**: Consumer checkout flows often include CAPTCHA or invisible reCAPTCHA.
- **IP rate limiting**: Rapid requests from server IPs (vs. residential IPs) trigger blocks.
- **Browser fingerprinting**: Some platforms verify that requests come from real browsers.

**Implication**: Scraping/automating consumer checkout flows is not viable. Official API access (which bypasses these protections by design) is the only sustainable path.

---

## 3. Architecture Recommendation

### 3.1 Provider Priority (Recommended Outreach Order)

| Priority | Provider | Rationale |
|----------|----------|-----------|
| **P0** | **GolfNow (GN Connect)** | Largest U.S. inventory. Single integration covers the most supply. Start BizDev outreach immediately even though timeline is long. |
| **P1** | **foreUP** | Strong U.S. municipal/daily-fee coverage. Direct tee-sheet integration = real-time accuracy. More likely to grant API access to a startup than GolfNow. |
| **P1** | **Lightspeed Golf (Chronogolf)** | Good API maturity (Lightspeed Commerce DNA). Growing U.S. presence. Resort/premium segment coverage. |
| **P2** | **Supreme Golf** | Fallback aggregator if GolfNow access is delayed or denied. Breadth play. |
| **P2** | **GolfBack** | Worth investigating as a smaller distribution API with potentially easier access. `[NEEDS LIVE VERIFICATION]` |
| **P3** | **Club Prophet, TeeSnap, others** | Low priority. Only if we need to fill specific geographic gaps after P0-P2 integrations. |

### 3.2 Abstraction Layer Design

The Booking Orchestration Service (PRD Section 11.1) should implement a **provider abstraction layer** that normalizes the interface across different booking backends:

```
BookingProvider (interface)
├── search(course, date, players) → AvailableTeeTime[]
├── hold(teeTimeId, players, paymentToken?) → Hold { id, expiresAt }
├── confirm(holdId, paymentDetails) → Confirmation
├── release(holdId) → void
├── status(holdId) → HoldStatus
└── cancel(confirmationId) → CancellationResult

Implementations:
├── GolfNowProvider (GN Connect API)
├── ForeUpProvider (foreUP API)
├── LightspeedGolfProvider (Chronogolf/Lightspeed API)
├── SupremeGolfProvider (Supreme Golf API)
├── AssistedBookingProvider (ops queue — no API, human workflow)
└── ExternalCaptureProvider (link-out + manual capture form, FR-44)
```

**Key design principles:**
1. **Every course maps to exactly one provider** (avoid double-booking through multiple aggregators).
2. **AssistedBookingProvider is always available** as the universal fallback — it creates an ops queue item instead of making API calls.
3. **ExternalCaptureProvider** handles the link-out pattern (FR-44) where we can't book programmatically but can track the booking.
4. **Provider selection is per-course metadata**, stored in the course record (FR-29) and configurable by ops.

### 3.3 Fallback Hierarchy

For any booking attempt, the system should try providers in this order:

```
1. Direct API provider (GolfNow, foreUP, Lightspeed) — if course is mapped to one
   ↓ (on failure: API error, hold unavailable, rate limited)
2. Guided checkout — deep-link user to the provider's consumer checkout with pre-filled details
   ↓ (on failure: user reports inability to complete)
3. Assisted booking — create ops queue item for concierge to handle via phone/email
   ↓ (on failure: concierge cannot secure the time)
4. External capture — provide link to course website, user books independently and captures confirmation
```

This maps directly to the booking modes in FR-33: `direct | guided_checkout | assisted`.

### 3.4 Concurrent Hold Pattern (Revised Recommendation)

Given the uncertainty around multi-hold API support, the architecture should support **three strategies** and select based on provider capabilities:

**Strategy A: True Concurrent Hold (ideal)**
- Fire parallel hold requests for all required tee-time slots.
- All-or-nothing: if any hold fails, release all holds and suggest alternatives.
- Requires: provider API supports multiple active holds per API key/account AND hold-endpoint is exposed.
- Estimated feasibility: LOW without explicit group-booking API support from the provider. `[NEEDS LIVE VERIFICATION]`

**Strategy B: Sequential Book-then-Hold (pragmatic)**
- Book the first tee time (full commitment, captain's card charged).
- Immediately hold the second tee time.
- If second hold fails: captain has a confirmed first booking and can decide whether to keep it or cancel (within cancellation window).
- Tradeoff: captain takes financial risk on first booking before second is confirmed.
- Estimated feasibility: MEDIUM — most APIs support sequential operations.

**Strategy C: Assisted Concurrent Hold (ops-assisted)**
- For courses without API hold support, the concierge calls the pro shop and requests both tee times simultaneously as a group booking.
- Many pro shops are accustomed to group booking requests and can hold multiple times via their tee-sheet software.
- This is the most reliable approach for launch but does not scale.
- Estimated feasibility: HIGH — this is how group golf trips are booked today.

**Recommended launch approach:**
- Default to Strategy C (assisted) for all multi-slot bookings.
- Implement Strategy B as soon as any API integration is live.
- Implement Strategy A only after confirming multi-hold support with a specific provider (likely requires negotiated group-booking API access).
- The booking room UI (FR-32) should be designed to handle all three strategies transparently.

---

## 4. Impact on M2 Design

### 4.1 What to Design Now (M1 timeframe)

These architectural decisions should be made during M1, before M2 kicks off:

1. **BookingProvider interface definition.** Define the abstract interface (search, hold, confirm, release, cancel) even before any provider is integrated. This lets M2 development proceed against the interface while API access is being negotiated.

2. **Course-to-provider mapping data model.** Each course record (FR-29) needs a `booking_provider` field and provider-specific metadata (API course ID, channel rules, etc.). This should be part of the course data model in M1.

3. **Assisted booking queue design.** The AssistedBookingProvider (ops queue) is the universal fallback and will be the **only booking path at launch** if API partnerships are not yet secured. The ops console (FR-76) and booking room (FR-32) should be designed to work well with this provider.

4. **Hold state machine.** Design the state machine for booking attempts: `pending → attempting → held → confirming → confirmed | failed | expired`. This is provider-agnostic and can be implemented in M2 regardless of which providers are live.

### 4.2 What Can Wait (Design After API Access)

1. **Provider-specific implementations.** The actual GolfNow, foreUP, or Lightspeed provider implementations require API documentation that we don't have yet. Don't design these in detail until API access is granted.

2. **Concurrent hold orchestration.** The specific mechanics of Strategy A (true concurrent holds) depend on provider API capabilities. Design the booking room to support all three strategies, but don't optimize for Strategy A until it's confirmed as feasible.

3. **Payment flow optimization.** The captain-pays-upfront model (PRD Section 11.3) is the pragmatic v1 approach regardless. Don't design split-payment-at-checkout flows until hold windows and provider capabilities are confirmed.

4. **Rate limit handling.** Specific retry strategies, backoff patterns, and rate-limit headers depend on the actual API. Design for generic error handling; tune after integration.

---

## 5. BizDev Action Items

### 5.1 Immediate Outreach (Start Now)

| Action | Target | Contact Path | Goal |
|--------|--------|-------------|------|
| GolfNow partnership inquiry | NBC Sports Golf / GolfNow partnerships | Look for partnership page on golfnow.com or nbcsgolf.com; LinkedIn outreach to Head of Partnerships or BD | Understand GN Connect terms, pricing, and whether group-booking API support is possible |
| foreUP integration inquiry | foreUP | Contact via foreup.com partnership/integration page; LinkedIn outreach to product or integration team | Request API documentation and discuss integration partnership |
| Lightspeed Golf inquiry | Lightspeed Commerce / Lightspeed Golf | developer.lightspeedhq.com and Lightspeed Golf partnership page | Determine if Golf vertical API is available to third-party booking platforms |

### 5.2 Secondary Outreach (Weeks 2-4)

| Action | Target | Goal |
|--------|--------|------|
| Supreme Golf partnership | Supreme Golf | Evaluate as fallback aggregator; understand their API availability and coverage model |
| GolfBack evaluation | GolfBack | Determine API availability and course coverage |
| NGF data licensing | National Golf Foundation | Course metadata licensing for supply seeding (separate from booking — supports Discovery service) |

### 5.3 Timeline Expectations

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Initial outreach | Weeks 1-2 | Emails/calls sent to all P0/P1 targets |
| Response and evaluation | Weeks 3-6 | At least 1 provider responds with API documentation or partnership terms |
| Agreement negotiation | Weeks 6-12 | Terms agreed with at least 1 provider |
| Integration development | Weeks 12-16 | First provider integration live in staging |
| Production launch | Weeks 16-20 | First API-booked tee time in production |

**Critical path note:** If GolfNow outreach is delayed past M1, API-based booking will almost certainly not be available for M2 launch. The assisted-booking path must be production-ready regardless.

---

## 6. Open Unknowns

### 6.1 High-Risk Unknowns (Block Architecture Decisions)

| Unknown | Why It Matters | How to Resolve |
|---------|---------------|----------------|
| Does GN Connect expose a `hold` endpoint? | Determines whether concurrent-hold pattern is feasible via API | BizDev outreach + API documentation review |
| Can a single GN Connect account hold multiple tee times simultaneously? | Core requirement for group booking without ops intervention | Ask explicitly during partnership discussion |
| What are GolfNow's terms for third-party consumer experiences? | May require "powered by GolfNow" branding, redirect to their checkout, or restrict our UX | Partnership terms review |
| Is Supreme Golf still operating and offering API access? | Affects our fallback aggregator strategy | Web research + outreach `[NEEDS LIVE VERIFICATION]` |
| Does foreUP allow consumer-facing third-party booking via their API? | Their API may be restricted to course-facing tools only | Direct outreach |

### 6.2 Medium-Risk Unknowns (Affect Implementation Details)

| Unknown | Why It Matters | How to Resolve |
|---------|---------------|----------------|
| Exact hold window durations per provider | Affects checkout flow timing and concurrent-hold timeout logic | API documentation + testing |
| Rate limits per provider | Affects how many booking attempts we can make per minute | API documentation |
| Cancellation API availability | Determines whether we can programmatically cancel vs. requiring user/ops action | API documentation |
| Provider-specific course ID mapping | Need to map our course records to each provider's course identifiers | Data reconciliation during integration |
| Price accuracy and real-time availability | Aggregator prices may be stale; direct tee-sheet integrations are more reliable | Test during integration |

### 6.3 Strategic Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **No API access from any aggregator** | All booking must go through assisted (ops) or external capture (link-out) paths. Higher ops cost, slower booking, worse UX. | Design the product to work well with assisted booking from day one. API integrations improve the experience but must not be required for launch. (This aligns with PRD Section 12 dependency strategy.) |
| **API access granted but without multi-hold support** | Concurrent-hold pattern not feasible via API. Multi-slot bookings require Strategy B (sequential) or Strategy C (assisted). | Design booking room to support all three strategies. Accept that group booking will be ops-assisted at launch for most courses. |
| **GolfNow views us as a competitor** | Partnership denied or offered on unfavorable terms (high commission, branding requirements, restricted UX). | Pursue foreUP and Lightspeed as alternative direct integrations. Position ourselves as a demand channel that drives bookings to their platform, not a competitor that replaces them. |
| **Tee-sheet market consolidation** | If GolfNow acquires foreUP or Lightspeed, our diversified integration strategy collapses to a single provider dependency. | Maintain the provider abstraction layer so switching is low-cost. Keep assisted-booking path robust. |
| **Legal/compliance issues with automated booking** | State-level seller-of-travel regulations, PCI compliance for holding payment credentials, ToS violations if using APIs outside their intended scope. | Legal review before any API integration goes live. Only use officially sanctioned API endpoints. (Aligns with PRD Section 13: "Any automation against third-party booking systems should respect permitted integration patterns.") |

---

## Appendix A: Golf Tee-Sheet Software Market Map

Understanding which courses use which tee-sheet software is important because **the tee-sheet vendor determines the integration path**.

| Tee-Sheet Vendor | Estimated U.S. Course Count | Segment | API Likelihood | Notes |
|-----------------|---------------------------|---------|---------------|-------|
| GolfNow G1 (incl. EZLinks) | 5,000-9,000 | Broad (all segments) | Via GN Connect only | Dominant player |
| foreUP | 1,000-2,000 | Municipal, daily-fee | Moderate (partner API) | Strong in public courses |
| Lightspeed Golf (Chronogolf) | 500-1,000 | Resort, premium muni | Moderate (Lightspeed Commerce API platform) | Growing U.S. presence |
| Club Prophet | 500-1,000 | Small independent | Low | Legacy software |
| GOLF Business Solutions | 300-800 | Various | Unknown | Growing platform `[NEEDS LIVE VERIFICATION]` |
| TeeSnap | 200-500 | Small courses | Low | Mobile-first |
| Jonas / Northstar | 500+ | Private clubs | Not relevant | Private club focus |
| Custom / proprietary | 1,000+ | Various | Very low | Phone/email only |

> Course counts are rough estimates from training data. `[ALL NEED LIVE VERIFICATION]`

**Key insight:** GolfNow's tee-sheet software (G1) + distribution network (GN Connect) covers the largest share of U.S. courses. However, a significant portion of the "trip-worthy" public/resort courses we care about use foreUP or Lightspeed Golf. A two-provider strategy (GN Connect + foreUP or Lightspeed) could cover 60-80% of target supply. `[ESTIMATE — NEEDS VERIFICATION]`

---

## Appendix B: How Golf Booking Platforms Work Technically

### The Two-Sided Model

Golf booking platforms serve two sides:
1. **Course-facing (tee-sheet software)**: Manages the course's tee-time inventory, pricing, customer records, POS, and operations.
2. **Consumer-facing (marketplace/distribution)**: Exposes available tee times to golfers for search and booking.

Some companies do both (GolfNow with G1 + golfnow.com), while others do only one side (foreUP is primarily course-facing; Supreme Golf is primarily consumer-facing).

### Inventory Flow

```
Course pro shop sets availability in tee-sheet software
  → Tee-sheet syncs available times to distribution channels
    → Distribution channel (GolfNow, course website) displays available times
      → Golfer selects a time → Hold created in tee-sheet
        → Golfer completes checkout → Booking confirmed in tee-sheet
          → Confirmation sent to golfer and course
```

### Why This Is Hard for Group Booking

The entire system is designed for **individual or single-foursome booking**. Group booking (multiple tee times for the same party) is a **human workflow** at most courses:
- The group leader calls the pro shop.
- The pro shop manually blocks out consecutive tee times in the tee-sheet.
- Payment is handled over the phone or on arrival.

No major booking platform has productized multi-slot group booking as a self-serve API feature. This is a genuine market gap that our product addresses — but it means we cannot rely on existing APIs to solve it automatically.

### Implication for Our Product

The PRD's hybrid model (FR-33) is the correct approach:
- **Direct API** where available: automates search and single-slot booking.
- **Guided checkout** where API booking isn't available but the provider has a web checkout: deep-link the user with context.
- **Assisted booking** as universal fallback: ops concierge calls the pro shop, which is how group golf trips have always been booked.

The M2 Booking Orchestration Service should be optimized for **making assisted booking excellent** first, with API integrations as progressive enhancements that reduce ops load over time.
