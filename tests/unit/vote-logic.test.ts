import { describe, it, expect } from "vitest";
import {
  tallyVotes,
  shouldEliminate,
  countBudgetViolations,
} from "@/services/trip/vote-logic";

describe("tallyVotes", () => {
  it("tallies 3 in, 1 fine, 1 out correctly", () => {
    const votes = [
      { voteValue: "in" },
      { voteValue: "in" },
      { voteValue: "in" },
      { voteValue: "fine" },
      { voteValue: "out" },
    ];
    const result = tallyVotes(votes);
    expect(result).toEqual({ in: 3, fine: 1, out: 1, total: 5 });
  });

  it("handles empty votes", () => {
    const result = tallyVotes([]);
    expect(result).toEqual({ in: 0, fine: 0, out: 0, total: 0 });
  });

  it("handles all same vote value", () => {
    const votes = [
      { voteValue: "out" },
      { voteValue: "out" },
      { voteValue: "out" },
    ];
    const result = tallyVotes(votes);
    expect(result).toEqual({ in: 0, fine: 0, out: 3, total: 3 });
  });

  it("handles single vote", () => {
    const result = tallyVotes([{ voteValue: "fine" }]);
    expect(result).toEqual({ in: 0, fine: 1, out: 0, total: 1 });
  });
});

describe("shouldEliminate", () => {
  it("eliminates when majority out: 3 out of 5", () => {
    expect(shouldEliminate({ out: 3, total: 5 })).toBe(true);
  });

  it("does not eliminate when not majority: 2 out of 5", () => {
    expect(shouldEliminate({ out: 2, total: 5 })).toBe(false);
  });

  it("does not eliminate on exact half: 2 out of 4", () => {
    // "out > total / 2" means strictly more than half
    expect(shouldEliminate({ out: 2, total: 4 })).toBe(false);
  });

  it("eliminates when all out: 3 out of 3", () => {
    expect(shouldEliminate({ out: 3, total: 3 })).toBe(true);
  });

  it("does not eliminate with zero votes", () => {
    expect(shouldEliminate({ out: 0, total: 0 })).toBe(false);
  });

  it("eliminates when 1 out of 1", () => {
    expect(shouldEliminate({ out: 1, total: 1 })).toBe(true);
  });
});

describe("countBudgetViolations", () => {
  it("returns 2 violations: option at $200, budgets [$150, $150, $300]", () => {
    expect(countBudgetViolations(200, [150, 150, 300])).toBe(2);
  });

  it("returns 1 violation: option at $200, budgets [$150, $300, $300]", () => {
    expect(countBudgetViolations(200, [150, 300, 300])).toBe(1);
  });

  it("returns 0 violations: option at $100, budgets [$150, $150]", () => {
    expect(countBudgetViolations(100, [150, 150])).toBe(0);
  });

  it("returns 0 for empty budgets array", () => {
    expect(countBudgetViolations(200, [])).toBe(0);
  });

  it("ignores null/undefined budgets", () => {
    expect(countBudgetViolations(200, [null, undefined, 150])).toBe(1);
  });

  it("exact budget match is not a violation", () => {
    expect(countBudgetViolations(150, [150, 150])).toBe(0);
  });

  it("all members violated", () => {
    expect(countBudgetViolations(300, [100, 200, 250])).toBe(3);
  });
});

describe("constraint elimination integration logic", () => {
  it("should eliminate when more than 1 member is violated", () => {
    const cost = 200;
    const budgets = [150, 150, 300];
    const violations = countBudgetViolations(cost, budgets);
    // FR-26: eliminate when violations > 1
    expect(violations > 1).toBe(true);
  });

  it("should keep when only 1 member is violated", () => {
    const cost = 200;
    const budgets = [150, 300, 300];
    const violations = countBudgetViolations(cost, budgets);
    expect(violations > 1).toBe(false);
  });

  it("should keep when no members are violated", () => {
    const cost = 100;
    const budgets = [150, 150];
    const violations = countBudgetViolations(cost, budgets);
    expect(violations > 1).toBe(false);
  });
});
