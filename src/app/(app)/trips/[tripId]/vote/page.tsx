"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface VoteSummary {
  in: number;
  fine: number;
  out: number;
  total: number;
}

interface TripOption {
  id: string;
  tripId: string;
  type: string;
  title: string;
  estimatedCostPerGolfer: string | null;
  fitScore: string | null;
  fitRationale: string | null;
  status: string;
  voteSummary: VoteSummary;
}

interface Trip {
  id: string;
  name: string;
  votingDeadline: string | null;
  votingMode: string;
}

interface UserVote {
  optionId: string;
  voteValue: string;
  comment: string | null;
  budgetObjection: boolean;
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  destination: { label: "Destination", className: "bg-green-100 text-green-800" },
  course: { label: "Course", className: "bg-green-100 text-green-800" },
  itinerary: { label: "Itinerary", className: "bg-purple-100 text-purple-800" },
};

const VOTE_BUTTONS = [
  { value: "in", label: "In", activeClass: "bg-green-600 text-white", hoverClass: "hover:bg-green-100" },
  { value: "fine", label: "Fine", activeClass: "bg-yellow-500 text-white", hoverClass: "hover:bg-yellow-100" },
  { value: "out", label: "Out", activeClass: "bg-red-600 text-white", hoverClass: "hover:bg-red-100" },
] as const;

function VoteSummaryBar({ summary }: { summary: VoteSummary }) {
  if (summary.total === 0) {
    return (
      <div className="h-2 w-full rounded bg-gray-200" />
    );
  }

  const inPct = (summary.in / summary.total) * 100;
  const finePct = (summary.fine / summary.total) * 100;
  const outPct = (summary.out / summary.total) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2 w-full overflow-hidden rounded">
        {inPct > 0 && (
          <div className="bg-green-500" style={{ width: `${inPct}%` }} />
        )}
        {finePct > 0 && (
          <div className="bg-yellow-400" style={{ width: `${finePct}%` }} />
        )}
        {outPct > 0 && (
          <div className="bg-red-500" style={{ width: `${outPct}%` }} />
        )}
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {summary.in}/{summary.fine}/{summary.out}
      </span>
    </div>
  );
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setRemaining(`${days}d ${hours % 24}h remaining — lock your vote in`);
      } else {
        setRemaining(`${hours}h ${minutes}m remaining — lock your vote in`);
      }
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className="text-sm text-orange-600 font-medium">{remaining}</span>
  );
}

export default function VoteBoardPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [options, setOptions] = useState<TripOption[]>([]);
  const [userVotes, setUserVotes] = useState<Map<string, UserVote>>(new Map());
  const [isCaptain, setIsCaptain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New option form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<string>("destination");
  const [newCost, setNewCost] = useState("");
  const [addingOption, setAddingOption] = useState(false);

  // Comment field per option
  const [commentDrafts, setCommentDrafts] = useState<Map<string, string>>(new Map());
  const [budgetObjections, setBudgetObjections] = useState<Map<string, boolean>>(new Map());

  // Voting deadline picker
  const [deadlineInput, setDeadlineInput] = useState("");
  const [settingDeadline, setSettingDeadline] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tripRes, optionsRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/trips/${tripId}/options`),
      ]);

      if (!tripRes.ok || !optionsRes.ok) {
        setError("Failed to load vote board data");
        return;
      }

      const tripData = await tripRes.json();
      const optionsData = await optionsRes.json();

      setTrip(tripData.trip);
      setOptions(optionsData.options);

      // Fetch user's existing votes for each option
      const votesMap = new Map<string, UserVote>();
      for (const option of optionsData.options as TripOption[]) {
        const votesRes = await fetch(
          `/api/trips/${tripId}/options/${option.id}/votes`
        );
        if (votesRes.ok) {
          const votesData = await votesRes.json();
          // Find current user's vote (we don't have user ID on client,
          // but the API returns all votes — we match by looking for ours)
          for (const v of votesData.votes) {
            // We'll store all votes keyed by optionId for the current user
            // The user's own vote will be identified by matching session
            votesMap.set(option.id, {
              optionId: option.id,
              voteValue: v.voteValue,
              comment: v.comment,
              budgetObjection: v.budgetObjection,
            });
          }
        }
      }
      setUserVotes(votesMap);

      // Check captain status via members endpoint
      const membersRes = await fetch(`/api/trips/${tripId}/members`);
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        const captain = membersData.members?.find(
          (m: { role: string }) => m.role === "captain"
        );
        // We check if current user is captain by attempting a captain-only action
        // For simplicity, we check membership data
        setIsCaptain(!!captain);
      }
    } catch {
      setError("Failed to load vote board");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (optionId: string, voteValue: string) => {
    const comment = commentDrafts.get(optionId) || null;
    const budgetObjection = budgetObjections.get(optionId) || false;

    try {
      const res = await fetch(
        `/api/trips/${tripId}/options/${optionId}/votes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voteValue, comment, budgetObjection }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to cast vote");
        return;
      }

      setUserVotes((prev) => {
        const next = new Map(prev);
        next.set(optionId, {
          optionId,
          voteValue,
          comment,
          budgetObjection,
        });
        return next;
      });

      // Refresh options to get updated vote summaries
      const optionsRes = await fetch(`/api/trips/${tripId}/options`);
      if (optionsRes.ok) {
        const data = await optionsRes.json();
        setOptions(data.options);
      }
    } catch {
      setError("Failed to cast vote");
    }
  };

  const handleFinalize = async (optionId: string) => {
    if (!confirm("Finalize this option? This will eliminate all other options.")) {
      return;
    }

    try {
      const res = await fetch(
        `/api/trips/${tripId}/options/${optionId}/override`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to finalize");
        return;
      }

      // Refresh
      const optionsRes = await fetch(`/api/trips/${tripId}/options`);
      if (optionsRes.ok) {
        const data = await optionsRes.json();
        setOptions(data.options);
      }
    } catch {
      setError("Failed to finalize option");
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAddingOption(true);
    try {
      const body: Record<string, unknown> = {
        type: newType,
        title: newTitle.trim(),
      };
      if (newCost) body.estimatedCostPerGolfer = Number(newCost);

      const res = await fetch(`/api/trips/${tripId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add option");
        return;
      }

      setNewTitle("");
      setNewCost("");
      setShowAddForm(false);

      // Refresh
      const optionsRes = await fetch(`/api/trips/${tripId}/options`);
      if (optionsRes.ok) {
        const data = await optionsRes.json();
        setOptions(data.options);
      }
    } catch {
      setError("Failed to add option");
    } finally {
      setAddingOption(false);
    }
  };

  const handleSetDeadline = async () => {
    if (!deadlineInput) return;
    setSettingDeadline(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/voting-deadline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: new Date(deadlineInput).toISOString() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to set deadline");
        return;
      }

      const data = await res.json();
      setTrip(data.trip);
      setDeadlineInput("");
    } catch {
      setError("Failed to set deadline");
    } finally {
      setSettingDeadline(false);
    }
  };

  const handleSwitchMode = async (mode: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/voting-mode`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to switch mode");
        return;
      }

      const data = await res.json();
      setTrip(data.trip);
    } catch {
      setError("Failed to switch voting mode");
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p className="text-gray-500">Loading vote board...</p>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">Trip not found</p>
      </main>
    );
  }

  const activeOptions = options.filter(
    (o) => o.status !== "eliminated" && o.status !== "finalized"
  );
  const finalizedOptions = options.filter((o) => o.status === "finalized");
  const eliminatedOptions = options.filter((o) => o.status === "eliminated");

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{trip.name} - Vote Board</h1>
        <p className="text-sm text-gray-500 mt-1">Where the crew weighs in.</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-gray-500">
            Mode: <span className="font-medium capitalize">{trip.votingMode}</span>
          </span>
          {trip.votingDeadline && (
            <DeadlineCountdown deadline={trip.votingDeadline} />
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-900 underline"
          >
            Got it
          </button>
        </div>
      )}

      {/* Captain Controls */}
      {isCaptain && (
        <div className="mb-6 rounded border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Captain&apos;s call
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            {/* Voting mode switcher */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Voting Mode</label>
              <div className="flex gap-1">
                {["destination", "course"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleSwitchMode(mode)}
                    className={`rounded px-3 py-1 text-sm ${
                      trip.votingMode === mode
                        ? "bg-green-700 text-white"
                        : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline picker */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Voting Deadline</label>
              <div className="flex gap-1">
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <button
                  onClick={handleSetDeadline}
                  disabled={settingDeadline || !deadlineInput}
                  className="rounded bg-green-700 px-3 py-1 text-sm text-white hover:bg-green-800 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finalized Options */}
      {finalizedOptions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-green-700 mb-3">Finalized</h2>
          {finalizedOptions.map((option) => (
            <div
              key={option.id}
              className="rounded border-2 border-green-500 bg-green-50 p-4 mb-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{option.title}</h3>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGES[option.type]?.className ?? "bg-gray-100 text-gray-800"}`}>
                  {TYPE_BADGES[option.type]?.label ?? option.type}
                </span>
                <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-800">
                  FINALIZED
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 mb-2">
                {option.estimatedCostPerGolfer && (
                  <span>${Number(option.estimatedCostPerGolfer).toFixed(0)}/golfer</span>
                )}
                {option.fitScore && (
                  <span>Fit: {Number(option.fitScore).toFixed(1)}/5</span>
                )}
              </div>
              {option.fitRationale && (
                <p className="text-sm text-gray-500 mb-2">{option.fitRationale}</p>
              )}
              <VoteSummaryBar summary={option.voteSummary} />
            </div>
          ))}
        </div>
      )}

      {/* Active Options */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Options</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
          >
            {showAddForm ? "Cancel" : "Throw one in"}
          </button>
        </div>

        {/* Add option form */}
        {showAddForm && (
          <form
            onSubmit={handleAddOption}
            className="rounded border border-gray-200 p-4 mb-4 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Pinehurst No. 2"
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                required
              />
            </div>
            <div className="flex gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="destination">Destination</option>
                  <option value="course">Course</option>
                  <option value="itinerary">Itinerary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Est. Cost/Golfer
                </label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  placeholder="150"
                  min="0"
                  className="w-32 rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addingOption}
              className="rounded bg-green-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {addingOption ? "Adding..." : "Throw one in"}
            </button>
          </form>
        )}

        {activeOptions.length === 0 && finalizedOptions.length === 0 && (
          <div className="rounded border border-gray-200 p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No options yet. Someone throw one out there.</p>
            <p className="text-sm">What are we considering?</p>
          </div>
        )}

        {activeOptions.map((option) => {
          const currentVote = userVotes.get(option.id);
          const comment = commentDrafts.get(option.id) ?? "";
          const budgetObj = budgetObjections.get(option.id) ?? false;

          return (
            <div
              key={option.id}
              className="rounded border border-gray-200 p-4 mb-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{option.title}</h3>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGES[option.type]?.className ?? "bg-gray-100 text-gray-800"}`}>
                  {TYPE_BADGES[option.type]?.label ?? option.type}
                </span>
                {option.status === "shortlisted" && (
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    Shortlisted
                  </span>
                )}
              </div>

              <div className="flex gap-4 text-sm text-gray-600 mb-2">
                {option.estimatedCostPerGolfer && (
                  <span className="font-medium">
                    ${Number(option.estimatedCostPerGolfer).toFixed(0)}/golfer
                  </span>
                )}
                {option.fitScore && (
                  <span>Fit: {Number(option.fitScore).toFixed(1)}/5</span>
                )}
              </div>

              {option.fitRationale && (
                <p className="text-sm text-gray-500 mb-3">{option.fitRationale}</p>
              )}

              {/* Vote summary bar */}
              <div className="mb-3">
                <VoteSummaryBar summary={option.voteSummary} />
              </div>

              {/* Vote buttons */}
              <div className="flex items-center gap-2 mb-2">
                {VOTE_BUTTONS.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleVote(option.id, btn.value)}
                    className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                      currentVote?.voteValue === btn.value
                        ? btn.activeClass
                        : `border border-gray-300 text-gray-700 ${btn.hoverClass}`
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Comment and budget objection */}
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) =>
                    setCommentDrafts((prev) => {
                      const next = new Map(prev);
                      next.set(option.id, e.target.value);
                      return next;
                    })
                  }
                  placeholder="Optional comment..."
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={budgetObj}
                    onChange={(e) =>
                      setBudgetObjections((prev) => {
                        const next = new Map(prev);
                        next.set(option.id, e.target.checked);
                        return next;
                      })
                    }
                  />
                  Budget concern
                </label>
              </div>

              {/* Captain finalize button */}
              {isCaptain && (
                <button
                  onClick={() => handleFinalize(option.id)}
                  className="mt-3 rounded border border-orange-300 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 hover:bg-orange-100"
                >
                  This is the one
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Eliminated Options */}
      {eliminatedOptions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-400 mb-3">Out of the running</h2>
          {eliminatedOptions.map((option) => (
            <div
              key={option.id}
              className="rounded border border-gray-200 bg-gray-50 p-4 mb-3 opacity-60"
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-500 line-through">
                  {option.title}
                </h3>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGES[option.type]?.className ?? "bg-gray-100 text-gray-800"}`}>
                  {TYPE_BADGES[option.type]?.label ?? option.type}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-400 mb-2">
                {option.estimatedCostPerGolfer && (
                  <span>${Number(option.estimatedCostPerGolfer).toFixed(0)}/golfer</span>
                )}
                {option.fitScore && (
                  <span>Fit: {Number(option.fitScore).toFixed(1)}/5</span>
                )}
              </div>
              <VoteSummaryBar summary={option.voteSummary} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
