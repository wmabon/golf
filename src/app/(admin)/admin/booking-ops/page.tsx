import Link from "next/link";
import * as bookingOpsService from "@/services/admin/booking-ops.service";

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
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function BookingOpsPage() {
  const [pendingRequests, escalated] = await Promise.all([
    bookingOpsService.listPendingRequests(),
    bookingOpsService.listEscalated(),
  ]);

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Booking Ops</h1>
        <p className="text-sm text-slate-500">
          Pending booking requests sorted by booking window proximity.
        </p>
      </div>

      {/* Escalation banner */}
      {escalated.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">
          <span className="font-bold">{escalated.length}</span>{" "}
          {escalated.length === 1 ? "request" : "requests"} unassigned for 4+
          hours.
        </div>
      )}

      {/* Data table */}
      {pendingRequests.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No pending booking requests.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Trip
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Course
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Golfers
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Assigned
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => {
                const badge =
                  STATUS_BADGES[req.status] ?? STATUS_BADGES.candidate;
                return (
                  <tr
                    key={req.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/booking-ops/${req.id}`}
                        className="text-slate-900 font-medium hover:underline"
                      >
                        {req.tripName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {req.courseName}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(req.targetDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {req.numGolfers}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {req.assignedTo ? (
                        <span className="text-xs text-slate-600">
                          {req.assignedTo.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDateTime(req.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
