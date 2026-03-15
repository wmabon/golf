"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  courseId: string;
  currentAccess: {
    accessType: string;
    accessConfidence: string;
  };
  currentRules: {
    bookingWindowDays: number | null;
    cancellationDeadlineHours: number | null;
    maxPlayers: number | null;
    bookingChannel: string | null;
    rulesConfirmed: boolean;
    publicTimesAvailable: boolean | null;
    bookingWindowRule: string | null;
    cancellationRule: string | null;
  } | null;
}

export function CourseEditor({
  courseId,
  currentAccess,
  currentRules,
}: Props) {
  const router = useRouter();

  // Access classification state
  const [accessType, setAccessType] = useState(currentAccess.accessType);
  const [accessConfidence, setAccessConfidence] = useState(
    currentAccess.accessConfidence
  );
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessMessage, setAccessMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Booking rules state
  const [bookingWindowDays, setBookingWindowDays] = useState(
    currentRules?.bookingWindowDays?.toString() ?? ""
  );
  const [cancellationDeadlineHours, setCancellationDeadlineHours] = useState(
    currentRules?.cancellationDeadlineHours?.toString() ?? ""
  );
  const [maxPlayers, setMaxPlayers] = useState(
    currentRules?.maxPlayers?.toString() ?? ""
  );
  const [bookingChannel, setBookingChannel] = useState(
    currentRules?.bookingChannel ?? ""
  );
  const [rulesConfirmed, setRulesConfirmed] = useState(
    currentRules?.rulesConfirmed ?? false
  );
  const [publicTimesAvailable, setPublicTimesAvailable] = useState(
    currentRules?.publicTimesAvailable ?? false
  );
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesMessage, setRulesMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Access classification save
  const handleAccessSave = async () => {
    setAccessLoading(true);
    setAccessMessage(null);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/access-classification`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessType, accessConfidence }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update access classification");
      }
      setAccessMessage({
        type: "success",
        text: "Access classification updated.",
      });
      router.refresh();
    } catch (err) {
      setAccessMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setAccessLoading(false);
    }
  };

  // Booking rules save
  const handleRulesSave = async () => {
    setRulesLoading(true);
    setRulesMessage(null);
    try {
      const body: Record<string, unknown> = {
        rulesConfirmed,
        publicTimesAvailable,
      };
      if (bookingWindowDays)
        body.bookingWindowDays = parseInt(bookingWindowDays, 10);
      if (cancellationDeadlineHours)
        body.cancellationDeadlineHours = parseInt(
          cancellationDeadlineHours,
          10
        );
      if (maxPlayers) body.maxPlayers = parseInt(maxPlayers, 10);
      if (bookingChannel) body.bookingChannel = bookingChannel;

      const res = await fetch(
        `/api/admin/courses/${courseId}/booking-rules`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update booking rules");
      }
      setRulesMessage({ type: "success", text: "Booking rules updated." });
      router.refresh();
    } catch (err) {
      setRulesMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setRulesLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Access Classification Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-sm text-slate-900 mb-4">
          Access Classification
        </h2>

        {accessMessage && (
          <div
            className={`rounded border px-3 py-2 text-sm mb-3 ${
              accessMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {accessMessage.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Access Type
            </label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="public">Public</option>
              <option value="resort">Resort</option>
              <option value="semi_private">Semi-Private</option>
              <option value="private">Private</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confidence
            </label>
            <select
              value={accessConfidence}
              onChange={(e) => setAccessConfidence(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleAccessSave}
          disabled={accessLoading}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
        >
          Save Access Classification
        </button>
      </div>

      {/* Booking Rules Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-sm text-slate-900 mb-4">
          Booking Rules
        </h2>

        {rulesMessage && (
          <div
            className={`rounded border px-3 py-2 text-sm mb-3 ${
              rulesMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {rulesMessage.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Booking Window (days)
            </label>
            <input
              type="number"
              value={bookingWindowDays}
              onChange={(e) => setBookingWindowDays(e.target.value)}
              placeholder="e.g. 14"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cancellation Deadline (hours)
            </label>
            <input
              type="number"
              value={cancellationDeadlineHours}
              onChange={(e) =>
                setCancellationDeadlineHours(e.target.value)
              }
              placeholder="e.g. 24"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Players per Slot
            </label>
            <input
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              placeholder="e.g. 4"
              min="1"
              max="8"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Booking Channel
            </label>
            <input
              type="text"
              value={bookingChannel}
              onChange={(e) => setBookingChannel(e.target.value)}
              placeholder="e.g. phone, website, golfnow"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={rulesConfirmed}
              onChange={(e) => setRulesConfirmed(e.target.checked)}
              className="rounded accent-slate-700"
            />
            <span className="text-slate-700">Rules Confirmed</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={publicTimesAvailable}
              onChange={(e) => setPublicTimesAvailable(e.target.checked)}
              className="rounded accent-slate-700"
            />
            <span className="text-slate-700">Public Times Available</span>
          </label>
        </div>

        <button
          onClick={handleRulesSave}
          disabled={rulesLoading}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
        >
          Save Booking Rules
        </button>
      </div>
    </div>
  );
}
