import { describe, it, expect } from "vitest";
import {
  searchCoursesSchema,
  createReportSchema,
} from "@/lib/validation/courses";

describe("searchCoursesSchema", () => {
  it("accepts valid airport anchor", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "airport", value: "MCO" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid city anchor", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "city", value: "Scottsdale" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid coordinates anchor", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "coordinates", value: { lat: 33.45, lng: -111.95 } },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid bounds anchor", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: {
        type: "bounds",
        value: {
          sw: { lat: 33.0, lng: -112.5 },
          ne: { lat: 34.0, lng: -111.0 },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid anchor type", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "invalid", value: "test" },
    });
    expect(result.success).toBe(false);
  });

  it("applies correct defaults", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "airport", value: "MCO" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.radiusMiles).toBe(50);
      expect(result.data.sortBy).toBe("distance");
      expect(result.data.includePrivate).toBe(false);
    }
  });

  it("accepts all filter options", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "airport", value: "MCO" },
      radiusMiles: 100,
      priceBand: { min: 50, max: 200 },
      numGolfers: 4,
      accessTypes: ["public", "resort"],
      includePrivate: true,
      sortBy: "price",
      page: 2,
      pageSize: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radiusMiles).toBe(100);
      expect(result.data.priceBand?.min).toBe(50);
      expect(result.data.priceBand?.max).toBe(200);
      expect(result.data.accessTypes).toEqual(["public", "resort"]);
      expect(result.data.sortBy).toBe("price");
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it("rejects radius out of range", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "airport", value: "MCO" },
      radiusMiles: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects page size over limit", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "airport", value: "MCO" },
      pageSize: 200,
    });
    expect(result.success).toBe(false);
  });

  it("accepts tripId as valid uuid", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "airport", value: "MCO" },
      tripId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid tripId", () => {
    const result = searchCoursesSchema.safeParse({
      anchor: { type: "airport", value: "MCO" },
      tripId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("createReportSchema", () => {
  it("accepts valid report", () => {
    const result = createReportSchema.safeParse({
      reportType: "misclassified_access",
      description: "This course is actually private, not public.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all report types", () => {
    const types = [
      "misclassified_access",
      "wrong_price",
      "closed_permanently",
      "duplicate",
      "other",
    ];
    for (const reportType of types) {
      const result = createReportSchema.safeParse({
        reportType,
        description: "This is a valid description of the issue.",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects short description (< 10 chars)", () => {
    const result = createReportSchema.safeParse({
      reportType: "other",
      description: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid report type", () => {
    const result = createReportSchema.safeParse({
      reportType: "invalid_type",
      description: "This is a valid description.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(createReportSchema.safeParse({}).success).toBe(false);
    expect(
      createReportSchema.safeParse({ reportType: "other" }).success
    ).toBe(false);
    expect(
      createReportSchema.safeParse({
        description: "This is a valid description.",
      }).success
    ).toBe(false);
  });
});
