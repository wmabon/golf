import { describe, it, expect } from "vitest";
import { filterAccessTypes } from "@/services/discovery/course-search.service";

describe("Course Search - Access Filtering Logic", () => {
  describe("filterAccessTypes", () => {
    it("excludes private and unknown by default (includePrivate=false, no accessTypes)", () => {
      const result = filterAccessTypes(false);
      expect(result).toEqual(["public", "resort", "semi_private"]);
      expect(result).not.toContain("private");
      expect(result).not.toContain("unknown");
    });

    it("includes all when includePrivate=true and no accessTypes filter", () => {
      const result = filterAccessTypes(true);
      expect(result).toBeNull(); // null means no filter — include all
    });

    it("uses specific accessTypes when provided (overrides includePrivate)", () => {
      const result = filterAccessTypes(false, ["public", "resort"]);
      expect(result).toEqual(["public", "resort"]);
    });

    it("allows filtering to just private when explicitly requested", () => {
      const result = filterAccessTypes(true, ["private"]);
      expect(result).toEqual(["private"]);
    });

    it("returns null for includePrivate=true with no filter", () => {
      const result = filterAccessTypes(true, undefined);
      expect(result).toBeNull();
    });

    it("handles empty accessTypes array as no specific filter", () => {
      const result = filterAccessTypes(false, []);
      // Empty array means no specific filter requested, fall back to default
      expect(result).toEqual(["public", "resort", "semi_private"]);
    });

    it("preserves order of requested access types", () => {
      const result = filterAccessTypes(false, [
        "resort",
        "public",
        "semi_private",
      ]);
      expect(result).toEqual(["resort", "public", "semi_private"]);
    });
  });
});
