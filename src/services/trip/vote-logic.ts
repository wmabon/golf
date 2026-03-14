/**
 * Pure functions for vote tallying and constraint checking.
 * Separated from service layer to enable unit testing without DB dependencies.
 */

export interface VoteSummary {
  in: number;
  fine: number;
  out: number;
  total: number;
}

/**
 * Compute vote summary counts for a set of votes.
 */
export function tallyVotes(
  voteRows: { voteValue: string }[]
): VoteSummary {
  const summary: VoteSummary = { in: 0, fine: 0, out: 0, total: 0 };
  for (const v of voteRows) {
    if (v.voteValue === "in") summary.in++;
    else if (v.voteValue === "fine") summary.fine++;
    else if (v.voteValue === "out") summary.out++;
    summary.total++;
  }
  return summary;
}

/**
 * Determine whether an option should be eliminated based on majority "out" votes.
 * Uses strict majority: out > total / 2
 */
export function shouldEliminate(summary: {
  out: number;
  total: number;
}): boolean {
  if (summary.total === 0) return false;
  return summary.out > summary.total / 2;
}

/**
 * Count how many members' hard budget constraints an option violates.
 * A violation occurs when costPerGolfer strictly exceeds a member's maxBudgetPerRound.
 */
export function countBudgetViolations(
  costPerGolfer: number,
  memberBudgets: (number | undefined | null)[]
): number {
  let violations = 0;
  for (const budget of memberBudgets) {
    if (budget != null && costPerGolfer > budget) {
      violations++;
    }
  }
  return violations;
}
