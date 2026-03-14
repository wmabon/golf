import { describe, it, expect } from "vitest";
import {
  MILES_TO_METERS,
  withinRadius,
  distanceMiles,
  extractLat,
  extractLng,
  withinBounds,
} from "@/lib/db/spatial-helpers";

describe("Spatial Helpers", () => {
  describe("MILES_TO_METERS", () => {
    it("equals 1609.344", () => {
      expect(MILES_TO_METERS).toBe(1609.344);
    });
  });

  // Use a dummy column-like object for smoke testing.
  // These functions return SQL template objects; we just verify they return something.
  // In a real DB test we'd verify the generated SQL, but here we check return type.

  // We need to create a mock column to pass to the helpers.
  // The functions accept a Column type from drizzle-orm.
  // For unit testing, we just need to verify they return SQL objects (not throw).

  describe("withinRadius", () => {
    it("returns an object (SQL template)", () => {
      // We cannot easily mock a drizzle Column, so we pass a minimal object.
      // The function uses sql tagged template which wraps the column.
      // This smoke test verifies the function exists and is callable.
      const result = withinRadius({} as never, -81.3, 28.4, 50);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("distanceMiles", () => {
    it("returns an object (SQL template)", () => {
      const result = distanceMiles({} as never, -81.3, 28.4);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("extractLat", () => {
    it("returns an object (SQL template)", () => {
      const result = extractLat({} as never);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("extractLng", () => {
    it("returns an object (SQL template)", () => {
      const result = extractLng({} as never);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("withinBounds", () => {
    it("returns an object (SQL template)", () => {
      const result = withinBounds(
        {} as never,
        { lng: -82.0, lat: 27.0 },
        { lng: -80.0, lat: 29.0 }
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });
});
