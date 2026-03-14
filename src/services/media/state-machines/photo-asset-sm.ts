import type { PublishState } from "@/types";

const VALID_TRANSITIONS: Record<PublishState, PublishState[]> = {
  private: ["review_pending"],
  review_pending: ["publish_eligible", "withdrawn"],
  publish_eligible: ["published", "withdrawn"],
  published: ["withdrawn"],
  withdrawn: [],
};

export function canTransition(
  from: PublishState,
  to: PublishState
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: PublishState): PublishState[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: PublishState,
  to: PublishState
): { valid: true } | { valid: false; reason: string } {
  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    if (allowed.length === 0) {
      return {
        valid: false,
        reason: `Photo asset in "${from}" state cannot transition to any other state`,
      };
    }
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Valid transitions: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}
