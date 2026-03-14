import { z } from "zod/v4";

export const searchLodgingSchema = z.object({
  location: z.string().max(255).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  guests: z.number().int().min(1),
  budgetMax: z.number().min(0).optional(),
});

export const searchFlightsSchema = z.object({
  departureAirport: z.string().min(2).max(10),
  arrivalAirport: z.string().min(2).max(10),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional(),
  passengers: z.number().int().min(1).default(1),
});

export const saveLodgingOptionSchema = z.object({
  name: z.string().min(1).max(255),
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  guests: z.number().int().min(1),
  pricePerNight: z.number().min(0).optional(),
  totalPrice: z.number().min(0).optional(),
  bedrooms: z.number().int().min(0).optional(),
  linkUrl: z.string().url().max(500),
  thumbnailUrl: z.string().url().max(500).optional(),
});

export const saveFlightOptionSchema = z.object({
  airline: z.string().max(100).optional(),
  departureAirport: z.string().min(2).max(10),
  arrivalAirport: z.string().min(2).max(10),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  price: z.number().min(0).optional(),
  passengers: z.number().int().min(1).default(1),
  linkUrl: z.string().url().max(500).optional(),
});

export type SearchLodgingInput = z.infer<typeof searchLodgingSchema>;
export type SearchFlightsInput = z.infer<typeof searchFlightsSchema>;
export type SaveLodgingOptionInput = z.infer<typeof saveLodgingOptionSchema>;
export type SaveFlightOptionInput = z.infer<typeof saveFlightOptionSchema>;
