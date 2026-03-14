import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStates,
  validateTransition,
} from "@/services/booking/state-machines/reservation-sm";
import type { ReservationStatus } from "@/types";

describe("Reservation State Machine", () => {
  describe("canTransition", () => {
    const validTransitions: [ReservationStatus, ReservationStatus][] = [
      ["confirmed", "swappable"],
      ["confirmed", "locked"],
      ["confirmed", "canceled"],
      ["confirmed", "played"],
      ["confirmed", "no_show"],
      ["swappable", "locked"],
      ["swappable", "canceled"],
      ["locked", "played"],
      ["locked", "canceled"],
      ["locked", "no_show"],
    ];

    it.each(validTransitions)("allows %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [ReservationStatus, ReservationStatus][] = [
      // Cannot go backwards
      ["swappable", "confirmed"],
      ["locked", "confirmed"],
      ["locked", "swappable"],
      ["played", "locked"],
      ["played", "confirmed"],
      ["canceled", "confirmed"],
      // Terminal states cannot transition
      ["played", "canceled"],
      ["played", "swappable"],
      ["canceled", "confirmed"],
      ["canceled", "played"],
      ["no_show", "confirmed"],
      ["no_show", "played"],
      ["no_show", "canceled"],
      // Self-transitions are not valid
      ["confirmed", "confirmed"],
      ["locked", "locked"],
      ["played", "played"],
      ["canceled", "canceled"],
      ["no_show", "no_show"],
      // swappable cannot go to played directly
      ["swappable", "played"],
      ["swappable", "no_show"],
    ];

    it.each(invalidTransitions)("rejects %s -> %s", (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe("getNextStates", () => {
    it('returns ["swappable", "locked", "canceled", "played", "no_show"] for confirmed', () => {
      expect(getNextStates("confirmed")).toEqual([
        "swappable",
        "locked",
        "canceled",
        "played",
        "no_show",
      ]);
    });

    it('returns ["locked", "canceled"] for swappable', () => {
      expect(getNextStates("swappable")).toEqual(["locked", "canceled"]);
    });

    it('returns ["played", "canceled", "no_show"] for locked', () => {
      expect(getNextStates("locked")).toEqual([
        "played",
        "canceled",
        "no_show",
      ]);
    });

    it("returns empty array for played (terminal)", () => {
      expect(getNextStates("played")).toEqual([]);
    });

    it("returns empty array for canceled (terminal)", () => {
      expect(getNextStates("canceled")).toEqual([]);
    });

    it("returns empty array for no_show (terminal)", () => {
      expect(getNextStates("no_show")).toEqual([]);
    });
  });

  describe("validateTransition", () => {
    it("returns valid for allowed transitions", () => {
      const result = validateTransition("confirmed", "locked");
      expect(result).toEqual({ valid: true });
    });

    it("returns error message for invalid transition", () => {
      const result = validateTransition("swappable", "confirmed");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Cannot transition");
        expect(result.reason).toContain("locked");
        expect(result.reason).toContain("canceled");
      }
    });

    it("returns terminal message for played", () => {
      const result = validateTransition("played", "confirmed");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for canceled", () => {
      const result = validateTransition("canceled", "confirmed");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });

    it("returns terminal message for no_show", () => {
      const result = validateTransition("no_show", "confirmed");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("cannot transition");
      }
    });
  });

  describe("full lifecycle", () => {
    it("can traverse the happy path: confirmed -> locked -> played", () => {
      const lifecycle: ReservationStatus[] = [
        "confirmed",
        "locked",
        "played",
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
      }
    });

    it("can traverse with swap: confirmed -> swappable -> locked -> played", () => {
      const lifecycle: ReservationStatus[] = [
        "confirmed",
        "swappable",
        "locked",
        "played",
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
      }
    });

    it("can go directly from confirmed to played", () => {
      expect(canTransition("confirmed", "played")).toBe(true);
    });

    it("cancellation is available from confirmed, swappable, and locked", () => {
      const cancelableStates: ReservationStatus[] = [
        "confirmed",
        "swappable",
        "locked",
      ];
      for (const state of cancelableStates) {
        expect(canTransition(state, "canceled")).toBe(true);
      }
    });

    it("no_show only from confirmed or locked", () => {
      expect(canTransition("confirmed", "no_show")).toBe(true);
      expect(canTransition("locked", "no_show")).toBe(true);
      expect(canTransition("swappable", "no_show")).toBe(false);
    });

    it("terminal states (played, canceled, no_show) have no next states", () => {
      expect(getNextStates("played")).toEqual([]);
      expect(getNextStates("canceled")).toEqual([]);
      expect(getNextStates("no_show")).toEqual([]);
    });
  });
});
