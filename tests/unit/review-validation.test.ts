import { describe, it, expect } from "vitest";
import {
  createReviewSchema,
  updateReviewSchema,
  updateQualityScoresSchema,
} from "@/lib/validation/reviews";

describe("createReviewSchema", () => {
  it("accepts valid review with all 6 dimensions", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 4,
      layout: 5,
      value: 3,
      pace: 4,
      service: 5,
      vibe: 4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects dimension < 1", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 0,
      layout: 5,
      value: 3,
      pace: 4,
      service: 5,
      vibe: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects dimension > 5", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 4,
      layout: 6,
      value: 3,
      pace: 4,
      service: 5,
      vibe: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer dimension", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 4.5,
      layout: 5,
      value: 3,
      pace: 4,
      service: 5,
      vibe: 4,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional text", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 4,
      layout: 5,
      value: 3,
      pace: 4,
      service: 5,
      vibe: 4,
      text: "Great course with beautiful views!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe("Great course with beautiful views!");
    }
  });

  it("accepts null text", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 4,
      layout: 5,
      value: 3,
      pace: 4,
      service: 5,
      vibe: 4,
      text: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional roundId", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 4,
      layout: 5,
      value: 3,
      pace: 4,
      service: 5,
      vibe: 4,
      roundId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roundId).toBe(
        "123e4567-e89b-12d3-a456-426614174000"
      );
    }
  });

  it("rejects missing dimensions", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 4,
      layout: 5,
      // missing value, pace, service, vibe
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = createReviewSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts boundary values (1 and 5)", () => {
    const result = createReviewSchema.safeParse({
      conditioning: 1,
      layout: 1,
      value: 5,
      pace: 5,
      service: 1,
      vibe: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateReviewSchema", () => {
  it("accepts partial update with only some dimensions", () => {
    const result = updateReviewSchema.safeParse({
      conditioning: 5,
      layout: 4,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conditioning).toBe(5);
      expect(result.data.layout).toBe(4);
      expect(result.data.value).toBeUndefined();
    }
  });

  it("accepts text-only update", () => {
    const result = updateReviewSchema.safeParse({
      text: "Updated review text after second visit.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe("Updated review text after second visit.");
    }
  });

  it("rejects invalid dimension values", () => {
    const result = updateReviewSchema.safeParse({
      conditioning: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects dimension > 5", () => {
    const result = updateReviewSchema.safeParse({
      vibe: 6,
    });
    expect(result.success).toBe(false);
  });

  it("accepts null text to clear it", () => {
    const result = updateReviewSchema.safeParse({
      text: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateReviewSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("updateQualityScoresSchema", () => {
  it("accepts valid admin update", () => {
    const result = updateQualityScoresSchema.safeParse({
      editorialScore: 4.5,
      externalRankScore: 3.8,
      valueScore: 4.0,
      valueLabel: "Good value",
    });
    expect(result.success).toBe(true);
  });

  it("rejects scores > 5", () => {
    const result = updateQualityScoresSchema.safeParse({
      editorialScore: 5.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects scores < 0", () => {
    const result = updateQualityScoresSchema.safeParse({
      editorialScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts partial update", () => {
    const result = updateQualityScoresSchema.safeParse({
      editorialScore: 4.2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.editorialScore).toBe(4.2);
      expect(result.data.externalRankScore).toBeUndefined();
    }
  });

  it("accepts null valueLabel", () => {
    const result = updateQualityScoresSchema.safeParse({
      valueLabel: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valueLabel).toBeNull();
    }
  });

  it("accepts tripFitInputs as a record", () => {
    const result = updateQualityScoresSchema.safeParse({
      tripFitInputs: { access: 100, budget: 80 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null tripFitInputs", () => {
    const result = updateQualityScoresSchema.safeParse({
      tripFitInputs: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateQualityScoresSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
