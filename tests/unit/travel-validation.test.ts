import { describe, it, expect } from "vitest";
import {
  searchLodgingSchema,
  searchFlightsSchema,
  saveLodgingOptionSchema,
  saveFlightOptionSchema,
} from "@/lib/validation/travel";

describe("Travel Validation Schemas", () => {
  describe("searchLodgingSchema", () => {
    const validSearch = {
      checkIn: "2026-06-15",
      checkOut: "2026-06-20",
      guests: 4,
    };

    it("accepts valid search with required fields only", () => {
      const result = searchLodgingSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("accepts search with all optional fields", () => {
      const result = searchLodgingSchema.safeParse({
        ...validSearch,
        location: "Scottsdale, AZ",
        budgetMax: 500,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid checkIn date format", () => {
      const result = searchLodgingSchema.safeParse({
        ...validSearch,
        checkIn: "06/15/2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid checkOut date format", () => {
      const result = searchLodgingSchema.safeParse({
        ...validSearch,
        checkOut: "2026-6-20",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing checkIn", () => {
      const { checkIn, ...noCheckIn } = validSearch;
      const result = searchLodgingSchema.safeParse(noCheckIn);
      expect(result.success).toBe(false);
    });

    it("rejects missing checkOut", () => {
      const { checkOut, ...noCheckOut } = validSearch;
      const result = searchLodgingSchema.safeParse(noCheckOut);
      expect(result.success).toBe(false);
    });

    it("rejects guests below minimum (1)", () => {
      const result = searchLodgingSchema.safeParse({
        ...validSearch,
        guests: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer guests", () => {
      const result = searchLodgingSchema.safeParse({
        ...validSearch,
        guests: 2.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing guests", () => {
      const { guests, ...noGuests } = validSearch;
      const result = searchLodgingSchema.safeParse(noGuests);
      expect(result.success).toBe(false);
    });

    it("rejects negative budgetMax", () => {
      const result = searchLodgingSchema.safeParse({
        ...validSearch,
        budgetMax: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = searchLodgingSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("searchFlightsSchema", () => {
    const validSearch = {
      departureAirport: "ORD",
      arrivalAirport: "PHX",
      departureDate: "2026-06-15",
      passengers: 2,
    };

    it("accepts valid search with required fields", () => {
      const result = searchFlightsSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("accepts search with returnDate", () => {
      const result = searchFlightsSchema.safeParse({
        ...validSearch,
        returnDate: "2026-06-20",
      });
      expect(result.success).toBe(true);
    });

    it("defaults passengers to 1 when omitted", () => {
      const { passengers, ...noPassengers } = validSearch;
      const result = searchFlightsSchema.safeParse(noPassengers);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.passengers).toBe(1);
      }
    });

    it("rejects missing departureAirport", () => {
      const { departureAirport, ...noDep } = validSearch;
      const result = searchFlightsSchema.safeParse(noDep);
      expect(result.success).toBe(false);
    });

    it("rejects missing arrivalAirport", () => {
      const { arrivalAirport, ...noArr } = validSearch;
      const result = searchFlightsSchema.safeParse(noArr);
      expect(result.success).toBe(false);
    });

    it("rejects invalid departureDate format", () => {
      const result = searchFlightsSchema.safeParse({
        ...validSearch,
        departureDate: "06-15-2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid returnDate format", () => {
      const result = searchFlightsSchema.safeParse({
        ...validSearch,
        returnDate: "June 20",
      });
      expect(result.success).toBe(false);
    });

    it("rejects passengers below minimum (1)", () => {
      const result = searchFlightsSchema.safeParse({
        ...validSearch,
        passengers: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer passengers", () => {
      const result = searchFlightsSchema.safeParse({
        ...validSearch,
        passengers: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing departureDate", () => {
      const { departureDate, ...noDate } = validSearch;
      const result = searchFlightsSchema.safeParse(noDate);
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = searchFlightsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("saveLodgingOptionSchema", () => {
    const validOption = {
      name: "Beach House",
      checkIn: "2026-06-15",
      checkOut: "2026-06-20",
      guests: 8,
      linkUrl: "https://www.airbnb.com/rooms/12345",
    };

    it("accepts valid lodging option with required fields", () => {
      const result = saveLodgingOptionSchema.safeParse(validOption);
      expect(result.success).toBe(true);
    });

    it("accepts lodging option with all optional fields", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        location: {
          address: "123 Beach St",
          city: "Scottsdale",
          state: "AZ",
          lat: 33.4942,
          lng: -111.926,
        },
        pricePerNight: 350,
        totalPrice: 1750,
        bedrooms: 4,
        thumbnailUrl: "https://images.airbnb.com/photo.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("accepts lodging option with partial location", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        location: { city: "Scottsdale" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const { name, ...noName } = validOption;
      const result = saveLodgingOptionSchema.safeParse(noName);
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 255 characters", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        name: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid checkIn format", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        checkIn: "06/15/2026",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid checkOut format", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        checkOut: "2026-6-20",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing checkIn", () => {
      const { checkIn, ...noCheckIn } = validOption;
      const result = saveLodgingOptionSchema.safeParse(noCheckIn);
      expect(result.success).toBe(false);
    });

    it("rejects missing checkOut", () => {
      const { checkOut, ...noCheckOut } = validOption;
      const result = saveLodgingOptionSchema.safeParse(noCheckOut);
      expect(result.success).toBe(false);
    });

    it("rejects guests below minimum (1)", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        guests: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing guests", () => {
      const { guests, ...noGuests } = validOption;
      const result = saveLodgingOptionSchema.safeParse(noGuests);
      expect(result.success).toBe(false);
    });

    it("rejects invalid linkUrl", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        linkUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects linkUrl exceeding 500 characters", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        linkUrl: "https://example.com/" + "a".repeat(500),
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing linkUrl", () => {
      const { linkUrl, ...noLink } = validOption;
      const result = saveLodgingOptionSchema.safeParse(noLink);
      expect(result.success).toBe(false);
    });

    it("rejects invalid thumbnailUrl", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        thumbnailUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects thumbnailUrl exceeding 500 characters", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        thumbnailUrl: "https://example.com/" + "a".repeat(500),
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative pricePerNight", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        pricePerNight: -10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative totalPrice", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        totalPrice: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative bedrooms", () => {
      const result = saveLodgingOptionSchema.safeParse({
        ...validOption,
        bedrooms: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = saveLodgingOptionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("saveFlightOptionSchema", () => {
    const validOption = {
      departureAirport: "ORD",
      arrivalAirport: "PHX",
      departureTime: "2026-06-15T08:00:00Z",
      arrivalTime: "2026-06-15T10:30:00Z",
    };

    it("accepts valid flight option with required fields", () => {
      const result = saveFlightOptionSchema.safeParse(validOption);
      expect(result.success).toBe(true);
    });

    it("accepts flight option with all optional fields", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        airline: "United",
        price: 389.99,
        passengers: 4,
        linkUrl: "https://www.google.com/travel/flights?q=ORD-PHX",
      });
      expect(result.success).toBe(true);
    });

    it("defaults passengers to 1 when omitted", () => {
      const result = saveFlightOptionSchema.safeParse(validOption);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.passengers).toBe(1);
      }
    });

    it("rejects missing departureAirport", () => {
      const { departureAirport, ...noDep } = validOption;
      const result = saveFlightOptionSchema.safeParse(noDep);
      expect(result.success).toBe(false);
    });

    it("rejects missing arrivalAirport", () => {
      const { arrivalAirport, ...noArr } = validOption;
      const result = saveFlightOptionSchema.safeParse(noArr);
      expect(result.success).toBe(false);
    });

    it("rejects missing departureTime", () => {
      const { departureTime, ...noDepTime } = validOption;
      const result = saveFlightOptionSchema.safeParse(noDepTime);
      expect(result.success).toBe(false);
    });

    it("rejects missing arrivalTime", () => {
      const { arrivalTime, ...noArrTime } = validOption;
      const result = saveFlightOptionSchema.safeParse(noArrTime);
      expect(result.success).toBe(false);
    });

    it("rejects invalid departureTime format (not datetime)", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        departureTime: "2026-06-15",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid arrivalTime format (not datetime)", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        arrivalTime: "10:30 AM",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid linkUrl", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        linkUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects linkUrl exceeding 500 characters", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        linkUrl: "https://example.com/" + "a".repeat(500),
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative price", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        price: -50,
      });
      expect(result.success).toBe(false);
    });

    it("rejects passengers below minimum (1)", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        passengers: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer passengers", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        passengers: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects airline exceeding 100 characters", () => {
      const result = saveFlightOptionSchema.safeParse({
        ...validOption,
        airline: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = saveFlightOptionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
