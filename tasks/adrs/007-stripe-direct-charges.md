# ADR 007: Direct Stripe Charges over Stripe Connect

## Status

Accepted

## Context

The platform collects service fees from trip captains (FR-67, FR-68). The M2 billing model:

- Fee types include `tee_time_service`, `cancellation_penalty`, `lodging_service`, `pass_through` (defined in `src/types/index.ts`)
- Fees are created at booking confirmation (`pending`), become collectible when a cancellation threshold is crossed, and are charged via Stripe (`src/services/billing/state-machines/fee-charge-sm.ts`)
- At launch, the captain pays the course directly (phone/in-person for assisted bookings). The platform only charges its own service fees.
- No need to split payments to course suppliers or pay out to third parties at launch

Stripe Connect was the PRD's candidate (Section 12.1) for marketplace-style payouts. The M2 booking core plan (`docs/m2-booking-core-plan.md`) re-evaluated this given the assisted-booking-first strategy.

## Decision

Use **direct Stripe charges** (standard Stripe API with `PaymentIntent`) instead of Stripe Connect for M2.

- `stripe@20.4.x` is already installed (`package.json`)
- Platform creates Stripe Customers for trip captains, stores PaymentMethod references
- Fee charges use `PaymentIntent.create()` with the platform's own Stripe account
- Webhook handler at `/api/webhooks/stripe/` processes payment confirmations and failures
- No connected accounts, no `transfer_data`, no `application_fee_amount`

## Consequences

**What we gained:**

- Dramatically simpler Stripe integration. No connected account onboarding, no KYC flows for courses, no payout scheduling.
- Faster time to market. Direct charges require ~2 days of integration work vs. ~2 weeks for Connect with onboarding flows.
- Lower Stripe fees. Direct charges incur standard processing fees (2.9% + 30c) without the additional Connect platform fee.
- Simpler fee charge state machine: `pending -> collectible -> charged -> refunded` with no split-payment coordination.

**What we gave up:**

- Cannot automatically pay courses or suppliers through the platform. All course payments happen outside the platform (captain pays course directly, either in-person or via the course's own payment system).
- Cannot offer a unified checkout where the captain pays the platform and the platform pays the course in one transaction.
- If the business model evolves to include marketplace-style supplier payouts, a migration to Stripe Connect will be needed. This is a non-trivial migration involving connected account creation, payout scheduling, and regulatory compliance.

**Risks:**

- If product-market fit requires "book and pay in one place" before API integrations are live, this decision delays that capability. Accepted because assisted booking inherently separates platform fees from course payment.
- Refund handling must be managed carefully. The `refunded` state in the fee charge state machine triggers a `PaymentIntent` refund, but the course payment refund is handled separately by the concierge.
