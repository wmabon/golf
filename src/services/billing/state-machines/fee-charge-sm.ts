import type { FeeChargeStatus } from "@/types";

const VALID_TRANSITIONS: Record<FeeChargeStatus, FeeChargeStatus[]> = {
  pending: ["collectible", "waived"],
  collectible: ["charged", "waived"],
  charged: ["refunded"],
  refunded: [],
  waived: [],
};

export function canTransition(
  from: FeeChargeStatus,
  to: FeeChargeStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: FeeChargeStatus): FeeChargeStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: FeeChargeStatus,
  to: FeeChargeStatus
): { valid: true } | { valid: false; reason: string } {
  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    if (allowed.length === 0) {
      return {
        valid: false,
        reason: `Fee charge in "${from}" state cannot transition to any other state`,
      };
    }
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Valid transitions: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
