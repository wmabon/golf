import { describe, it, expect } from "vitest";
import {
  createTripSchema,
  sendInvitesSchema,
  transitionStateSchema,
} from "@/lib/validation/trips";

describe("createTripSchema", () => {
  it("accepts valid trip input", () => {
    const result = createTripSchema.safeParse({
      name: "Pinehurst 2026",
      dateStart: "2026-06-15",
      dateEnd: "2026-06-18",
      golferCount: 6,
      anchorType: "airport_code",
      anchorValue: "RDU",
    });
    expect(result.success).toBe(true);
  });

  it("defaults golferCount to 4", () => {
    const result = createTripSchema.safeParse({
      name: "Quick Trip",
      dateStart: "2026-07-01",
      dateEnd: "2026-07-02",
      anchorType: "city_region",
      anchorValue: "Scottsdale, AZ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.golferCount).toBe(4);
    }
  });

  it("rejects golferCount outside 2-8 range", () => {
    const result = createTripSchema.safeParse({
      name: "Big Group",
      dateStart: "2026-07-01",
      dateEnd: "2026-07-02",
      golferCount: 12,
      anchorType: "airport_code",
      anchorValue: "MCO",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = createTripSchema.safeParse({
      name: "Bad Date",
      dateStart: "June 15",
      dateEnd: "2026-06-18",
      anchorType: "airport_code",
      anchorValue: "RDU",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid anchor type", () => {
    const result = createTripSchema.safeParse({
      name: "Trip",
      dateStart: "2026-07-01",
      dateEnd: "2026-07-02",
      anchorType: "coordinates",
      anchorValue: "test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional budget settings", () => {
    const result = createTripSchema.safeParse({
      name: "Budget Trip",
      dateStart: "2026-07-01",
      dateEnd: "2026-07-02",
      anchorType: "airport_code",
      anchorValue: "MCO",
      budgetSettings: { perRoundMin: 50, perRoundMax: 150 },
    });
    expect(result.success).toBe(true);
  });
});

describe("sendInvitesSchema", () => {
  it("accepts valid emails", () => {
    const result = sendInvitesSchema.safeParse({
      emails: ["john@example.com", "jane@example.com"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = sendInvitesSchema.safeParse({ emails: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const result = sendInvitesSchema.safeParse({
      emails: ["not-an-email"],
    });
    expect(result.success).toBe(false);
  });
});

describe("transitionStateSchema", () => {
  it("accepts valid status", () => {
    const result = transitionStateSchema.safeParse({ status: "planning" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = transitionStateSchema.safeParse({ status: "flying" });
    expect(result.success).toBe(false);
  });
});
