/**
 * Swap constraint constants and pure validation functions.
 *
 * All functions are pure (no side effects, no DB access) for testability.
 * These enforce the rules from PRD Section 8.7.1:
 *  - Quality thresholds
 *  - Frequency limits
 *  - Day/time stability
 *  - Cost ceilings
 *  - Cancellation safety margins
 */

export const SWAP_CONSTRAINTS = {
  /** Minimum quality improvement to justify a swap suggestion (%) */
  MIN_QUALITY_IMPROVEMENT_PCT: 15,
  /** Minimum cost saving per golfer to justify a cost-based swap ($) */
  MIN_COST_SAVING_PER_GOLFER: 25,
  /** Maximum swap suggestions allowed per round/reservation */
  MAX_SUGGESTIONS_PER_ROUND: 2,
  /** Time window for tee time stability: new tee time must be within N minutes of original */
  TIME_WINDOW_MINUTES: 60,
  /** Maximum cost increase allowed for auto-upgrade swaps ($ per golfer) */
  AUTO_UPGRADE_COST_CEILING: 20,
  /** Minimum hours before cancellation deadline to consider a swap safe */
  CANCELLATION_SAFETY_HOURS: 48,
} as const;

/**
 * Check if a new fit score meets the minimum quality improvement threshold.
 *
 * A swap is quality-justified if:
 *  - The quality improvement % >= MIN_QUALITY_IMPROVEMENT_PCT, OR
 *  - The cost saving per golfer >= MIN_COST_SAVING_PER_GOLFER (negative costDelta = savings)
 */
export function meetsQualityThreshold(
  currentFitScore: number,
  newFitScore: number,
  costDelta: number
): boolean {
  if (currentFitScore <= 0) {
    // Avoid division by zero; any positive new score is an improvement
    return newFitScore > 0;
  }

  const improvementPct =
    ((newFitScore - currentFitScore) / currentFitScore) * 100;

  if (improvementPct >= SWAP_CONSTRAINTS.MIN_QUALITY_IMPROVEMENT_PCT) {
    return true;
  }

  // Cost saving (negative delta means savings)
  if (-costDelta >= SWAP_CONSTRAINTS.MIN_COST_SAVING_PER_GOLFER) {
    return true;
  }

  return false;
}

/**
 * Check if a new tee time is within the allowed time window of the current tee time.
 * Ensures day/time stability (PRD Section 8.7.1).
 */
export function withinTimeWindow(
  currentTeeTime: Date,
  newTeeTime: Date,
  windowMinutes: number = SWAP_CONSTRAINTS.TIME_WINDOW_MINUTES
): boolean {
  const diffMs = Math.abs(newTeeTime.getTime() - currentTeeTime.getTime());
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= windowMinutes;
}

/**
 * Check if a cost increase is within the auto-upgrade cost ceiling.
 * costDelta > 0 means the new option is more expensive.
 */
export function withinCostCeiling(
  costDelta: number,
  ceiling: number = SWAP_CONSTRAINTS.AUTO_UPGRADE_COST_CEILING
): boolean {
  return costDelta <= ceiling;
}

/**
 * Check if there is enough time before the cancellation deadline to safely execute a swap.
 * Returns true if the deadline is at least safetyHours away from now.
 *
 * FR-37: Swap suggestions must account for cancellation safety margins.
 */
export function isCancellationSafe(
  cancellationDeadline: Date,
  safetyHours: number = SWAP_CONSTRAINTS.CANCELLATION_SAFETY_HOURS
): boolean {
  const now = new Date();
  const hoursUntilDeadline =
    (cancellationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilDeadline >= safetyHours;
}

/**
 * Check if more swap suggestions can be made for a reservation.
 * FR-37/Section 8.7.1: Frequency limits prevent suggestion fatigue.
 */
export function canSuggestMore(
  existingSuggestionCount: number,
  max: number = SWAP_CONSTRAINTS.MAX_SUGGESTIONS_PER_ROUND
): boolean {
  return existingSuggestionCount < max;
}
