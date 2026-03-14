import { describe, it, expect } from "vitest";
import {
  createOptionSchema,
  castVoteSchema,
  setVotingDeadlineSchema,
  switchVotingModeSchema,
} from "@/lib/validation/trips";

describe("createOptionSchema", () => {
  it("accepts a valid option", () => {
    const result = createOptionSchema.safeParse({
      type: "course",
      title: "Pinehurst No. 2",
      estimatedCostPerGolfer: 250,
      fitScore: 4.5,
      fitRationale: "Great course for the group",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createOptionSchema.safeParse({
      type: "course",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createOptionSchema.safeParse({
      type: "resort",
      title: "Test Option",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields omitted", () => {
    const result = createOptionSchema.safeParse({
      type: "destination",
      title: "Scottsdale, AZ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimatedCostPerGolfer).toBeUndefined();
      expect(result.data.fitScore).toBeUndefined();
      expect(result.data.fitRationale).toBeUndefined();
    }
  });

  it("rejects fitScore > 5", () => {
    const result = createOptionSchema.safeParse({
      type: "course",
      title: "Test",
      fitScore: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects fitScore < 0", () => {
    const result = createOptionSchema.safeParse({
      type: "course",
      title: "Test",
      fitScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all three option types", () => {
    for (const type of ["destination", "course", "itinerary"]) {
      const result = createOptionSchema.safeParse({
        type,
        title: "Test Option",
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("castVoteSchema", () => {
  it("accepts a valid vote", () => {
    const result = castVoteSchema.safeParse({
      voteValue: "in",
      comment: "Looks great!",
      budgetObjection: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid voteValue", () => {
    const result = castVoteSchema.safeParse({
      voteValue: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("defaults budgetObjection to false", () => {
    const result = castVoteSchema.safeParse({
      voteValue: "fine",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budgetObjection).toBe(false);
    }
  });

  it("accepts comment", () => {
    const result = castVoteSchema.safeParse({
      voteValue: "out",
      comment: "Too expensive for me",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBe("Too expensive for me");
    }
  });

  it("accepts all three vote values", () => {
    for (const voteValue of ["in", "fine", "out"]) {
      const result = castVoteSchema.safeParse({ voteValue });
      expect(result.success).toBe(true);
    }
  });

  it("accepts null comment", () => {
    const result = castVoteSchema.safeParse({
      voteValue: "in",
      comment: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("setVotingDeadlineSchema", () => {
  it("accepts valid ISO datetime", () => {
    const result = setVotingDeadlineSchema.safeParse({
      deadline: "2026-06-15T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = setVotingDeadlineSchema.safeParse({
      deadline: "next Tuesday",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing deadline", () => {
    const result = setVotingDeadlineSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("switchVotingModeSchema", () => {
  it("accepts destination", () => {
    const result = switchVotingModeSchema.safeParse({ mode: "destination" });
    expect(result.success).toBe(true);
  });

  it("accepts course", () => {
    const result = switchVotingModeSchema.safeParse({ mode: "course" });
    expect(result.success).toBe(true);
  });

  it("rejects other values", () => {
    const result = switchVotingModeSchema.safeParse({ mode: "itinerary" });
    expect(result.success).toBe(false);
  });

  it("rejects empty", () => {
    const result = switchVotingModeSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
