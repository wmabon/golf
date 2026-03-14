import { describe, it, expect } from "vitest";
import {
  createItineraryItemSchema,
  updateItineraryItemSchema,
} from "@/lib/validation/itinerary";

describe("Itinerary Validation Schemas", () => {
  describe("createItineraryItemSchema", () => {
    const validItem = {
      itemType: "golf" as const,
      title: "Morning Round at Pinehurst No. 2",
      date: "2026-06-15",
    };

    it("accepts a valid minimal item", () => {
      const result = createItineraryItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("accepts an item with all optional fields", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        startTime: "2026-06-15T08:00:00Z",
        endTime: "2026-06-15T12:00:00Z",
        location: {
          address: "1 Carolina Vista Dr, Village of Pinehurst, NC",
          lat: 35.1954,
          lng: -79.4697,
        },
        confirmationNumber: "PH-2026-0615",
        bookingContact: "Pro Shop: 910-295-6811",
        participants: [
          "550e8400-e29b-41d4-a716-446655440000",
          "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        ],
        contactNotes: "Check in 30 minutes before tee time",
        cost: 395,
        notes: "Walking only, caddies required. Book caddies separately.",
        sortOrder: 1,
      });
      expect(result.success).toBe(true);
    });

    // -- itemType --

    it("accepts all valid item types", () => {
      for (const itemType of [
        "golf",
        "lodging",
        "flight",
        "dining",
        "transport",
        "note",
        "other",
      ]) {
        const result = createItineraryItemSchema.safeParse({
          ...validItem,
          itemType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid item type", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        itemType: "spa",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing itemType", () => {
      const { itemType, ...noType } = validItem;
      const result = createItineraryItemSchema.safeParse(noType);
      expect(result.success).toBe(false);
    });

    // -- title --

    it("rejects empty title", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects title exceeding 500 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        title: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("accepts title at exactly 500 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        title: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing title", () => {
      const { title, ...noTitle } = validItem;
      const result = createItineraryItemSchema.safeParse(noTitle);
      expect(result.success).toBe(false);
    });

    // -- date --

    it("rejects invalid date format (MM/DD/YYYY)", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        date: "06/15/2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects date with wrong separator", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        date: "2026-6-15",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing date", () => {
      const { date, ...noDate } = validItem;
      const result = createItineraryItemSchema.safeParse(noDate);
      expect(result.success).toBe(false);
    });

    // -- startTime / endTime --

    it("accepts valid ISO datetime for startTime", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        startTime: "2026-06-15T08:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid startTime format", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        startTime: "8:00 AM",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid endTime format", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        endTime: "noon",
      });
      expect(result.success).toBe(false);
    });

    // -- location --

    it("accepts location with only address", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        location: { address: "123 Golf Course Rd" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts location with only coordinates", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        location: { lat: 35.1954, lng: -79.4697 },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty location object", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        location: {},
      });
      expect(result.success).toBe(true);
    });

    // -- confirmationNumber --

    it("rejects confirmationNumber exceeding 255 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        confirmationNumber: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("accepts confirmationNumber at exactly 255 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        confirmationNumber: "a".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    // -- bookingContact --

    it("rejects bookingContact exceeding 255 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        bookingContact: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    // -- participants --

    it("accepts valid UUID array for participants", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        participants: ["550e8400-e29b-41d4-a716-446655440000"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID strings in participants array", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        participants: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty participants array", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        participants: [],
      });
      expect(result.success).toBe(true);
    });

    // -- contactNotes --

    it("rejects contactNotes exceeding 2000 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        contactNotes: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts contactNotes at exactly 2000 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        contactNotes: "a".repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    // -- cost --

    it("rejects negative cost", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        cost: -10,
      });
      expect(result.success).toBe(false);
    });

    it("accepts zero cost", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        cost: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts decimal cost", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        cost: 149.99,
      });
      expect(result.success).toBe(true);
    });

    // -- notes --

    it("rejects notes exceeding 5000 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        notes: "a".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts notes at exactly 5000 characters", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        notes: "a".repeat(5000),
      });
      expect(result.success).toBe(true);
    });

    // -- sortOrder --

    it("rejects non-integer sortOrder", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        sortOrder: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("accepts negative sortOrder (for reordering)", () => {
      const result = createItineraryItemSchema.safeParse({
        ...validItem,
        sortOrder: -1,
      });
      expect(result.success).toBe(true);
    });

    // -- empty / missing --

    it("rejects empty object", () => {
      const result = createItineraryItemSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("updateItineraryItemSchema", () => {
    it("accepts empty object (no fields to update)", () => {
      const result = updateItineraryItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts a single field update", () => {
      const result = updateItineraryItemSchema.safeParse({
        title: "Updated title",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with multiple fields", () => {
      const result = updateItineraryItemSchema.safeParse({
        title: "Afternoon Round",
        date: "2026-06-16",
        cost: 250,
      });
      expect(result.success).toBe(true);
    });

    it("still validates field constraints on partial update", () => {
      const result = updateItineraryItemSchema.safeParse({
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("still validates date format on partial update", () => {
      const result = updateItineraryItemSchema.safeParse({
        date: "06/15/2026",
      });
      expect(result.success).toBe(false);
    });

    it("still validates cost minimum on partial update", () => {
      const result = updateItineraryItemSchema.safeParse({
        cost: -5,
      });
      expect(result.success).toBe(false);
    });
  });
});
