import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import * as bookingOpsService from "@/services/admin/booking-ops.service";
import { BookingRequestActions } from "./actions";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  candidate: { label: "Candidate", className: "bg-slate-100 text-slate-700" },
  window_pending: {
    label: "Window Pending",
    className: "bg-slate-100 text-slate-700",
  },
  requested: { label: "Requested", className: "bg-blue-100 text-blue-800" },
  partial_hold: {
    label: "Partial Hold",
    className: "bg-amber-100 text-amber-800",
  },
  booked: { label: "Booked", className: "bg-emerald-100 text-emerald-800" },
  canceled: { label: "Canceled", className: "bg-red-100 text-red-800" },
  swappable: {
    label: "Swappable",
    className: "bg-purple-100 text-purple-800",
  },
  locked: { label: "Locked", className: "bg-slate-200 text-slate-800" },
  played: { label: "Played", className: "bg-slate-200 text-slate-700" },
};

const SLOT_STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-slate-100 text-slate-700" },
  attempting: {
    label: "Attempting",
    className: "bg-amber-100 text-amber-800",
  },
  held: { label: "Held", className: "bg-blue-100 text-blue-800" },
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-800",
  },
  failed: { label: "Failed", className: "bg-red-100 text-red-800" },
  released: { label: "Released", className: "bg-slate-200 text-slate-700" },
};

function formatDate(date: Date | string | null) {
  if (!date) return "--";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "--";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseNotes(notes: string | null): Array<{
  timestamp: string;
  author: string;
  text: string;
}> {
  if (!notes) return [];
  return notes
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      // Format: [ISO_TIMESTAMP] (author) text  OR  [ISO_TIMESTAMP] text
      const match = line.match(
        /^\[(.+?)\]\s*(?:\((.+?)\)\s*)?(.*)$/
      );
      if (match) {
        return {
          timestamp: match[1],
          author: match[2] || "system",
          text: match[3],
        };
      }
      return { timestamp: "", author: "", text: line };
    });
}

export default async function BookingRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const session = await auth();
  const { requestId } = await params;
  const detail = await bookingOpsService.getRequestDetail(requestId);

  if (!detail) notFound();

  const badge = STATUS_BADGES[detail.status] ?? STATUS_BADGES.candidate;
  const notes = parseNotes(detail.notes);
  const canConfirm =
    detail.status === "requested" || detail.status === "partial_hold";

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/admin/booking-ops" className="hover:text-slate-700">
          Booking Ops
        </Link>
        <span>/</span>
        <span className="text-slate-700">{detail.tripName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {detail.tripName}
          </h1>
          <p className="text-sm text-slate-500">
            {detail.courseName} &middot;{" "}
            {[detail.courseCity, detail.courseState]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          {detail.assignedTo ? (
            <span className="text-xs text-slate-500">
              Assigned: {detail.assignedTo.slice(0, 8)}...
            </span>
          ) : (
            <span className="text-xs text-red-500 font-medium">
              Unassigned
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Context card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-sm text-slate-900 mb-3">
              Trip Context
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Trip Dates</span>
                <p className="text-slate-900">
                  {formatDate(detail.tripDateStart)} &mdash;{" "}
                  {formatDate(detail.tripDateEnd)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Target Date</span>
                <p className="text-slate-900">
                  {formatDate(detail.targetDate)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Golfers</span>
                <p className="text-slate-900">{detail.numGolfers}</p>
              </div>
              <div>
                <span className="text-slate-500">Mode</span>
                <p className="text-slate-900">{detail.mode}</p>
              </div>
              <div>
                <span className="text-slate-500">Preferred Time</span>
                <p className="text-slate-900">
                  {detail.preferredTime || "--"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Time Range</span>
                <p className="text-slate-900">
                  {detail.targetTimeRange
                    ? `${(detail.targetTimeRange as { earliest: string; latest: string }).earliest} - ${(detail.targetTimeRange as { earliest: string; latest: string }).latest}`
                    : "--"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Booking Window Opens</span>
                <p className="text-slate-900">
                  {formatDateTime(detail.bookingWindowOpensAt)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Access Type</span>
                <p className="text-slate-900">{detail.courseAccessType}</p>
              </div>
            </div>
          </div>

          {/* Party Split */}
          {detail.partySplit && (detail.partySplit as number[]).length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-sm text-slate-900 mb-3">
                Party Split
              </h2>
              <div className="flex gap-3">
                {(detail.partySplit as number[]).map(
                  (count: number, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center"
                    >
                      <p className="text-lg font-bold text-slate-900">
                        {count}
                      </p>
                      <p className="text-xs text-slate-500">
                        Group {idx + 1}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Slots table */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-sm text-slate-900 mb-3">
              Booking Slots
            </h2>
            {detail.slots.length === 0 ? (
              <p className="text-sm text-slate-500">
                No booking slots created yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Group
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Status
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Target Time
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Confirmation
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Tee Time
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Players
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.slots.map((slot) => {
                      const slotBadge =
                        SLOT_STATUS_BADGES[slot.status] ??
                        SLOT_STATUS_BADGES.pending;
                      return (
                        <tr
                          key={slot.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-2 text-slate-900">
                            {slot.groupNum}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${slotBadge.className}`}
                            >
                              {slotBadge.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {slot.targetTime || "--"}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {slot.confirmationNumber || "--"}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {formatDateTime(slot.confirmedTeeTime)}
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-xs">
                            {(slot.playerIds as string[] | null)?.length ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes Timeline */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-sm text-slate-900 mb-3">
              Notes Timeline
            </h2>
            {notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-slate-200 pl-3 py-1"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {note.timestamp && (
                        <span>
                          {formatDateTime(note.timestamp)}
                        </span>
                      )}
                      {note.author && note.author !== "system" && (
                        <span className="text-slate-600 font-medium">
                          {note.author.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 mt-0.5">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — actions */}
        <div>
          <BookingRequestActions
            requestId={requestId}
            currentUserId={session!.user!.id!}
            currentStatus={detail.status}
            assignedTo={detail.assignedTo}
            canConfirm={canConfirm}
            slots={detail.slots.map((s) => ({
              id: s.id,
              groupNum: s.groupNum,
              status: s.status,
              targetTime: s.targetTime,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
