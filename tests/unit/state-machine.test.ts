import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStates,
  validateTransition,
} from "@/services/trip/state-machine";
import type { TripStatus } from "@/types";

describe("Trip State Machine", () => {
  describe("canTransition", () => {
    const validTransitions: [TripStatus, TripStatus][] = [
      ["draft", "planning"],
      ["planning", "voting"],
      ["voting", "booking"],
      ["booking", "locked"],
      ["locked", "in_progress"],
      ["in_progress", "completed"],
      ["completed", "archived"],
    ];

    it.each(validTransitions)(
      "allows %s -> %s",
      (from, to) => {
        expect(canTransition(from, to)).toBe(true);
      }
    );

    const invalidTransitions: [TripStatus, TripStatus][] = [
      ["draft", "voting"],
      ["draft", "completed"],
      ["planning", "booking"],
      ["voting", "draft"],
      ["completed", "draft"],
      ["archived", "draft"],
      ["archived", "completed"],
    ];

    it.each(invalidTransitions)(
      "rejects %s -> %s",
      (from, to) => {
        expect(canTransition(from, to)).toBe(false);
      }
    );
  });

  describe("getNextStates", () => {
    it("returns [planning] for draft", () => {
      expect(getNextStates("draft")).toEqual(["planning"]);
    });

    it("returns empty array for archived", () => {
      expect(getNextStates("archived")).toEqual([]);
    });

    it("returns [voting] for planning", () => {
      expect(getNextStates("planning")).toEqual(["voting"]);
    });
  });

  describe("validateTransition", () => {
    it("returns valid for allowed transitions", () => {
      const result = validateTransition("draft", "planning");
      expect(result).toEqual({ valid: true });
    });

    it("returns error message for invalid transition", () => {
      const result = validateTransition("draft", "completed");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Cannot transition");
        expect(result.reason).toContain("planning");
      }
    });

    it("returns terminal message for archived", () => {
      const result = validateTransition("archived", "draft");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });
  });

  describe("full lifecycle", () => {
    it("can traverse the complete happy path", () => {
      const lifecycle: TripStatus[] = [
        "draft",
        "planning",
        "voting",
        "booking",
        "locked",
        "in_progress",
        "completed",
        "archived",
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
      }
    });

    it("no state can transition backwards", () => {
      const lifecycle: TripStatus[] = [
        "draft",
        "planning",
        "voting",
        "booking",
        "locked",
        "in_progress",
        "completed",
        "archived",
      ];

      for (let i = 1; i < lifecycle.length; i++) {
        for (let j = 0; j < i; j++) {
          expect(canTransition(lifecycle[i], lifecycle[j])).toBe(false);
        }
      }
    });

    it("no state can skip forward", () => {
      const lifecycle: TripStatus[] = [
        "draft",
        "planning",
        "voting",
        "booking",
        "locked",
        "in_progress",
        "completed",
        "archived",
      ];

      for (let i = 0; i < lifecycle.length - 2; i++) {
        for (let j = i + 2; j < lifecycle.length; j++) {
          expect(canTransition(lifecycle[i], lifecycle[j])).toBe(false);
        }
      }
    });
  });
});
