import { describe, it, expect } from "vitest";
import {
  uploadPhotoSchema,
  tagPhotoSchema,
  consentSchema,
  updateMicrositeSchema,
  visibilitySchema,
} from "@/lib/validation/media";

describe("Media Validation Schemas", () => {
  describe("uploadPhotoSchema", () => {
    it("accepts empty object (caption is optional)", () => {
      const result = uploadPhotoSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts valid caption", () => {
      const result = uploadPhotoSchema.safeParse({
        caption: "Hole 18 sunset",
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined caption", () => {
      const result = uploadPhotoSchema.safeParse({ caption: undefined });
      expect(result.success).toBe(true);
    });

    it("rejects caption over 500 chars", () => {
      const result = uploadPhotoSchema.safeParse({
        caption: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("accepts caption at exactly 500 chars", () => {
      const result = uploadPhotoSchema.safeParse({
        caption: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("tagPhotoSchema", () => {
    it("accepts valid single UUID", () => {
      const result = tagPhotoSchema.safeParse({
        userIds: ["550e8400-e29b-41d4-a716-446655440000"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts multiple valid UUIDs", () => {
      const result = tagPhotoSchema.safeParse({
        userIds: [
          "550e8400-e29b-41d4-a716-446655440000",
          "550e8400-e29b-41d4-a716-446655440001",
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty array", () => {
      const result = tagPhotoSchema.safeParse({ userIds: [] });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID in array", () => {
      const result = tagPhotoSchema.safeParse({
        userIds: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing userIds", () => {
      const result = tagPhotoSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects non-array userIds", () => {
      const result = tagPhotoSchema.safeParse({
        userIds: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("consentSchema", () => {
    it("accepts 'approved'", () => {
      const result = consentSchema.safeParse({ decision: "approved" });
      expect(result.success).toBe(true);
    });

    it("accepts 'vetoed'", () => {
      const result = consentSchema.safeParse({ decision: "vetoed" });
      expect(result.success).toBe(true);
    });

    it("rejects 'pending'", () => {
      const result = consentSchema.safeParse({ decision: "pending" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid decision", () => {
      const result = consentSchema.safeParse({ decision: "maybe" });
      expect(result.success).toBe(false);
    });

    it("rejects missing decision", () => {
      const result = consentSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty string", () => {
      const result = consentSchema.safeParse({ decision: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateMicrositeSchema", () => {
    it("accepts empty object (all fields optional)", () => {
      const result = updateMicrositeSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts selectedAssetIds only", () => {
      const result = updateMicrositeSchema.safeParse({
        selectedAssetIds: ["550e8400-e29b-41d4-a716-446655440000"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts content only", () => {
      const result = updateMicrositeSchema.safeParse({
        content: { title: "Our Trip", highlights: ["Best putt ever"] },
      });
      expect(result.success).toBe(true);
    });

    it("accepts both selectedAssetIds and content", () => {
      const result = updateMicrositeSchema.safeParse({
        selectedAssetIds: ["550e8400-e29b-41d4-a716-446655440000"],
        content: { title: "Our Trip" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty selectedAssetIds array", () => {
      const result = updateMicrositeSchema.safeParse({
        selectedAssetIds: [],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID in selectedAssetIds", () => {
      const result = updateMicrositeSchema.safeParse({
        selectedAssetIds: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-array selectedAssetIds", () => {
      const result = updateMicrositeSchema.safeParse({
        selectedAssetIds: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("visibilitySchema", () => {
    it("accepts 'unlisted'", () => {
      const result = visibilitySchema.safeParse({ mode: "unlisted" });
      expect(result.success).toBe(true);
    });

    it("accepts 'public'", () => {
      const result = visibilitySchema.safeParse({ mode: "public" });
      expect(result.success).toBe(true);
    });

    it("rejects 'private'", () => {
      const result = visibilitySchema.safeParse({ mode: "private" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid mode", () => {
      const result = visibilitySchema.safeParse({ mode: "hidden" });
      expect(result.success).toBe(false);
    });

    it("rejects missing mode", () => {
      const result = visibilitySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty string", () => {
      const result = visibilitySchema.safeParse({ mode: "" });
      expect(result.success).toBe(false);
    });
  });
});
