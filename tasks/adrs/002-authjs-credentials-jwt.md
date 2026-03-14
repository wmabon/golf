# ADR 002: Auth.js v5 with Credentials Provider and JWT Sessions

## Status

Accepted

## Context

The PRD specifies email-based authentication for golfers coordinating group trips. Requirements:

- Email + password login (no mandatory third-party OAuth at launch)
- Role-based access: `user`, `admin`, `concierge_ops` system roles (defined in `src/types/index.ts`)
- Self-hosted authentication (no vendor lock-in to Auth0, Clerk, etc.)
- Session data must include `id` and `systemRole` for authorization checks throughout the app
- Native integration with Next.js App Router middleware and server components

## Decision

Use **Auth.js v5** (next-auth@5.0.0-beta.30) with the **Credentials provider** and **JWT session strategy**.

Implementation is in `src/lib/auth.ts`:

- Login validates email/password via `userService.getUserByEmail` and `userService.verifyPassword`
- Inactive users (`user.status !== "active"`) are rejected at login
- JWT token stores `id` and `systemRole` via the `jwt` callback
- Session object exposes `id` and `systemRole` via the `session` callback
- Custom sign-in page at `/login` via the `pages` configuration

## Consequences

**What we gained:**

- Zero external auth service dependencies; all authentication runs in-process
- JWT sessions require no database lookups on every request, reducing latency for auth-gated pages
- Extensible for future OAuth providers (Google, Apple) by adding to the `providers` array without changing session logic
- Direct access to the user service layer for password verification means we control hashing (bcryptjs), rate limiting, and account status checks

**What we gave up:**

- Credentials provider is not recommended by Auth.js maintainers for production use; they prefer OAuth/magic-link flows. We accept this trade-off because the PRD requires email+password and we own the security surface.
- No server-side session revocation. JWTs are valid until expiry. If an admin deactivates a user, the user's existing JWT remains valid until it expires. Mitigation: use short JWT `maxAge` (e.g., 1 hour) and rely on the `authorize` callback to re-check `user.status` on token refresh.
- The `systemRole` extension requires a double type cast in the `session` callback (`session.user as unknown as Record<string, unknown>`) because Auth.js's default `Session` type does not include custom fields. This is an ergonomic annoyance documented on line 61 of `src/lib/auth.ts`.
- No database-backed sessions means we cannot list active sessions or force-logout a specific session from the admin console.

**Risks:**

- Auth.js v5 is still in beta (`5.0.0-beta.30`). API surface may change before stable release. Monitor the changelog and pin the version.
- Password storage security depends entirely on our bcryptjs implementation in `userService.verifyPassword`. Must ensure adequate cost factor (12+ rounds).
