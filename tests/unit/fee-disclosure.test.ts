import { describe, it, expect } from "vitest";
import { computeFee } from "@/services/billing/fee-disclosure.service";

describe("Fee Disclosure — computeFee (pure)", () => {
  describe("flat fee calculation", () => {
    it("returns the flat amount regardless of baseCost", () => {
      expect(computeFee("flat", 200, 5, null, null)).toBe(5);
    });

    it("returns the flat amount for a different baseCost", () => {
      expect(computeFee("flat", 500, 5, null, null)).toBe(5);
    });

    it("returns 0 when flat amount is null", () => {
      expect(computeFee("flat", 200, null, null, null)).toBe(0);
    });

    it("returns 0 when flat amount is 0", () => {
      expect(computeFee("flat", 200, 0, null, null)).toBe(0);
    });
  });

  describe("percentage fee calculation", () => {
    it("calculates 5% of baseCost when percentageRate is 5.0", () => {
      // 5% of 200 = 10
      expect(computeFee("percentage", 200, null, 5.0, null)).toBe(10);
    });

    it("calculates 2.5% of baseCost when percentageRate is 2.5", () => {
      // 2.5% of 400 = 10
      expect(computeFee("percentage", 400, null, 2.5, null)).toBe(10);
    });

    it("returns 0 when baseCost is 0", () => {
      expect(computeFee("percentage", 0, null, 5.0, null)).toBe(0);
    });

    it("returns 0 when percentageRate is null", () => {
      expect(computeFee("percentage", 200, null, null, null)).toBe(0);
    });

    it("returns 0 when percentageRate is 0", () => {
      expect(computeFee("percentage", 200, null, 0, null)).toBe(0);
    });

    it("rounds to two decimal places", () => {
      // 3% of 33.33 = 0.9999 -> rounds to 1.00
      expect(computeFee("percentage", 33.33, null, 3.0, null)).toBe(1);
    });

    it("handles precision for small rates", () => {
      // 0.5% of 100 = 0.50
      expect(computeFee("percentage", 100, null, 0.5, null)).toBe(0.5);
    });
  });

  describe("per-golfer cap application", () => {
    it("caps the fee when it exceeds perGolferCap * numGolfers", () => {
      // 10% of 1000 = 100, but cap is 20 per golfer * 4 golfers = 80
      expect(computeFee("percentage", 1000, null, 10.0, 20, 4)).toBe(80);
    });

    it("does not cap when fee is below the cap", () => {
      // 5% of 100 = 5, cap is 10 per golfer * 4 golfers = 40
      expect(computeFee("percentage", 100, null, 5.0, 10, 4)).toBe(5);
    });

    it("caps flat fees too", () => {
      // flat $50, but cap is $10 per golfer * 3 golfers = $30
      expect(computeFee("flat", 200, 50, null, 10, 3)).toBe(30);
    });

    it("does not apply cap when numGolfers is undefined", () => {
      // 10% of 1000 = 100, cap is 20 per golfer but no golfer count
      expect(computeFee("percentage", 1000, null, 10.0, 20)).toBe(100);
    });

    it("does not apply cap when perGolferCap is null", () => {
      // 10% of 1000 = 100, no cap
      expect(computeFee("percentage", 1000, null, 10.0, null, 4)).toBe(100);
    });

    it("handles cap exactly equal to fee", () => {
      // 5% of 200 = 10, cap is 5 per golfer * 2 golfers = 10
      expect(computeFee("percentage", 200, null, 5.0, 5, 2)).toBe(10);
    });
  });

  describe("edge cases", () => {
    it("ignores percentageRate in flat mode", () => {
      // Should use flatAmount, not percentageRate
      expect(computeFee("flat", 200, 5, 10.0, null)).toBe(5);
    });

    it("ignores flatAmount in percentage mode", () => {
      // Should use percentageRate, not flatAmount
      // 5% of 200 = 10, not flat $50
      expect(computeFee("percentage", 200, 50, 5.0, null)).toBe(10);
    });

    it("handles very large baseCost", () => {
      // 5% of 100,000 = 5,000
      expect(computeFee("percentage", 100000, null, 5.0, null)).toBe(5000);
    });

    it("handles very small fee with rounding", () => {
      // 1% of 0.01 = 0.0001 -> rounds to 0.00
      expect(computeFee("percentage", 0.01, null, 1.0, null)).toBe(0);
    });
  });
});
