import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStates,
  validateTransition,
} from "@/services/rounds/state-machines/round-sm";
import type { RoundStatus } from "@/types";

describe("Round State Machine", () => {
  describe("canTransition", () => {
    const validTransitions: [RoundStatus, RoundStatus][] = [
      ["scheduled", "in_progress"],
      ["scheduled", "canceled"],
      ["in_progress", "completed"],
      ["in_progress", "canceled"],
      ["completed", "finalized"],
    ];

    it.each(validTransitions)("allows %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [RoundStatus, RoundStatus][] = [
      ["scheduled", "completed"],
      ["scheduled", "finalized"],
      ["in_progress", "scheduled"],
      ["in_progress", "finalized"],
      ["completed", "in_progress"],
      ["completed", "scheduled"],
      ["completed", "canceled"],
      ["finalized", "scheduled"],
      ["finalized", "in_progress"],
      ["finalized", "completed"],
      ["finalized", "canceled"],
      ["canceled", "scheduled"],
      ["canceled", "in_progress"],
      ["canceled", "completed"],
      ["canceled", "finalized"],
    ];

    it.each(invalidTransitions)("rejects %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe("getNextStates", () => {
    it("returns [in_progress, canceled] for scheduled", () => {
      expect(getNextStates("scheduled")).toEqual(["in_progress", "canceled"]);
    });

    it("returns [completed, canceled] for in_progress", () => {
      expect(getNextStates("in_progress")).toEqual(["completed", "canceled"]);
    });

    it("returns [finalized] for completed", () => {
      expect(getNextStates("completed")).toEqual(["finalized"]);
    });

    it("returns empty array for finalized", () => {
      expect(getNextStates("finalized")).toEqual([]);
    });

    it("returns empty array for canceled", () => {
      expect(getNextStates("canceled")).toEqual([]);
    });
  });

  describe("validateTransition", () => {
    it("returns valid for allowed transitions", () => {
      const result = validateTransition("scheduled", "in_progress");
      expect(result).toEqual({ valid: true });
    });

    it("returns error message for invalid transition", () => {
      const result = validateTransition("scheduled", "finalized");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Cannot transition");
        expect(result.reason).toContain("in_progress");
      }
    });

    it("returns terminal message for finalized", () => {
      const result = validateTransition("finalized", "scheduled");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for canceled", () => {
      const result = validateTransition("canceled", "in_progress");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });
  });

  describe("full lifecycle", () => {
    it("can traverse the complete happy path", () => {
      const lifecycle: RoundStatus[] = [
        "scheduled",
        "in_progress",
        "completed",
        "finalized",
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
      }
    });

    it("no state can transition backwards", () => {
      const lifecycle: RoundStatus[] = [
        "scheduled",
        "in_progress",
        "completed",
        "finalized",
      ];

      for (let i = 1; i < lifecycle.length; i++) {
        for (let j = 0; j < i; j++) {
          expect(canTransition(lifecycle[i], lifecycle[j])).toBe(false);
        }
      }
    });

    it("scheduled and in_progress can be canceled", () => {
      expect(canTransition("scheduled", "canceled")).toBe(true);
      expect(canTransition("in_progress", "canceled")).toBe(true);
    });

    it("completed and finalized cannot be canceled", () => {
      expect(canTransition("completed", "canceled")).toBe(false);
      expect(canTransition("finalized", "canceled")).toBe(false);
    });
  });
});
