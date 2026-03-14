import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStates,
  validateTransition,
} from "@/services/booking/state-machines/booking-request-sm";
import type { BookingRequestStatus } from "@/types";

describe("BookingRequest State Machine", () => {
  describe("canTransition", () => {
    const validTransitions: [BookingRequestStatus, BookingRequestStatus][] = [
      ["candidate", "window_pending"],
      ["candidate", "requested"],
      ["window_pending", "requested"],
      ["requested", "partial_hold"],
      ["requested", "booked"],
      ["requested", "canceled"],
      ["partial_hold", "booked"],
      ["partial_hold", "requested"],
      ["partial_hold", "canceled"],
      ["booked", "swappable"],
      ["booked", "locked"],
      ["booked", "canceled"],
      ["swappable", "locked"],
      ["swappable", "canceled"],
      ["locked", "played"],
      ["locked", "canceled"],
    ];

    it.each(validTransitions)("allows %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [BookingRequestStatus, BookingRequestStatus][] = [
      // Cannot go backwards
      ["window_pending", "candidate"],
      ["requested", "candidate"],
      ["requested", "window_pending"],
      ["booked", "requested"],
      ["booked", "candidate"],
      ["locked", "booked"],
      ["played", "locked"],
      // Cannot skip forward
      ["candidate", "booked"],
      ["candidate", "locked"],
      ["candidate", "played"],
      ["window_pending", "booked"],
      ["window_pending", "locked"],
      // Terminal states cannot transition
      ["played", "candidate"],
      ["played", "canceled"],
      ["canceled", "candidate"],
      ["canceled", "requested"],
      ["canceled", "booked"],
      // Self-transitions are not valid
      ["candidate", "candidate"],
      ["booked", "booked"],
      ["played", "played"],
      ["canceled", "canceled"],
    ];

    it.each(invalidTransitions)("rejects %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe("getNextStates", () => {
    it('returns ["window_pending", "requested"] for candidate', () => {
      expect(getNextStates("candidate")).toEqual([
        "window_pending",
        "requested",
      ]);
    });

    it('returns ["requested"] for window_pending', () => {
      expect(getNextStates("window_pending")).toEqual(["requested"]);
    });

    it('returns ["partial_hold", "booked", "canceled"] for requested', () => {
      expect(getNextStates("requested")).toEqual([
        "partial_hold",
        "booked",
        "canceled",
      ]);
    });

    it('returns ["booked", "requested", "canceled"] for partial_hold', () => {
      expect(getNextStates("partial_hold")).toEqual([
        "booked",
        "requested",
        "canceled",
      ]);
    });

    it('returns ["swappable", "locked", "canceled"] for booked', () => {
      expect(getNextStates("booked")).toEqual([
        "swappable",
        "locked",
        "canceled",
      ]);
    });

    it('returns ["locked", "canceled"] for swappable', () => {
      expect(getNextStates("swappable")).toEqual(["locked", "canceled"]);
    });

    it('returns ["played", "canceled"] for locked', () => {
      expect(getNextStates("locked")).toEqual(["played", "canceled"]);
    });

    it("returns empty array for played (terminal)", () => {
      expect(getNextStates("played")).toEqual([]);
    });

    it("returns empty array for canceled (terminal)", () => {
      expect(getNextStates("canceled")).toEqual([]);
    });
  });

  describe("validateTransition", () => {
    it("returns valid for allowed transitions", () => {
      const result = validateTransition("candidate", "window_pending");
      expect(result).toEqual({ valid: true });
    });

    it("returns valid for candidate -> requested (skip window_pending)", () => {
      const result = validateTransition("candidate", "requested");
      expect(result).toEqual({ valid: true });
    });

    it("returns error message for invalid transition", () => {
      const result = validateTransition("candidate", "booked");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Cannot transition");
        expect(result.reason).toContain("window_pending");
        expect(result.reason).toContain("requested");
      }
    });

    it("returns terminal message for played", () => {
      const result = validateTransition("played", "candidate");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for canceled", () => {
      const result = validateTransition("canceled", "requested");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });
  });

  describe("full lifecycle", () => {
    it("can traverse the happy path: candidate -> window_pending -> requested -> booked -> locked -> played", () => {
      const lifecycle: BookingRequestStatus[] = [
        "candidate",
        "window_pending",
        "requested",
        "booked",
        "locked",
        "played",
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
      }
    });

    it("can traverse an alternate path with partial hold", () => {
      const lifecycle: BookingRequestStatus[] = [
        "candidate",
        "requested",
        "partial_hold",
        "booked",
        "swappable",
        "locked",
        "played",
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
      }
    });

    it("partial_hold can retry by going back to requested", () => {
      expect(canTransition("partial_hold", "requested")).toBe(true);
    });

    it("every non-terminal state can reach canceled", () => {
      const nonTerminal: BookingRequestStatus[] = [
        "requested",
        "partial_hold",
        "booked",
        "swappable",
        "locked",
      ];

      for (const state of nonTerminal) {
        expect(canTransition(state, "canceled")).toBe(true);
      }
    });

    it("candidate and window_pending cannot directly cancel", () => {
      expect(canTransition("candidate", "canceled")).toBe(false);
      expect(canTransition("window_pending", "canceled")).toBe(false);
    });

    it("terminal states (played, canceled) have no next states", () => {
      expect(getNextStates("played")).toEqual([]);
      expect(getNextStates("canceled")).toEqual([]);
    });
  });
});
