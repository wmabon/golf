import type { RoundStatus } from "@/types";

const VALID_TRANSITIONS: Record<RoundStatus, RoundStatus[]> = {
  scheduled: ["in_progress", "canceled"],
  in_progress: ["completed", "canceled"],
  completed: ["finalized"],
  finalized: [],
  canceled: [],
};

export function canTransition(
  from: RoundStatus,
  to: RoundStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: RoundStatus): RoundStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: RoundStatus,
  to: RoundStatus
): { valid: true } | { valid: false; reason: string } {
  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    if (allowed.length === 0) {
      return {
        valid: false,
        reason: `Round in "${from}" state cannot transition to any other state`,
      };
    }
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Valid transitions: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
