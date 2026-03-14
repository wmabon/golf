import { describe, it, expect } from "vitest";
import {
  calculateStrokePlay,
  calculateBestBall,
  calculateSkins,
  calculateNassau,
} from "@/services/rounds/game.service";

// Helper to create score rows
function score(
  playerId: string,
  holeNumber: number,
  strokes: number,
  netStrokes: number | null = null
) {
  return { playerId, holeNumber, strokes, netStrokes };
}

describe("Game Result Calculations", () => {
  describe("calculateStrokePlay", () => {
    it("sums strokes per player and ranks lowest first", () => {
      const scores = [
        score("p1", 1, 4),
        score("p1", 2, 3),
        score("p1", 3, 5),
        score("p2", 1, 5),
        score("p2", 2, 4),
        score("p2", 3, 4),
      ];

      const result = calculateStrokePlay(scores);

      expect(result).toEqual([
        { playerId: "p1", totalStrokes: 12, rank: 1 },
        { playerId: "p2", totalStrokes: 13, rank: 2 },
      ]);
    });

    it("handles ties with same rank", () => {
      const scores = [
        score("p1", 1, 4),
        score("p1", 2, 4),
        score("p2", 1, 4),
        score("p2", 2, 4),
        score("p3", 1, 5),
        score("p3", 2, 5),
      ];

      const result = calculateStrokePlay(scores);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(1);
      expect(result[2].rank).toBe(3);
    });

    it("returns empty array for no scores", () => {
      expect(calculateStrokePlay([])).toEqual([]);
    });

    it("handles single player", () => {
      const scores = [score("p1", 1, 4), score("p1", 2, 5)];

      const result = calculateStrokePlay(scores);

      expect(result).toEqual([
        { playerId: "p1", totalStrokes: 9, rank: 1 },
      ]);
    });

    it("handles full 18-hole round", () => {
      const scores = Array.from({ length: 18 }, (_, i) =>
        score("p1", i + 1, 4)
      );

      const result = calculateStrokePlay(scores);

      expect(result).toEqual([
        { playerId: "p1", totalStrokes: 72, rank: 1 },
      ]);
    });
  });

  describe("calculateBestBall", () => {
    const teamA = {
      name: "Team A",
      playerIds: ["p1", "p2"],
    };
    const teamB = {
      name: "Team B",
      playerIds: ["p3", "p4"],
    };

    it("takes best score per team per hole", () => {
      const scores = [
        score("p1", 1, 5),
        score("p2", 1, 4), // best for Team A
        score("p3", 1, 3), // best for Team B
        score("p4", 1, 6),
        score("p1", 2, 3), // best for Team A
        score("p2", 2, 5),
        score("p3", 2, 4),
        score("p4", 2, 4), // tie on Team B, either works
      ];

      const result = calculateBestBall(scores, [teamA, teamB]);

      expect(result).toHaveLength(2);
      // Team B: 3 + 4 = 7, Team A: 4 + 3 = 7
      expect(result[0].totalBestBall).toBe(7);
      expect(result[1].totalBestBall).toBe(7);
    });

    it("returns error for empty teams", () => {
      const result = calculateBestBall([], []);
      expect(result).toEqual({ error: "Best ball requires teams" });
    });

    it("selects lowest score from each team member", () => {
      const scores = [
        score("p1", 1, 6),
        score("p2", 1, 3), // Team A best
        score("p3", 1, 4), // Team B best
        score("p4", 1, 7),
      ];

      const result = calculateBestBall(scores, [teamA, teamB]);

      if (Array.isArray(result)) {
        const teamAResult = result.find((r) => r.teamName === "Team A");
        const teamBResult = result.find((r) => r.teamName === "Team B");
        expect(teamAResult!.totalBestBall).toBe(3);
        expect(teamBResult!.totalBestBall).toBe(4);
      }
    });

    it("sorts teams by total (lowest first)", () => {
      const scores = [
        score("p1", 1, 5),
        score("p2", 1, 4),
        score("p3", 1, 3),
        score("p4", 1, 3),
      ];

      const result = calculateBestBall(scores, [teamA, teamB]);

      if (Array.isArray(result)) {
        expect(result[0].teamName).toBe("Team B");
        expect(result[1].teamName).toBe("Team A");
      }
    });

    it("includes hole details with best player per hole", () => {
      const scores = [
        score("p1", 1, 5),
        score("p2", 1, 3),
      ];

      const result = calculateBestBall(scores, [teamA]);

      if (Array.isArray(result)) {
        expect(result[0].holes).toHaveLength(1);
        expect(result[0].holes[0]).toEqual({
          holeNumber: 1,
          bestScore: 3,
          playerId: "p2",
        });
      }
    });
  });

  describe("calculateSkins", () => {
    it("awards skin to outright lowest scorer on a hole", () => {
      const scores = [
        score("p1", 1, 4),
        score("p2", 1, 5),
        score("p3", 1, 6),
      ];

      const result = calculateSkins(scores);

      expect(result.holes).toHaveLength(1);
      expect(result.holes[0].winner).toBe("p1");
      expect(result.holes[0].carryover).toBe(false);
      expect(result.standings).toEqual([{ playerId: "p1", skins: 1 }]);
      expect(result.unclaimedSkins).toBe(0);
    });

    it("carries over skin on tied hole", () => {
      const scores = [
        score("p1", 1, 4),
        score("p2", 1, 4),
        score("p1", 2, 3),
        score("p2", 2, 5),
      ];

      const result = calculateSkins(scores);

      expect(result.holes[0].winner).toBeNull();
      expect(result.holes[0].carryover).toBe(true);
      expect(result.holes[1].winner).toBe("p1");
      expect(result.holes[1].carryover).toBe(false);
      // p1 wins 2 skins (1 original + 1 carryover)
      expect(result.standings[0]).toEqual({ playerId: "p1", skins: 2 });
    });

    it("handles multiple carryovers", () => {
      const scores = [
        score("p1", 1, 4),
        score("p2", 1, 4),
        score("p1", 2, 5),
        score("p2", 2, 5),
        score("p1", 3, 3),
        score("p2", 3, 4),
      ];

      const result = calculateSkins(scores);

      expect(result.holes[0].carryover).toBe(true);
      expect(result.holes[1].carryover).toBe(true);
      expect(result.holes[2].winner).toBe("p1");
      // p1 wins 3 skins (1 + 2 carryovers)
      expect(result.standings[0]).toEqual({ playerId: "p1", skins: 3 });
    });

    it("tracks unclaimed skins at end of round", () => {
      const scores = [
        score("p1", 1, 4),
        score("p2", 1, 4),
      ];

      const result = calculateSkins(scores);

      expect(result.unclaimedSkins).toBe(1);
      expect(result.standings).toEqual([]);
    });

    it("handles empty scores", () => {
      const result = calculateSkins([]);

      expect(result.holes).toEqual([]);
      expect(result.standings).toEqual([]);
      expect(result.unclaimedSkins).toBe(0);
    });

    it("distributes skins across multiple winners", () => {
      const scores = [
        score("p1", 1, 3),
        score("p2", 1, 4),
        score("p1", 2, 5),
        score("p2", 2, 3),
      ];

      const result = calculateSkins(scores);

      expect(result.standings).toHaveLength(2);
      const p1 = result.standings.find((s) => s.playerId === "p1");
      const p2 = result.standings.find((s) => s.playerId === "p2");
      expect(p1!.skins).toBe(1);
      expect(p2!.skins).toBe(1);
    });
  });

  describe("calculateNassau", () => {
    it("returns front 9, back 9, and overall standings", () => {
      const scores = [
        // Front 9
        ...Array.from({ length: 9 }, (_, i) => score("p1", i + 1, 4)),
        ...Array.from({ length: 9 }, (_, i) => score("p2", i + 1, 5)),
        // Back 9
        ...Array.from({ length: 9 }, (_, i) => score("p1", i + 10, 5)),
        ...Array.from({ length: 9 }, (_, i) => score("p2", i + 10, 4)),
      ];

      const result = calculateNassau(scores);

      // Front 9: p1 wins (36 vs 45)
      expect(result.front9[0].playerId).toBe("p1");
      expect(result.front9[0].totalStrokes).toBe(36);

      // Back 9: p2 wins (36 vs 45)
      expect(result.back9[0].playerId).toBe("p2");
      expect(result.back9[0].totalStrokes).toBe(36);

      // Overall: tied at 81
      expect(result.overall[0].totalStrokes).toBe(81);
      expect(result.overall[1].totalStrokes).toBe(81);
    });

    it("handles empty scores", () => {
      const result = calculateNassau([]);

      expect(result.front9).toEqual([]);
      expect(result.back9).toEqual([]);
      expect(result.overall).toEqual([]);
    });

    it("handles partial round (front 9 only)", () => {
      const scores = [
        ...Array.from({ length: 9 }, (_, i) => score("p1", i + 1, 4)),
        ...Array.from({ length: 9 }, (_, i) => score("p2", i + 1, 5)),
      ];

      const result = calculateNassau(scores);

      expect(result.front9).toHaveLength(2);
      expect(result.back9).toEqual([]);
      expect(result.overall).toHaveLength(2);
    });

    it("correctly separates holes 1-9 and 10-18", () => {
      const scores = [
        score("p1", 9, 4), // last front 9 hole
        score("p1", 10, 5), // first back 9 hole
      ];

      const result = calculateNassau(scores);

      expect(result.front9).toHaveLength(1);
      expect(result.front9[0].totalStrokes).toBe(4);
      expect(result.back9).toHaveLength(1);
      expect(result.back9[0].totalStrokes).toBe(5);
    });

    it("assigns correct ranks in each sub-competition", () => {
      const scores = [
        ...Array.from({ length: 9 }, (_, i) => score("p1", i + 1, 4)),
        ...Array.from({ length: 9 }, (_, i) => score("p2", i + 1, 4)),
        ...Array.from({ length: 9 }, (_, i) => score("p3", i + 1, 5)),
      ];

      const result = calculateNassau(scores);

      // p1 and p2 tied at rank 1, p3 at rank 3
      expect(result.front9[0].rank).toBe(1);
      expect(result.front9[1].rank).toBe(1);
      expect(result.front9[2].rank).toBe(3);
    });
  });
});
