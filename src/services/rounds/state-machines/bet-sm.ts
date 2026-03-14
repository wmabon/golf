import type { BetStatus } from "@/types";

const VALID_TRANSITIONS: Record<BetStatus, BetStatus[]> = {
  proposed: ["accepted", "declined", "voided", "expired"],
  accepted: ["resolved", "voided"],
  declined: [],
  resolved: [],
  voided: [],
  expired: [],
};

export function canTransition(
  from: BetStatus,
  to: BetStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: BetStatus): BetStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: BetStatus,
  to: BetStatus
): { valid: true } | { valid: false; reason: string } {
  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    if (allowed.length === 0) {
      return {
        valid: false,
        reason: `Bet in "${from}" state cannot transition to any other state`,
      };
    }
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Valid transitions: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
