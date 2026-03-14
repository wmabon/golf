import { describe, it, expect } from "vitest";
import {
  declineSwapSchema,
  updateSwapPolicySchema,
  updateFreezeDateSchema,
} from "@/lib/validation/optimization";

describe("Optimization Validation Schemas", () => {
  describe("declineSwapSchema", () => {
    it("accepts empty object (reason is optional)", () => {
      const result = declineSwapSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts valid reason string", () => {
      const result = declineSwapSchema.safeParse({
        reason: "I prefer the current course",
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined reason", () => {
      const result = declineSwapSchema.safeParse({ reason: undefined });
      expect(result.success).toBe(true);
    });

    it("rejects reason longer than 1000 characters", () => {
      const result = declineSwapSchema.safeParse({
        reason: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts reason at exactly 1000 characters", () => {
      const result = declineSwapSchema.safeParse({
        reason: "a".repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-string reason", () => {
      const result = declineSwapSchema.safeParse({ reason: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe("updateSwapPolicySchema", () => {
    it("accepts 'notify_only'", () => {
      const result = updateSwapPolicySchema.safeParse({
        policy: "notify_only",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'captain_approval'", () => {
      const result = updateSwapPolicySchema.safeParse({
        policy: "captain_approval",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'auto_upgrade'", () => {
      const result = updateSwapPolicySchema.safeParse({
        policy: "auto_upgrade",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid policy value", () => {
      const result = updateSwapPolicySchema.safeParse({
        policy: "invalid_policy",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing policy", () => {
      const result = updateSwapPolicySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects numeric policy", () => {
      const result = updateSwapPolicySchema.safeParse({ policy: 1 });
      expect(result.success).toBe(false);
    });

    it("rejects null policy", () => {
      const result = updateSwapPolicySchema.safeParse({ policy: null });
      expect(result.success).toBe(false);
    });
  });

  describe("updateFreezeDateSchema", () => {
    it("accepts valid YYYY-MM-DD date", () => {
      const result = updateFreezeDateSchema.safeParse({
        freezeDate: "2026-06-15",
      });
      expect(result.success).toBe(true);
    });

    it("accepts date at year boundary", () => {
      const result = updateFreezeDateSchema.safeParse({
        freezeDate: "2026-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format (MM-DD-YYYY)", () => {
      const result = updateFreezeDateSchema.safeParse({
        freezeDate: "06-15-2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects ISO datetime format", () => {
      const result = updateFreezeDateSchema.safeParse({
        freezeDate: "2026-06-15T00:00:00Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-string date", () => {
      const result = updateFreezeDateSchema.safeParse({
        freezeDate: 20260615,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing freezeDate", () => {
      const result = updateFreezeDateSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty string", () => {
      const result = updateFreezeDateSchema.safeParse({ freezeDate: "" });
      expect(result.success).toBe(false);
    });

    it("rejects date with single-digit month/day", () => {
      const result = updateFreezeDateSchema.safeParse({
        freezeDate: "2026-6-5",
      });
      expect(result.success).toBe(false);
    });
  });
});
