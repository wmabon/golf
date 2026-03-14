---
name: ui-tone
description: Use this skill whenever building, reviewing, or writing copy for any user-facing screen or component in the golf trip app. This includes frontend components, UI copy, error messages, confirmation dialogs, notification text, empty states, loading states, button labels, and page headings. Also trigger when making design decisions about how a screen should feel, when reviewing a PR for UI/UX consistency, or when someone asks about the app's brand voice or visual tone. If the task involves any screen listed in PRD Section 9.1 (trip home, discovery, course detail, vote board, booking room, round mode, photo review, microsite editor), use this skill.
---

# UI Tone: Two-Mode Design

This app operates in two distinct modes that must coexist without blending. The PRD calls this "fun on the surface, disciplined underneath." Every screen, component, and line of copy falls into one mode or the other. Never mix them.

## Mode 1: Social Energy (fun, rowdy, celebratory)

**Where it applies:**
- Trip home dashboard (status updates, group activity)
- Course discovery and search results
- Course detail page (reasons-to-play, vibe descriptions)
- Vote board (voting UI, comments, group sentiment)
- Score entry and round mode (live scoring, side bets)
- Bet creation and ledger (especially pride bets)
- Recap microsite and photo gallery
- Trip archive, stats, rivalries, leaderboards
- Empty states and onboarding
- Notification copy for social events (vote reminders, score updates, recap publish)

**Tone rules:**
- Copy can be witty, punchy, and irreverent
- Use moments of humor — but humor that lands for a group of adult friends, not corporate jokes
- Celebrate wins, losses, and absurdity equally
- Button labels can have personality ("Lock it in", "Throw down", "Who's in?")
- Empty states should motivate action, not just describe absence ("No bets yet. Someone's playing it safe.")
- Stats and records should feel like bragging rights, not data tables

**Visual rules:**
- Strong typography, large cards, generous whitespace
- Accent colors and energy — not muted or corporate
- Large tap targets especially in round mode (PRD 9.2: minimum 44x44 CSS pixels)
- Golf greens as a base palette with selective, bold accent color
- Shareable and memorable — recap pages should look like something worth posting

## Mode 2: Trust Posture (calm, precise, unambiguous)

**Where it applies:**
- Booking room (countdown, status, confirmations)
- Booking confirmation screens
- Fee disclosure and billing screens
- Cancellation flows and refund information
- Payment and cost-splitting screens
- Photo consent and veto workflows
- Privacy controls and publication settings
- Captain override confirmation
- Error states involving money, reservations, or privacy
- Notification copy for operational events (booking confirmation, fee charge, consent request)

**Tone rules:**
- Copy must be plainspoken, direct, and explicit
- No humor, no cleverness, no ambiguity
- State exactly what will happen, what it costs, and what the user is agreeing to
- Use specific numbers, not ranges or vague language ("$47.50 service fee" not "a small fee")
- Confirmation buttons must describe the action ("Confirm booking for $185" not "Continue")
- Cancellation and fee language must explain consequences before the action, not after
- Consent flows must default to the safe option (private, not published)

**Visual rules:**
- Restrained color palette — no accent colors that could feel promotional
- Clear visual hierarchy: most important information (cost, status, deadline) is largest
- No decorative elements that could distract from the information
- Status indicators must use text labels, not just color (accessibility requirement from PRD 9.2)
- Adequate spacing between destructive actions and confirmation buttons

## The Boundary Rule

Some screens contain both modes. For example, the trip home dashboard shows social activity AND booking status. In these cases:

1. **Separate the modes visually.** Use distinct card types or sections. A booking status card should not have the same visual treatment as a "Jake voted Out on Pinehurst" activity item.
2. **Trust mode always wins when there's a conflict.** If a component shows a fee, a deadline, a cancellation, or a consent decision, it follows trust posture rules even if it sits inside a social-energy screen.
3. **Transitions between modes should feel intentional.** When a user taps "Book this course" from a fun discovery card, the transition to the booking flow should feel like stepping into a calmer, more serious space. Don't carry the playful tone into the checkout.

## Copy Examples

### Social Energy — Good
- "The crew has spoken. Pinehurst it is."
- "3 bets riding on this round. No pressure."
- "Jake's putting average called. It wants its dignity back."
- Empty bet ledger: "Nobody's put their money where their mouth is yet."

### Social Energy — Bad (too corporate or too flat)
- "Your trip has been successfully created."
- "No bets have been placed for this round."
- "Vote results are now available for review."

### Trust Posture — Good
- "Your tee time at Pinehurst No. 2 is confirmed for March 15 at 9:20 AM. 4 players. Confirmation #PH-29481."
- "Canceling this booking will incur a $35 cancellation fee from the course. Your $12 service fee will be refunded."
- "This photo includes 3 tagged trip members. All must approve before it can appear on the public recap."

### Trust Posture — Bad (too casual or ambiguous)
- "You're booked! 🎉" (missing details, uses emoji in a trust context)
- "There might be a cancellation fee." (vague — state the amount)
- "Ready to publish?" (doesn't explain what publishing means or who will see it)

## Notification Copy

Notifications must match the mode of the event they describe:

| Event | Mode | Example |
|---|---|---|
| Vote reminder | Social | "The crew's waiting on your vote. 2 options left." |
| Booking window opening | Trust | "Tee time booking opens for Pinehurst No. 2 in 24 hours. Captain action required." |
| Score reminder | Social | "Round 2 scores aren't in yet. Who's dodging?" |
| Fee charged | Trust | "Service fee of $12.00 charged for your Pinehurst No. 2 tee time (Confirmation #PH-29481)." |
| Photo approval request | Trust | "You've been tagged in 4 trip photos. Review and approve before they can be published." |
| Recap published | Social | "The Pinehurst 2026 recap is live. Time to relive the glory (and the shame)." |

## Checklist Before Shipping Any UI

- [ ] Is this screen social-energy or trust-posture? (If both, are they clearly separated?)
- [ ] Does every button label describe the action, not just "Continue" or "Submit"?
- [ ] If money is involved, is the exact amount shown before the action?
- [ ] If consent is involved, does it default to the private/safe option?
- [ ] Do status indicators use text labels, not just color? (PRD 9.2)
- [ ] On mobile, are tap targets at least 44x44 CSS pixels? (PRD 9.2)
- [ ] In trust-posture screens, is there any humor, cleverness, or ambiguity? (There shouldn't be.)
- [ ] In social-energy screens, does the copy sound like something a friend group would actually say?
