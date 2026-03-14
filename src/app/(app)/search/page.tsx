"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type AccessType = "public" | "resort" | "semi_private" | "private";

interface CourseResult {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  accessType: string;
  accessConfidence: string;
  distanceMiles: number;
  priceBandMin: string | null;
  priceBandMax: string | null;
  reasonsToPlay: string | null;
  editorialScore: string | null;
  communityAverageScore: string | null;
  reviewCount: number | null;
  valueLabel: string | null;
}

interface SearchResults {
  courses: CourseResult[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const ACCESS_BADGES: Record<string, { label: string; className: string }> = {
  public: { label: "Public", className: "bg-green-100 text-green-800" },
  resort: { label: "Resort", className: "bg-emerald-100 text-emerald-800" },
  semi_private: { label: "Semi-Private", className: "bg-amber-100 text-amber-800" },
  private: { label: "Private", className: "bg-red-100 text-red-800" },
  unknown: { label: "Unknown", className: "bg-gray-100 text-gray-800" },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(50);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [accessTypes, setAccessTypes] = useState<AccessType[]>([]);
  const [sortBy, setSortBy] = useState<"distance" | "price" | "quality">("distance");

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleAccessType = useCallback((type: AccessType) => {
    setAccessTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const handleSearch = useCallback(async (page = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const trimmed = query.trim();
      let anchor: Record<string, unknown>;

      if (/^[A-Za-z]{3}$/i.test(trimmed)) {
        anchor = { type: "airport", value: trimmed.toUpperCase() };
      } else {
        anchor = { type: "city", value: trimmed };
      }

      const body: Record<string, unknown> = {
        anchor,
        radiusMiles,
        sortBy,
        page,
        pageSize: 20,
      };

      if (accessTypes.length > 0) {
        body.accessTypes = accessTypes;
      }

      if (priceMin || priceMax) {
        const priceBand: Record<string, number> = {};
        if (priceMin) priceBand.min = Number(priceMin);
        if (priceMax) priceBand.max = Number(priceMax);
        body.priceBand = priceBand;
      }

      const res = await fetch("/api/search/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Search failed");
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, radiusMiles, priceMin, priceMax, accessTypes, sortBy]);

  const formatPrice = (min: string | null, max: string | null) => {
    if (!min && !max) return "Price TBD";
    if (min === max) return `$${Number(min).toFixed(0)}`;
    return `$${Number(min).toFixed(0)}\u2013$${Number(max).toFixed(0)}`;
  };

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Where are we playing?</h1>
        <p className="text-gray-500 text-sm">
          Drop an airport code or city. We&apos;ll find what&apos;s worth your time.
        </p>
      </div>

      {/* Search input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Try MCO, Scottsdale, or Myrtle Beach"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50 transition"
        >
          {loading ? "Hunting..." : "Find courses"}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
        {/* Radius slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How far will you drive? <span className="text-green-700 font-bold">{radiusMiles} mi</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            className="w-full accent-green-700"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>10 mi</span>
            <span>200 mi</span>
          </div>
        </div>

        {/* Price range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget per round
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min $"
              className="w-1/2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
            />
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max $"
              className="w-1/2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Sort by */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Show me the best by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
          >
            <option value="distance">Closest first</option>
            <option value="price">Cheapest first</option>
            <option value="quality">Highest rated</option>
          </select>
        </div>

        {/* Access type checkboxes */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Show me
          </label>
          <div className="flex flex-wrap gap-3">
            {(["public", "resort", "semi_private", "private"] as const).map(
              (type) => (
                <label key={type} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessTypes.includes(type)}
                    onChange={() => toggleAccessType(type)}
                    className="rounded accent-green-700"
                  />
                  {ACCESS_BADGES[type].label}
                </label>
              )
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Pre-search empty state */}
      {!hasSearched && !results && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-12 text-center">
          <p className="text-xl font-bold text-green-900 mb-2">
            97 courses loaded and waiting.
          </p>
          <p className="text-green-700 text-sm">
            Type an airport code or city name above to see what&apos;s in range.
            We&apos;ll filter out anything you can&apos;t actually play.
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {results.totalCount === 0
              ? "Nothing matched."
              : `${results.totalCount} course${results.totalCount !== 1 ? "s" : ""} in range.`}
          </p>

          {results.courses.length === 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-8 text-center">
              <p className="text-lg font-bold text-amber-900 mb-2">
                Swing and a miss.
              </p>
              <p className="text-amber-700 text-sm">
                Try a wider radius, loosen the budget, or search a different area.
                The perfect course is out there.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.courses.map((course) => {
                const badge = ACCESS_BADGES[course.accessType] ?? ACCESS_BADGES.unknown;
                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="block rounded-xl border border-gray-200 p-5 hover:border-green-400 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{course.name}</h3>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">
                          {[course.city, course.state].filter(Boolean).join(", ")}
                          {course.distanceMiles != null && (
                            <span className="ml-2 text-gray-400">
                              &middot; {course.distanceMiles} mi
                            </span>
                          )}
                        </p>

                        {course.reasonsToPlay && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {course.reasonsToPlay}
                          </p>
                        )}
                      </div>

                      <div className="text-right ml-4 shrink-0">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(course.priceBandMin, course.priceBandMax)}
                        </p>

                        {/* Composite quality score (editorial) — separate from community per FR-17 */}
                        {course.editorialScore && (
                          <p className="text-xs text-gray-500 mt-1">
                            Editor: {Number(course.editorialScore).toFixed(1)}/5
                          </p>
                        )}

                        {/* Community score — always separate per FR-17 */}
                        {course.communityAverageScore && (
                          <p className="text-xs text-gray-500">
                            Golfers: {Number(course.communityAverageScore).toFixed(1)}/5
                            {course.reviewCount ? ` (${course.reviewCount})` : ""}
                          </p>
                        )}

                        {course.valueLabel && (
                          <span className="inline-block mt-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {course.valueLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {results.totalCount > results.pageSize && (
            <div className="flex justify-center gap-3 mt-8">
              <button
                onClick={() => handleSearch(results.page - 1)}
                disabled={results.page <= 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-500">
                Page {results.page} of {Math.ceil(results.totalCount / results.pageSize)}
              </span>
              <button
                onClick={() => handleSearch(results.page + 1)}
                disabled={results.page * results.pageSize >= results.totalCount}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
