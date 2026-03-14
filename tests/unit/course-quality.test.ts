import { describe, it, expect } from "vitest";
import {
  generateValueLabel,
  scoreAccessEligibility,
  scoreBudgetFit,
  scoreConvenience,
  scoreAvailability,
  scoreQuality,
  computeWeightedScore,
  TRIP_FIT_WEIGHTS,
} from "@/services/discovery/course-quality.service";

describe("generateValueLabel", () => {
  it("returns 'Excellent value' for high quality + low price", () => {
    // editorial=4.5, price=$150 => ratio = 4.5 / 1.5 = 3.0 > 2.0
    const result = generateValueLabel(4.5, 150);
    expect(result.valueLabel).toBe("Excellent value");
    expect(result.valueScore).toBe(3);
  });

  it("returns 'Good value' for moderate quality and price", () => {
    // editorial=4.0, price=$250 => ratio = 4.0 / 2.5 = 1.6 > 1.5
    const result = generateValueLabel(4.0, 250);
    expect(result.valueLabel).toBe("Good value");
    expect(result.valueScore).toBe(1.6);
  });

  it("returns 'Fair value' for balanced quality and price", () => {
    // editorial=3.5, price=$300 => ratio = 3.5 / 3.0 = 1.167 > 1.0
    const result = generateValueLabel(3.5, 300);
    expect(result.valueLabel).toBe("Fair value");
    expect(result.valueScore).toBe(1.2);
  });

  it("returns 'Premium price, solid quality' for high quality + high price", () => {
    // editorial=4.0, price=$500 => ratio = 4.0 / 5.0 = 0.8 > 0.5
    const result = generateValueLabel(4.0, 500);
    expect(result.valueLabel).toBe("Premium price, solid quality");
    expect(result.valueScore).toBe(0.8);
  });

  it("returns 'Premium price, mixed value signal' for low quality + high price", () => {
    // editorial=2.0, price=$500 => ratio = 2.0 / 5.0 = 0.4 <= 0.5
    const result = generateValueLabel(2.0, 500);
    expect(result.valueLabel).toBe("Premium price, mixed value signal");
    expect(result.valueScore).toBe(0.4);
  });

  it("returns null for missing editorial score", () => {
    const result = generateValueLabel(null, 200);
    expect(result.valueScore).toBeNull();
    expect(result.valueLabel).toBeNull();
  });

  it("returns null for missing price", () => {
    const result = generateValueLabel(4.0, null);
    expect(result.valueScore).toBeNull();
    expect(result.valueLabel).toBeNull();
  });

  it("returns null for zero price", () => {
    const result = generateValueLabel(4.0, 0);
    expect(result.valueScore).toBeNull();
    expect(result.valueLabel).toBeNull();
  });
});

describe("Trip-fit scoring functions", () => {
  describe("scoreAccessEligibility", () => {
    it("gives public courses full score (100)", () => {
      expect(scoreAccessEligibility("public")).toBe(100);
    });

    it("gives resort courses 80", () => {
      expect(scoreAccessEligibility("resort")).toBe(80);
    });

    it("gives semi_private courses 60", () => {
      expect(scoreAccessEligibility("semi_private")).toBe(60);
    });

    it("gives private courses 0 without sponsor", () => {
      expect(scoreAccessEligibility("private")).toBe(0);
    });

    it("gives private courses 100 with sponsor", () => {
      expect(scoreAccessEligibility("private", true)).toBe(100);
    });

    it("gives unknown courses 0", () => {
      expect(scoreAccessEligibility("unknown")).toBe(0);
    });
  });

  describe("scoreBudgetFit", () => {
    it("gives 100 when course price is within budget", () => {
      expect(scoreBudgetFit(100, 150)).toBe(100);
    });

    it("gives 100 when course price equals budget", () => {
      expect(scoreBudgetFit(150, 150)).toBe(100);
    });

    it("gives 50 when course price is within 1.5x budget", () => {
      expect(scoreBudgetFit(200, 150)).toBe(50);
    });

    it("gives 0 when course price exceeds 1.5x budget", () => {
      expect(scoreBudgetFit(300, 150)).toBe(0);
    });

    it("gives 50 (neutral) when course price is unknown", () => {
      expect(scoreBudgetFit(null, 150)).toBe(50);
    });

    it("gives 50 (neutral) when budget is unknown", () => {
      expect(scoreBudgetFit(100, null)).toBe(50);
    });
  });

  describe("scoreConvenience", () => {
    it("gives 100 for courses within 10 miles", () => {
      expect(scoreConvenience(5)).toBe(100);
    });

    it("gives 80 for courses within 30 miles", () => {
      expect(scoreConvenience(25)).toBe(80);
    });

    it("gives 60 for courses within 60 miles", () => {
      expect(scoreConvenience(45)).toBe(60);
    });

    it("gives 30 for courses within 100 miles", () => {
      expect(scoreConvenience(80)).toBe(30);
    });

    it("gives 10 for courses over 100 miles", () => {
      expect(scoreConvenience(150)).toBe(10);
    });
  });

  describe("scoreAvailability", () => {
    it("gives 80 when public times are available", () => {
      expect(scoreAvailability(true)).toBe(80);
    });

    it("gives 40 when public times are not available", () => {
      expect(scoreAvailability(false)).toBe(40);
    });

    it("gives 40 when availability is unknown (null)", () => {
      expect(scoreAvailability(null)).toBe(40);
    });
  });

  describe("scoreQuality", () => {
    it("gives 100 for top editorial score (5.0)", () => {
      expect(scoreQuality(5.0)).toBe(100);
    });

    it("normalizes editorial score to 0-100 scale", () => {
      expect(scoreQuality(3.0)).toBe(60);
    });

    it("gives 50 (neutral) when editorial score is null", () => {
      expect(scoreQuality(null)).toBe(50);
    });
  });

  describe("computeWeightedScore", () => {
    it("computes correct weighted score for a public course with matching budget", () => {
      const breakdown = {
        access: 100, // public
        budget: 100, // within budget
        convenience: 80, // 20 miles
        availability: 80, // public times
        quality: 60, // editorial 3.0
      };
      // (100*30 + 100*25 + 80*20 + 80*10 + 60*15) / 100
      // = (3000 + 2500 + 1600 + 800 + 900) / 100
      // = 8800 / 100 = 88
      const score = computeWeightedScore(breakdown);
      expect(score).toBe(88);
    });

    it("computes low score for private course without sponsor", () => {
      const breakdown = {
        access: 0, // private, no sponsor
        budget: 50, // price unknown
        convenience: 10, // far away
        availability: 40, // no public times
        quality: 50, // unknown editorial
      };
      // (0*30 + 50*25 + 10*20 + 40*10 + 50*15) / 100
      // = (0 + 1250 + 200 + 400 + 750) / 100
      // = 2600 / 100 = 26
      const score = computeWeightedScore(breakdown);
      expect(score).toBe(26);
    });

    it("computes low convenience score for distant course", () => {
      const breakdown = {
        access: 100,
        budget: 100,
        convenience: 10, // over 100 miles
        availability: 80,
        quality: 80,
      };
      // (100*30 + 100*25 + 10*20 + 80*10 + 80*15) / 100
      // = (3000 + 2500 + 200 + 800 + 1200) / 100
      // = 7700 / 100 = 77
      const score = computeWeightedScore(breakdown);
      expect(score).toBe(77);
    });
  });

  describe("TRIP_FIT_WEIGHTS", () => {
    it("weights sum to 100", () => {
      const sum =
        TRIP_FIT_WEIGHTS.access +
        TRIP_FIT_WEIGHTS.budget +
        TRIP_FIT_WEIGHTS.convenience +
        TRIP_FIT_WEIGHTS.availability +
        TRIP_FIT_WEIGHTS.quality;
      expect(sum).toBe(100);
    });

    it("access has the highest weight", () => {
      expect(TRIP_FIT_WEIGHTS.access).toBeGreaterThan(TRIP_FIT_WEIGHTS.budget);
      expect(TRIP_FIT_WEIGHTS.access).toBeGreaterThan(
        TRIP_FIT_WEIGHTS.convenience
      );
      expect(TRIP_FIT_WEIGHTS.access).toBeGreaterThan(
        TRIP_FIT_WEIGHTS.availability
      );
      expect(TRIP_FIT_WEIGHTS.access).toBeGreaterThan(
        TRIP_FIT_WEIGHTS.quality
      );
    });
  });
});
