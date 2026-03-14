import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStates,
  validateTransition,
} from "@/services/rounds/state-machines/bet-sm";
import type { BetStatus } from "@/types";

describe("Bet State Machine", () => {
  describe("canTransition", () => {
    const validTransitions: [BetStatus, BetStatus][] = [
      ["proposed", "accepted"],
      ["proposed", "declined"],
      ["proposed", "voided"],
      ["proposed", "expired"],
      ["accepted", "resolved"],
      ["accepted", "voided"],
    ];

    it.each(validTransitions)("allows %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [BetStatus, BetStatus][] = [
      ["proposed", "resolved"],
      ["accepted", "proposed"],
      ["accepted", "declined"],
      ["accepted", "expired"],
      ["declined", "proposed"],
      ["declined", "accepted"],
      ["declined", "resolved"],
      ["declined", "voided"],
      ["declined", "expired"],
      ["resolved", "proposed"],
      ["resolved", "accepted"],
      ["resolved", "declined"],
      ["resolved", "voided"],
      ["resolved", "expired"],
      ["voided", "proposed"],
      ["voided", "accepted"],
      ["voided", "declined"],
      ["voided", "resolved"],
      ["voided", "expired"],
      ["expired", "proposed"],
      ["expired", "accepted"],
      ["expired", "declined"],
      ["expired", "resolved"],
      ["expired", "voided"],
    ];

    it.each(invalidTransitions)("rejects %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe("getNextStates", () => {
    it("returns [accepted, declined, voided, expired] for proposed", () => {
      expect(getNextStates("proposed")).toEqual([
        "accepted",
        "declined",
        "voided",
        "expired",
      ]);
    });

    it("returns [resolved, voided] for accepted", () => {
      expect(getNextStates("accepted")).toEqual(["resolved", "voided"]);
    });

    it("returns empty array for declined", () => {
      expect(getNextStates("declined")).toEqual([]);
    });

    it("returns empty array for resolved", () => {
      expect(getNextStates("resolved")).toEqual([]);
    });

    it("returns empty array for voided", () => {
      expect(getNextStates("voided")).toEqual([]);
    });

    it("returns empty array for expired", () => {
      expect(getNextStates("expired")).toEqual([]);
    });
  });

  describe("validateTransition", () => {
    it("returns valid for allowed transitions", () => {
      const result = validateTransition("proposed", "accepted");
      expect(result).toEqual({ valid: true });
    });

    it("returns error message for invalid transition", () => {
      const result = validateTransition("proposed", "resolved");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Cannot transition");
        expect(result.reason).toContain("accepted");
      }
    });

    it("returns terminal message for declined", () => {
      const result = validateTransition("declined", "proposed");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for resolved", () => {
      const result = validateTransition("resolved", "voided");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for voided", () => {
      const result = validateTransition("voided", "proposed");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for expired", () => {
      const result = validateTransition("expired", "accepted");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });
  });

  describe("full lifecycle", () => {
    it("can traverse the happy path: proposed -> accepted -> resolved", () => {
      expect(canTransition("proposed", "accepted")).toBe(true);
      expect(canTransition("accepted", "resolved")).toBe(true);
    });

    it("proposed can be declined directly", () => {
      expect(canTransition("proposed", "declined")).toBe(true);
    });

    it("proposed can be voided by captain", () => {
      expect(canTransition("proposed", "voided")).toBe(true);
    });

    it("accepted bets can be voided by captain", () => {
      expect(canTransition("accepted", "voided")).toBe(true);
    });

    it("terminal states have no exits", () => {
      const terminals: BetStatus[] = ["declined", "resolved", "voided", "expired"];
      for (const state of terminals) {
        expect(getNextStates(state)).toEqual([]);
      }
    });

    it("resolved bet cannot be re-resolved or voided", () => {
      expect(canTransition("resolved", "resolved")).toBe(false);
      expect(canTransition("resolved", "voided")).toBe(false);
    });
  });
});
