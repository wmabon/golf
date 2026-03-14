import type { BookingRequestStatus } from "@/types";

const VALID_TRANSITIONS: Record<BookingRequestStatus, BookingRequestStatus[]> =
  {
    candidate: ["window_pending", "requested"],
    window_pending: ["requested"],
    requested: ["partial_hold", "booked", "canceled"],
    partial_hold: ["booked", "requested", "canceled"],
    booked: ["swappable", "locked", "canceled"],
    swappable: ["locked", "canceled"],
    locked: ["played", "canceled"],
    played: [],
    canceled: [],
  };

export function canTransition(
  from: BookingRequestStatus,
  to: BookingRequestStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(
  current: BookingRequestStatus
): BookingRequestStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: BookingRequestStatus,
  to: BookingRequestStatus
): { valid: true } | { valid: false; reason: string } {
  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    if (allowed.length === 0) {
      return {
        valid: false,
        reason: `Booking request in "${from}" state cannot transition to any other state`,
      };
    }
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Valid transitions: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
