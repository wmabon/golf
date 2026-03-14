import { describe, it, expect } from "vitest";
import {
  createBookingRequestSchema,
  captureExternalBookingSchema,
} from "@/lib/validation/booking";

describe("Booking Validation Schemas", () => {
  describe("createBookingRequestSchema", () => {
    const validRequest = {
      courseId: "550e8400-e29b-41d4-a716-446655440000",
      targetDate: "2026-06-15",
      targetTimeRange: { earliest: "08:00", latest: "10:00" },
      numGolfers: 4,
    };

    it("accepts a valid booking request", () => {
      const result = createBookingRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("accepts request with all optional fields", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        preferredTime: "09:00",
        notes: "We want back-to-back tee times",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid courseId (not UUID)", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        courseId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing courseId", () => {
      const { courseId, ...noId } = validRequest;
      const result = createBookingRequestSchema.safeParse(noId);
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        targetDate: "06/15/2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects date with wrong separator", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        targetDate: "2026-6-15",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing targetDate", () => {
      const { targetDate, ...noDate } = validRequest;
      const result = createBookingRequestSchema.safeParse(noDate);
      expect(result.success).toBe(false);
    });

    it("rejects missing targetTimeRange", () => {
      const { targetTimeRange, ...noRange } = validRequest;
      const result = createBookingRequestSchema.safeParse(noRange);
      expect(result.success).toBe(false);
    });

    it("rejects numGolfers below minimum (2)", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        numGolfers: 1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects numGolfers above maximum (8)", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        numGolfers: 9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer numGolfers", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        numGolfers: 3.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing numGolfers", () => {
      const { numGolfers, ...noGolfers } = validRequest;
      const result = createBookingRequestSchema.safeParse(noGolfers);
      expect(result.success).toBe(false);
    });

    it("accepts numGolfers at minimum boundary (2)", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        numGolfers: 2,
      });
      expect(result.success).toBe(true);
    });

    it("accepts numGolfers at maximum boundary (8)", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        numGolfers: 8,
      });
      expect(result.success).toBe(true);
    });

    it("rejects notes exceeding 2000 characters", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        notes: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts notes at exactly 2000 characters", () => {
      const result = createBookingRequestSchema.safeParse({
        ...validRequest,
        notes: "a".repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty object", () => {
      const result = createBookingRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("captureExternalBookingSchema", () => {
    const validCapture = {
      type: "golf" as const,
      date: "2026-06-15",
    };

    it("accepts valid minimal capture", () => {
      const result = captureExternalBookingSchema.safeParse(validCapture);
      expect(result.success).toBe(true);
    });

    it("accepts capture with all optional fields", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        source: "GolfNow",
        confirmationNumber: "GN-12345",
        time: "09:00",
        cost: 149.99,
        bookingContact: "Pro Shop: 555-0123",
        notes: "Cart included, prepaid",
        linkUrl: "https://golfnow.com/booking/12345",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid types", () => {
      for (const type of ["golf", "lodging", "flight", "other"]) {
        const result = captureExternalBookingSchema.safeParse({
          ...validCapture,
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid type", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        type: "rental_car",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing type", () => {
      const { type, ...noType } = validCapture;
      const result = captureExternalBookingSchema.safeParse(noType);
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        date: "06/15/2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing date", () => {
      const { date, ...noDate } = validCapture;
      const result = captureExternalBookingSchema.safeParse(noDate);
      expect(result.success).toBe(false);
    });

    it("rejects negative cost", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        cost: -10,
      });
      expect(result.success).toBe(false);
    });

    it("accepts zero cost", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        cost: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        linkUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects URL exceeding 500 characters", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        linkUrl: "https://example.com/" + "a".repeat(500),
      });
      expect(result.success).toBe(false);
    });

    it("rejects source exceeding 255 characters", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        source: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("rejects notes exceeding 2000 characters", () => {
      const result = captureExternalBookingSchema.safeParse({
        ...validCapture,
        notes: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = captureExternalBookingSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
