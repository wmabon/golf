import { describe, it, expect } from "vitest";
import {
  computePartySplit,
  computeTargetTimes,
} from "@/services/booking/party-split";

describe("Party Split Algorithm", () => {
  describe("computePartySplit with maxPlayers=4", () => {
    const cases: [number, number[]][] = [
      [2, [2]],
      [3, [3]],
      [4, [4]],
      [5, [3, 2]],
      [6, [3, 3]],
      [7, [4, 3]],
      [8, [4, 4]],
    ];

    it.each(cases)(
      "splits %d golfers into %j",
      (golferCount, expected) => {
        expect(computePartySplit(golferCount, 4)).toEqual(expected);
      }
    );
  });

  describe("computePartySplit with maxPlayers=3", () => {
    const cases: [number, number[]][] = [
      [2, [2]],
      [3, [3]],
      [4, [2, 2]],
      [5, [3, 2]],
      [6, [3, 3]],
      [7, [3, 2, 2]],
      [8, [3, 3, 2]],
    ];

    it.each(cases)(
      "splits %d golfers into %j",
      (golferCount, expected) => {
        expect(computePartySplit(golferCount, 3)).toEqual(expected);
      }
    );
  });

  describe("computePartySplit with maxPlayers=5", () => {
    const cases: [number, number[]][] = [
      [2, [2]],
      [3, [3]],
      [4, [4]],
      [5, [5]],
      [6, [3, 3]],
      [7, [4, 3]],
      [8, [4, 4]],
    ];

    it.each(cases)(
      "splits %d golfers into %j",
      (golferCount, expected) => {
        expect(computePartySplit(golferCount, 5)).toEqual(expected);
      }
    );
  });

  describe("computePartySplit edge cases", () => {
    it("returns [1] for a single golfer", () => {
      expect(computePartySplit(1, 4)).toEqual([1]);
    });

    it("throws for 0 golfers", () => {
      expect(() => computePartySplit(0, 4)).toThrow(
        "Golfer count must be an integer between 1 and 8"
      );
    });

    it("throws for 9 golfers", () => {
      expect(() => computePartySplit(9, 4)).toThrow(
        "Golfer count must be an integer between 1 and 8"
      );
    });

    it("throws for negative golfers", () => {
      expect(() => computePartySplit(-1, 4)).toThrow(
        "Golfer count must be an integer between 1 and 8"
      );
    });

    it("throws for non-integer golfer count", () => {
      expect(() => computePartySplit(3.5, 4)).toThrow(
        "Golfer count must be an integer between 1 and 8"
      );
    });

    it("throws for maxPlayers of 0", () => {
      expect(() => computePartySplit(4, 0)).toThrow(
        "Max players must be a positive integer"
      );
    });

    it("throws for negative maxPlayers", () => {
      expect(() => computePartySplit(4, -1)).toThrow(
        "Max players must be a positive integer"
      );
    });

    it("handles maxPlayers=1 correctly", () => {
      expect(computePartySplit(3, 1)).toEqual([1, 1, 1]);
    });

    it("handles maxPlayers=2 for 7 golfers", () => {
      expect(computePartySplit(7, 2)).toEqual([2, 2, 2, 1]);
    });

    it("all groups sum to total golfer count", () => {
      for (let golfers = 1; golfers <= 8; golfers++) {
        for (let max = 1; max <= 5; max++) {
          const split = computePartySplit(golfers, max);
          const sum = split.reduce((a, b) => a + b, 0);
          expect(sum).toBe(golfers);
        }
      }
    });

    it("no group exceeds maxPlayers", () => {
      for (let golfers = 1; golfers <= 8; golfers++) {
        for (let max = 1; max <= 5; max++) {
          const split = computePartySplit(golfers, max);
          for (const group of split) {
            expect(group).toBeLessThanOrEqual(max);
          }
        }
      }
    });

    it("groups are sorted descending", () => {
      for (let golfers = 1; golfers <= 8; golfers++) {
        for (let max = 1; max <= 5; max++) {
          const split = computePartySplit(golfers, max);
          for (let i = 0; i < split.length - 1; i++) {
            expect(split[i]).toBeGreaterThanOrEqual(split[i + 1]);
          }
        }
      }
    });
  });

  describe("computeTargetTimes", () => {
    it("returns correct times for two groups at 10-minute intervals", () => {
      expect(computeTargetTimes("08:00", [3, 3], 10)).toEqual([
        "08:00",
        "08:10",
      ]);
    });

    it("returns single time for single group", () => {
      expect(computeTargetTimes("09:30", [4])).toEqual(["09:30"]);
    });

    it("uses 10-minute default interval", () => {
      expect(computeTargetTimes("07:00", [4, 4])).toEqual([
        "07:00",
        "07:10",
      ]);
    });

    it("handles custom interval of 8 minutes", () => {
      expect(computeTargetTimes("10:00", [3, 3, 2], 8)).toEqual([
        "10:00",
        "10:08",
        "10:16",
      ]);
    });

    it("handles time crossing the hour boundary", () => {
      expect(computeTargetTimes("08:55", [4, 4], 10)).toEqual([
        "08:55",
        "09:05",
      ]);
    });

    it("handles midnight crossing", () => {
      expect(computeTargetTimes("23:55", [3, 3], 10)).toEqual([
        "23:55",
        "00:05",
      ]);
    });

    it("throws for invalid time format", () => {
      expect(() => computeTargetTimes("8:00", [3, 3])).toThrow(
        'must be in "HH:MM" format'
      );
      expect(() => computeTargetTimes("08:00:00", [3, 3])).toThrow(
        'must be in "HH:MM" format'
      );
      expect(() => computeTargetTimes("abc", [3, 3])).toThrow(
        'must be in "HH:MM" format'
      );
    });

    it("throws for invalid time values", () => {
      expect(() => computeTargetTimes("25:00", [3, 3])).toThrow(
        "Invalid time values"
      );
      expect(() => computeTargetTimes("08:60", [3, 3])).toThrow(
        "Invalid time values"
      );
    });

    it("throws for invalid interval", () => {
      expect(() => computeTargetTimes("08:00", [3, 3], 0)).toThrow(
        "Interval must be a positive integer"
      );
      expect(() => computeTargetTimes("08:00", [3, 3], -5)).toThrow(
        "Interval must be a positive integer"
      );
    });

    it("returns empty array for empty groups", () => {
      expect(computeTargetTimes("08:00", [])).toEqual([]);
    });
  });
});
