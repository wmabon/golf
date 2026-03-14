import type { ReservationStatus } from "@/types";

const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  confirmed: ["swappable", "locked", "canceled", "played", "no_show"],
  swappable: ["locked", "canceled"],
  locked: ["played", "canceled", "no_show"],
  played: [],
  canceled: [],
  no_show: [],
};

export function canTransition(
  from: ReservationStatus,
  to: ReservationStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(
  current: ReservationStatus
): ReservationStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: ReservationStatus,
  to: ReservationStatus
): { valid: true } | { valid: false; reason: string } {
  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    if (allowed.length === 0) {
      return {
        valid: false,
        reason: `Reservation in "${from}" state cannot transition to any other state`,
      };
    }
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Valid transitions: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
