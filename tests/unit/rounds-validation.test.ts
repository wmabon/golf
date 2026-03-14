import { describe, it, expect } from "vitest";
import {
  createRoundSchema,
  updateRoundSchema,
  batchScoreSchema,
  createGameSchema,
  createBetSchema,
  resolveBetSchema,
} from "@/lib/validation/rounds";

describe("Rounds Validation Schemas", () => {
  describe("createRoundSchema", () => {
    const validRound = {
      courseId: "550e8400-e29b-41d4-a716-446655440000",
      roundDate: "2026-06-15",
    };

    it("accepts a valid round with required fields", () => {
      const result = createRoundSchema.safeParse(validRound);
      expect(result.success).toBe(true);
    });

    it("accepts round with optional format", () => {
      const result = createRoundSchema.safeParse({
        ...validRound,
        format: "stroke_play",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid courseId (not UUID)", () => {
      const result = createRoundSchema.safeParse({
        ...validRound,
        courseId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing courseId", () => {
      const { courseId, ...noId } = validRound;
      const result = createRoundSchema.safeParse(noId);
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format", () => {
      const result = createRoundSchema.safeParse({
        ...validRound,
        roundDate: "06/15/2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing roundDate", () => {
      const { roundDate, ...noDate } = validRound;
      const result = createRoundSchema.safeParse(noDate);
      expect(result.success).toBe(false);
    });

    it("rejects format exceeding 50 characters", () => {
      const result = createRoundSchema.safeParse({
        ...validRound,
        format: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = createRoundSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("updateRoundSchema", () => {
    it("accepts partial update with only courseId", () => {
      const result = updateRoundSchema.safeParse({
        courseId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with only roundDate", () => {
      const result = updateRoundSchema.safeParse({
        roundDate: "2026-06-16",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (no updates)", () => {
      const result = updateRoundSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid courseId in partial", () => {
      const result = updateRoundSchema.safeParse({
        courseId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("batchScoreSchema", () => {
    const validScore = {
      playerId: "550e8400-e29b-41d4-a716-446655440000",
      entries: [{ holeNumber: 1, strokes: 4 }],
    };

    it("accepts valid single entry", () => {
      const result = batchScoreSchema.safeParse(validScore);
      expect(result.success).toBe(true);
    });

    it("accepts multiple entries", () => {
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries: [
          { holeNumber: 1, strokes: 4 },
          { holeNumber: 2, strokes: 3 },
          { holeNumber: 3, strokes: 5, netStrokes: 4 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts all 18 holes", () => {
      const entries = Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        strokes: 4,
      }));
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty entries array", () => {
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 18 entries", () => {
      const entries = Array.from({ length: 19 }, (_, i) => ({
        holeNumber: (i % 18) + 1,
        strokes: 4,
      }));
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries,
      });
      expect(result.success).toBe(false);
    });

    it("rejects hole number 0", () => {
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries: [{ holeNumber: 0, strokes: 4 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects hole number 19", () => {
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries: [{ holeNumber: 19, strokes: 4 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects strokes less than 1", () => {
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries: [{ holeNumber: 1, strokes: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer strokes", () => {
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries: [{ holeNumber: 1, strokes: 4.5 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid playerId", () => {
      const result = batchScoreSchema.safeParse({
        playerId: "not-a-uuid",
        entries: [{ holeNumber: 1, strokes: 4 }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts entry with netStrokes", () => {
      const result = batchScoreSchema.safeParse({
        ...validScore,
        entries: [{ holeNumber: 1, strokes: 5, netStrokes: 4 }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createGameSchema", () => {
    const validGame = {
      format: "stroke_play" as const,
    };

    it("accepts valid minimal game", () => {
      const result = createGameSchema.safeParse(validGame);
      expect(result.success).toBe(true);
    });

    it("accepts all valid formats", () => {
      for (const format of [
        "stroke_play",
        "best_ball",
        "skins",
        "nassau",
        "custom",
      ]) {
        const result = createGameSchema.safeParse({ format });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid format", () => {
      const result = createGameSchema.safeParse({ format: "scramble" });
      expect(result.success).toBe(false);
    });

    it("accepts game with all optional fields", () => {
      const result = createGameSchema.safeParse({
        ...validGame,
        templateId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Morning Stroke Play",
        teams: [
          {
            name: "Team A",
            playerIds: ["550e8400-e29b-41d4-a716-446655440001"],
          },
        ],
        stakesPerPlayer: 10,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid templateId", () => {
      const result = createGameSchema.safeParse({
        ...validGame,
        templateId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative stakesPerPlayer", () => {
      const result = createGameSchema.safeParse({
        ...validGame,
        stakesPerPlayer: -5,
      });
      expect(result.success).toBe(false);
    });

    it("accepts zero stakesPerPlayer (pride game)", () => {
      const result = createGameSchema.safeParse({
        ...validGame,
        stakesPerPlayer: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects teams with empty playerIds", () => {
      const result = createGameSchema.safeParse({
        ...validGame,
        teams: [{ name: "Team A", playerIds: [] }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing format", () => {
      const result = createGameSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("accepts name at 255 characters", () => {
      const result = createGameSchema.safeParse({
        ...validGame,
        name: "a".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    it("rejects name exceeding 255 characters", () => {
      const result = createGameSchema.safeParse({
        ...validGame,
        name: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createBetSchema", () => {
    const validBet = {
      amount: 5,
      triggerDescription: "Closest to the pin on hole 7",
      participantIds: ["550e8400-e29b-41d4-a716-446655440000"],
    };

    it("accepts valid minimal bet", () => {
      const result = createBetSchema.safeParse(validBet);
      expect(result.success).toBe(true);
    });

    it("accepts zero dollar pride bet", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        amount: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative amount", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        amount: -1,
      });
      expect(result.success).toBe(false);
    });

    it("accepts bet with all optional fields", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        roundId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Closest to pin",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty triggerDescription", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        triggerDescription: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects triggerDescription exceeding 2000 characters", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        triggerDescription: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty participantIds", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        participantIds: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID in participantIds", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        participantIds: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });

    it("accepts multiple participants", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        participantIds: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
          "550e8400-e29b-41d4-a716-446655440003",
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing amount", () => {
      const { amount, ...noAmount } = validBet;
      const result = createBetSchema.safeParse(noAmount);
      expect(result.success).toBe(false);
    });

    it("rejects missing triggerDescription", () => {
      const { triggerDescription, ...noDesc } = validBet;
      const result = createBetSchema.safeParse(noDesc);
      expect(result.success).toBe(false);
    });

    it("rejects missing participantIds", () => {
      const { participantIds, ...noParts } = validBet;
      const result = createBetSchema.safeParse(noParts);
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = createBetSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 255 characters", () => {
      const result = createBetSchema.safeParse({
        ...validBet,
        name: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resolveBetSchema", () => {
    it("accepts valid outcome", () => {
      const result = resolveBetSchema.safeParse({
        outcome: "Player A won closest to pin",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty outcome", () => {
      const result = resolveBetSchema.safeParse({ outcome: "" });
      expect(result.success).toBe(false);
    });

    it("rejects outcome exceeding 2000 characters", () => {
      const result = resolveBetSchema.safeParse({
        outcome: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing outcome", () => {
      const result = resolveBetSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
