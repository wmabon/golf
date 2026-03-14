import type { TripStatus } from "@/types";

const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  draft: ["planning"],
  planning: ["voting"],
  voting: ["booking"],
  booking: ["locked"],
  locked: ["in_progress"],
  in_progress: ["completed"],
  completed: ["archived"],
  archived: [],
};

export function canTransition(
  from: TripStatus,
  to: TripStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: TripStatus): TripStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: TripStatus,
  to: TripStatus
): { valid: true } | { valid: false; reason: string } {
  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    if (allowed.length === 0) {
      return {
        valid: false,
        reason: `Trip in "${from}" state cannot transition to any other state`,
      };
    }
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Valid transitions: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
