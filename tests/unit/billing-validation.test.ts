import { describe, it, expect } from "vitest";
import {
  feeEstimateSchema,
  updateFeeScheduleSchema,
  createFeeChargeSchema,
} from "@/lib/validation/billing";

describe("Billing Validation Schemas", () => {
  describe("feeEstimateSchema", () => {
    it("accepts valid tee_time_service estimate", () => {
      const result = feeEstimateSchema.safeParse({
        type: "tee_time_service",
        baseCost: 150.0,
        numGolfers: 4,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid cancellation_penalty estimate", () => {
      const result = feeEstimateSchema.safeParse({
        type: "cancellation_penalty",
        baseCost: 50.0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid pass_through estimate", () => {
      const result = feeEstimateSchema.safeParse({
        type: "pass_through",
        baseCost: 25.0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts numGolfers as optional", () => {
      const result = feeEstimateSchema.safeParse({
        type: "tee_time_service",
        baseCost: 100.0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects bet_fee as M2 fee type", () => {
      const result = feeEstimateSchema.safeParse({
        type: "bet_fee",
        baseCost: 10.0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative baseCost", () => {
      const result = feeEstimateSchema.safeParse({
        type: "tee_time_service",
        baseCost: -5.0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero golfers", () => {
      const result = feeEstimateSchema.safeParse({
        type: "tee_time_service",
        baseCost: 100.0,
        numGolfers: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 8 golfers", () => {
      const result = feeEstimateSchema.safeParse({
        type: "tee_time_service",
        baseCost: 100.0,
        numGolfers: 9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer golfers", () => {
      const result = feeEstimateSchema.safeParse({
        type: "tee_time_service",
        baseCost: 100.0,
        numGolfers: 3.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid fee type", () => {
      const result = feeEstimateSchema.safeParse({
        type: "invalid_type",
        baseCost: 100.0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateFeeScheduleSchema", () => {
    it("accepts valid flat fee schedule", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "tee_time_service",
        calculationMethod: "flat",
        flatAmount: 5.0,
        effectiveFrom: "2026-04-01T00:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid percentage fee schedule", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "bet_fee",
        calculationMethod: "percentage",
        percentageRate: 0.05,
        perGolferCap: 25.0,
        effectiveFrom: "2026-04-01T00:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all fee types", () => {
      const feeTypes = [
        "tee_time_service",
        "bet_fee",
        "lodging_service",
        "air_service",
        "cancellation_penalty",
        "pass_through",
      ];
      for (const feeType of feeTypes) {
        const result = updateFeeScheduleSchema.safeParse({
          feeType,
          calculationMethod: "flat",
          flatAmount: 10.0,
          effectiveFrom: "2026-04-01T00:00:00Z",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid fee type", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "invalid",
        calculationMethod: "flat",
        flatAmount: 5.0,
        effectiveFrom: "2026-04-01T00:00:00Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid calculation method", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "tee_time_service",
        calculationMethod: "tiered",
        flatAmount: 5.0,
        effectiveFrom: "2026-04-01T00:00:00Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative flat amount", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "tee_time_service",
        calculationMethod: "flat",
        flatAmount: -1.0,
        effectiveFrom: "2026-04-01T00:00:00Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects percentage rate above 1", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "bet_fee",
        calculationMethod: "percentage",
        percentageRate: 1.5,
        effectiveFrom: "2026-04-01T00:00:00Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid datetime string", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "tee_time_service",
        calculationMethod: "flat",
        flatAmount: 5.0,
        effectiveFrom: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing effectiveFrom", () => {
      const result = updateFeeScheduleSchema.safeParse({
        feeType: "tee_time_service",
        calculationMethod: "flat",
        flatAmount: 5.0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createFeeChargeSchema", () => {
    const validCharge = {
      tripId: "550e8400-e29b-41d4-a716-446655440000",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      feeType: "tee_time_service",
      sourceObjectType: "reservation",
      sourceObjectId: "550e8400-e29b-41d4-a716-446655440002",
      amount: 5.0,
    };

    it("accepts valid fee charge", () => {
      const result = createFeeChargeSchema.safeParse(validCharge);
      expect(result.success).toBe(true);
    });

    it("accepts zero amount", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        amount: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative amount", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        amount: -10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid tripId", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        tripId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid userId", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        userId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid sourceObjectId", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        sourceObjectId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty sourceObjectType", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        sourceObjectType: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects sourceObjectType over 50 chars", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        sourceObjectType: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid fee type", () => {
      const result = createFeeChargeSchema.safeParse({
        ...validCharge,
        feeType: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid fee types", () => {
      const feeTypes = [
        "tee_time_service",
        "bet_fee",
        "lodging_service",
        "air_service",
        "cancellation_penalty",
        "pass_through",
      ];
      for (const feeType of feeTypes) {
        const result = createFeeChargeSchema.safeParse({
          ...validCharge,
          feeType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects missing required fields", () => {
      const result = createFeeChargeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
