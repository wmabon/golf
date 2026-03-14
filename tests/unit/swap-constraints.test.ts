import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SWAP_CONSTRAINTS,
  meetsQualityThreshold,
  withinTimeWindow,
  withinCostCeiling,
  isCancellationSafe,
  canSuggestMore,
} from "@/services/optimization/swap-constraints";

describe("SWAP_CONSTRAINTS", () => {
  it("has expected default values", () => {
    expect(SWAP_CONSTRAINTS.MIN_QUALITY_IMPROVEMENT_PCT).toBe(15);
    expect(SWAP_CONSTRAINTS.MIN_COST_SAVING_PER_GOLFER).toBe(25);
    expect(SWAP_CONSTRAINTS.MAX_SUGGESTIONS_PER_ROUND).toBe(2);
    expect(SWAP_CONSTRAINTS.TIME_WINDOW_MINUTES).toBe(60);
    expect(SWAP_CONSTRAINTS.AUTO_UPGRADE_COST_CEILING).toBe(20);
    expect(SWAP_CONSTRAINTS.CANCELLATION_SAFETY_HOURS).toBe(48);
  });
});

describe("meetsQualityThreshold", () => {
  it("returns false for 14% quality improvement with no cost saving", () => {
    // 100 -> 114 = 14% improvement
    expect(meetsQualityThreshold(100, 114, 0)).toBe(false);
  });

  it("returns true for exactly 15% quality improvement", () => {
    // 100 -> 115 = 15% improvement
    expect(meetsQualityThreshold(100, 115, 0)).toBe(true);
  });

  it("returns true for 16% quality improvement", () => {
    // 100 -> 116 = 16% improvement
    expect(meetsQualityThreshold(100, 116, 0)).toBe(true);
  });

  it("returns false for $24 cost saving (below threshold)", () => {
    // costDelta = -24 means $24 savings, below $25 threshold
    // Quality: 100 -> 100, 0% improvement
    expect(meetsQualityThreshold(100, 100, -24)).toBe(false);
  });

  it("returns true for $25 cost saving (at threshold)", () => {
    // costDelta = -25 means $25 savings
    expect(meetsQualityThreshold(100, 100, -25)).toBe(true);
  });

  it("returns true for $30 cost saving (above threshold)", () => {
    expect(meetsQualityThreshold(100, 100, -30)).toBe(true);
  });

  it("returns true when either quality OR cost threshold is met", () => {
    // 15% improvement with cost increase
    expect(meetsQualityThreshold(100, 115, 10)).toBe(true);
    // No quality improvement but $25 savings
    expect(meetsQualityThreshold(100, 100, -25)).toBe(true);
  });

  it("returns false when neither threshold is met", () => {
    // 10% improvement, $10 savings
    expect(meetsQualityThreshold(100, 110, -10)).toBe(false);
  });

  it("handles zero current score gracefully", () => {
    expect(meetsQualityThreshold(0, 50, 0)).toBe(true);
    expect(meetsQualityThreshold(0, 0, 0)).toBe(false);
  });
});

describe("withinTimeWindow", () => {
  const base = new Date("2026-06-15T08:00:00Z");

  it("returns true for 59-minute difference", () => {
    const newTime = new Date("2026-06-15T08:59:00Z");
    expect(withinTimeWindow(base, newTime, 60)).toBe(true);
  });

  it("returns true for exactly 60-minute difference", () => {
    const newTime = new Date("2026-06-15T09:00:00Z");
    expect(withinTimeWindow(base, newTime, 60)).toBe(true);
  });

  it("returns false for 61-minute difference", () => {
    const newTime = new Date("2026-06-15T09:01:00Z");
    expect(withinTimeWindow(base, newTime, 60)).toBe(false);
  });

  it("handles negative time differences (earlier tee time)", () => {
    const newTime = new Date("2026-06-15T07:30:00Z");
    expect(withinTimeWindow(base, newTime, 60)).toBe(true);
  });

  it("returns true for same time", () => {
    expect(withinTimeWindow(base, base, 60)).toBe(true);
  });

  it("uses default window when not specified", () => {
    const newTime = new Date("2026-06-15T09:00:00Z"); // exactly 60 min
    expect(withinTimeWindow(base, newTime)).toBe(true);

    const tooFar = new Date("2026-06-15T09:01:00Z"); // 61 min
    expect(withinTimeWindow(base, tooFar)).toBe(false);
  });
});

describe("withinCostCeiling", () => {
  it("returns true for $19 increase (below ceiling)", () => {
    expect(withinCostCeiling(19, 20)).toBe(true);
  });

  it("returns true for exactly $20 increase (at ceiling)", () => {
    expect(withinCostCeiling(20, 20)).toBe(true);
  });

  it("returns false for $21 increase (above ceiling)", () => {
    expect(withinCostCeiling(21, 20)).toBe(false);
  });

  it("returns true for negative cost delta (savings)", () => {
    expect(withinCostCeiling(-10, 20)).toBe(true);
  });

  it("returns true for zero cost delta", () => {
    expect(withinCostCeiling(0, 20)).toBe(true);
  });

  it("uses default ceiling when not specified", () => {
    expect(withinCostCeiling(20)).toBe(true);
    expect(withinCostCeiling(21)).toBe(false);
  });
});

describe("isCancellationSafe", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for 49 hours until deadline", () => {
    // 49 hours from now = 2026-06-17T13:00:00Z
    const deadline = new Date("2026-06-17T13:00:00Z");
    expect(isCancellationSafe(deadline, 48)).toBe(true);
  });

  it("returns true for exactly 48 hours until deadline", () => {
    // 48 hours from now = 2026-06-17T12:00:00Z
    const deadline = new Date("2026-06-17T12:00:00Z");
    expect(isCancellationSafe(deadline, 48)).toBe(true);
  });

  it("returns false for 47 hours until deadline", () => {
    // 47 hours from now = 2026-06-17T11:00:00Z
    const deadline = new Date("2026-06-17T11:00:00Z");
    expect(isCancellationSafe(deadline, 48)).toBe(false);
  });

  it("returns false for deadline in the past", () => {
    const deadline = new Date("2026-06-14T12:00:00Z");
    expect(isCancellationSafe(deadline, 48)).toBe(false);
  });

  it("uses default safety hours when not specified", () => {
    // 48 hours from now
    const safe = new Date("2026-06-17T12:00:00Z");
    expect(isCancellationSafe(safe)).toBe(true);

    // 47 hours from now
    const unsafe = new Date("2026-06-17T11:00:00Z");
    expect(isCancellationSafe(unsafe)).toBe(false);
  });
});

describe("canSuggestMore", () => {
  it("returns true for 1 existing suggestion (below max of 2)", () => {
    expect(canSuggestMore(1, 2)).toBe(true);
  });

  it("returns false for 2 existing suggestions (at max of 2)", () => {
    expect(canSuggestMore(2, 2)).toBe(false);
  });

  it("returns false for 3 existing suggestions (above max of 2)", () => {
    expect(canSuggestMore(3, 2)).toBe(false);
  });

  it("returns true for 0 existing suggestions", () => {
    expect(canSuggestMore(0, 2)).toBe(true);
  });

  it("uses default max when not specified", () => {
    expect(canSuggestMore(1)).toBe(true);
    expect(canSuggestMore(2)).toBe(false);
  });
});
