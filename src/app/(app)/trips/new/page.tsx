"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [golferCount, setGolferCount] = useState(4);
  const [anchorType, setAnchorType] = useState<string>("airport_code");
  const [anchorValue, setAnchorValue] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        name,
        dateStart,
        dateEnd,
        golferCount,
        anchorType,
        anchorValue,
      };

      if (budgetMin || budgetMax) {
        body.budgetSettings = {
          ...(budgetMin ? { perRoundMin: Number(budgetMin) } : {}),
          ...(budgetMax ? { perRoundMax: Number(budgetMax) } : {}),
        };
      }

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create trip");
        setLoading(false);
        return;
      }

      const { trip } = await res.json();
      router.push(`/trips/${trip.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Plan a new trip</h1>
      <p className="text-gray-500 text-sm mb-8">
        Name it, set the dates, pick the destination. The crew will handle the rest.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Trip name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Trip name
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Pinehurst 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateStart" className="block text-sm font-medium mb-1">
              Start date
            </label>
            <input
              id="dateStart"
              type="date"
              required
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label htmlFor="dateEnd" className="block text-sm font-medium mb-1">
              End date
            </label>
            <input
              id="dateEnd"
              type="date"
              required
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>

        {/* Golfer count */}
        <div>
          <label htmlFor="golferCount" className="block text-sm font-medium mb-1">
            How many golfers?
          </label>
          <select
            id="golferCount"
            value={golferCount}
            onChange={(e) => setGolferCount(Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} golfers
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label htmlFor="anchorType" className="block text-sm font-medium mb-1">
            Destination type
          </label>
          <select
            id="anchorType"
            value={anchorType}
            onChange={(e) => setAnchorType(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 mb-2"
          >
            <option value="airport_code">Airport code</option>
            <option value="city_region">City / region</option>
          </select>
          <input
            id="anchorValue"
            type="text"
            required
            placeholder={anchorType === "airport_code" ? "MCO" : "Scottsdale, AZ"}
            value={anchorValue}
            onChange={(e) => setAnchorValue(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Budget per round (optional)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Min $"
              min={0}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <input
              type="number"
              placeholder="Max $"
              min={0}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50 transition"
        >
          {loading ? "Creating trip..." : "Let's go"}
        </button>
      </form>
    </main>
  );
}
