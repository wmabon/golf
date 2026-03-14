import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStates,
  validateTransition,
} from "@/services/media/state-machines/photo-asset-sm";
import type { PublishState } from "@/types";

describe("PhotoAsset State Machine", () => {
  describe("canTransition", () => {
    const validTransitions: [PublishState, PublishState][] = [
      ["private", "review_pending"],
      ["review_pending", "publish_eligible"],
      ["review_pending", "withdrawn"],
      ["publish_eligible", "published"],
      ["publish_eligible", "withdrawn"],
      ["published", "withdrawn"],
    ];

    it.each(validTransitions)("allows %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [PublishState, PublishState][] = [
      // Cannot go backwards
      ["review_pending", "private"],
      ["publish_eligible", "private"],
      ["publish_eligible", "review_pending"],
      ["published", "private"],
      ["published", "review_pending"],
      ["published", "publish_eligible"],
      // Cannot skip forward
      ["private", "publish_eligible"],
      ["private", "published"],
      ["private", "withdrawn"],
      ["review_pending", "published"],
      // Terminal state: withdrawn cannot transition
      ["withdrawn", "private"],
      ["withdrawn", "review_pending"],
      ["withdrawn", "publish_eligible"],
      ["withdrawn", "published"],
      // Self-transitions are not valid
      ["private", "private"],
      ["review_pending", "review_pending"],
      ["publish_eligible", "publish_eligible"],
      ["published", "published"],
      ["withdrawn", "withdrawn"],
    ];

    it.each(invalidTransitions)("rejects %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe("getNextStates", () => {
    it('returns ["review_pending"] for private', () => {
      expect(getNextStates("private")).toEqual(["review_pending"]);
    });

    it('returns ["publish_eligible", "withdrawn"] for review_pending', () => {
      expect(getNextStates("review_pending")).toEqual([
        "publish_eligible",
        "withdrawn",
      ]);
    });

    it('returns ["published", "withdrawn"] for publish_eligible', () => {
      expect(getNextStates("publish_eligible")).toEqual([
        "published",
        "withdrawn",
      ]);
    });

    it('returns ["withdrawn"] for published', () => {
      expect(getNextStates("published")).toEqual(["withdrawn"]);
    });

    it("returns empty array for withdrawn (terminal)", () => {
      expect(getNextStates("withdrawn")).toEqual([]);
    });
  });

  describe("validateTransition", () => {
    it("returns valid for allowed transitions", () => {
      const result = validateTransition("private", "review_pending");
      expect(result).toEqual({ valid: true });
    });

    it("returns valid for review_pending -> publish_eligible", () => {
      const result = validateTransition("review_pending", "publish_eligible");
      expect(result).toEqual({ valid: true });
    });

    it("returns valid for review_pending -> withdrawn (veto)", () => {
      const result = validateTransition("review_pending", "withdrawn");
      expect(result).toEqual({ valid: true });
    });

    it("returns valid for published -> withdrawn (takedown)", () => {
      const result = validateTransition("published", "withdrawn");
      expect(result).toEqual({ valid: true });
    });

    it("returns error message for invalid transition", () => {
      const result = validateTransition("private", "published");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Cannot transition");
        expect(result.reason).toContain("review_pending");
      }
    });

    it("returns terminal message for withdrawn", () => {
      const result = validateTransition("withdrawn", "private");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });
  });

  describe("full lifecycle", () => {
    it("can traverse the happy path: private -> review_pending -> publish_eligible -> published", () => {
      const lifecycle: PublishState[] = [
        "private",
        "review_pending",
        "publish_eligible",
        "published",
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
      }
    });

    it("published photo can be withdrawn (takedown)", () => {
      expect(canTransition("published", "withdrawn")).toBe(true);
    });

    it("review_pending photo can be withdrawn (veto)", () => {
      expect(canTransition("review_pending", "withdrawn")).toBe(true);
    });

    it("publish_eligible photo can be withdrawn", () => {
      expect(canTransition("publish_eligible", "withdrawn")).toBe(true);
    });

    it("withdrawn is terminal — no further transitions possible", () => {
      const allStates: PublishState[] = [
        "private",
        "review_pending",
        "publish_eligible",
        "published",
        "withdrawn",
      ];

      for (const state of allStates) {
        expect(canTransition("withdrawn", state)).toBe(false);
      }
    });

    it("private is the only entry point — no state transitions to private", () => {
      const allStates: PublishState[] = [
        "private",
        "review_pending",
        "publish_eligible",
        "published",
        "withdrawn",
      ];

      for (const state of allStates) {
        expect(canTransition(state, "private")).toBe(false);
      }
    });

    it("no state can skip the review_pending step to reach publish_eligible", () => {
      expect(canTransition("private", "publish_eligible")).toBe(false);
    });

    it("no state can skip to published without going through publish_eligible", () => {
      expect(canTransition("private", "published")).toBe(false);
      expect(canTransition("review_pending", "published")).toBe(false);
    });
  });
});
