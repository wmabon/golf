import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStates,
  validateTransition,
} from "@/services/billing/state-machines/fee-charge-sm";
import type { FeeChargeStatus } from "@/types";

describe("Fee Charge State Machine", () => {
  describe("canTransition", () => {
    const validTransitions: [FeeChargeStatus, FeeChargeStatus][] = [
      ["pending", "collectible"],
      ["pending", "waived"],
      ["collectible", "charged"],
      ["collectible", "waived"],
      ["charged", "refunded"],
    ];

    it.each(validTransitions)("allows %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [FeeChargeStatus, FeeChargeStatus][] = [
      // Cannot skip collectible
      ["pending", "charged"],
      ["pending", "refunded"],
      // No backwards transitions
      ["collectible", "pending"],
      ["charged", "pending"],
      ["charged", "collectible"],
      ["refunded", "pending"],
      ["refunded", "collectible"],
      ["refunded", "charged"],
      // Terminal states cannot transition
      ["waived", "pending"],
      ["waived", "collectible"],
      ["waived", "charged"],
      ["waived", "refunded"],
      ["refunded", "waived"],
    ];

    it.each(invalidTransitions)("rejects %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe("getNextStates", () => {
    it("returns [collectible, waived] for pending", () => {
      expect(getNextStates("pending")).toEqual(["collectible", "waived"]);
    });

    it("returns [charged, waived] for collectible", () => {
      expect(getNextStates("collectible")).toEqual(["charged", "waived"]);
    });

    it("returns [refunded] for charged", () => {
      expect(getNextStates("charged")).toEqual(["refunded"]);
    });

    it("returns empty array for waived (terminal)", () => {
      expect(getNextStates("waived")).toEqual([]);
    });

    it("returns empty array for refunded (terminal)", () => {
      expect(getNextStates("refunded")).toEqual([]);
    });
  });

  describe("validateTransition", () => {
    it("returns valid for allowed transitions", () => {
      const result = validateTransition("pending", "collectible");
      expect(result).toEqual({ valid: true });
    });

    it("returns valid for pending -> waived", () => {
      const result = validateTransition("pending", "waived");
      expect(result).toEqual({ valid: true });
    });

    it("returns error message for invalid transition", () => {
      const result = validateTransition("pending", "charged");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Cannot transition");
        expect(result.reason).toContain("collectible");
      }
    });

    it("returns terminal message for waived", () => {
      const result = validateTransition("waived", "pending");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for refunded", () => {
      const result = validateTransition("refunded", "charged");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });
  });

  describe("full lifecycle", () => {
    it("can traverse the happy path: pending -> collectible -> charged -> refunded", () => {
      expect(canTransition("pending", "collectible")).toBe(true);
      expect(canTransition("collectible", "charged")).toBe(true);
      expect(canTransition("charged", "refunded")).toBe(true);
    });

    it("can traverse the waive-early path: pending -> waived", () => {
      expect(canTransition("pending", "waived")).toBe(true);
    });

    it("can traverse the waive-after-collectible path: pending -> collectible -> waived", () => {
      expect(canTransition("pending", "collectible")).toBe(true);
      expect(canTransition("collectible", "waived")).toBe(true);
    });

    it("cannot skip collectible (pending -> charged is invalid)", () => {
      expect(canTransition("pending", "charged")).toBe(false);
    });

    it("no state can transition backwards", () => {
      const lifecycle: FeeChargeStatus[] = [
        "pending",
        "collectible",
        "charged",
        "refunded",
      ];

      for (let i = 1; i < lifecycle.length; i++) {
        for (let j = 0; j < i; j++) {
          expect(canTransition(lifecycle[i], lifecycle[j])).toBe(false);
        }
      }
    });

    it("terminal states have no outgoing transitions", () => {
      const terminalStates: FeeChargeStatus[] = ["waived", "refunded"];
      const allStates: FeeChargeStatus[] = [
        "pending",
        "collectible",
        "charged",
        "refunded",
        "waived",
      ];

      for (const terminal of terminalStates) {
        for (const target of allStates) {
          expect(canTransition(terminal, target)).toBe(false);
        }
      }
    });
  });
});
