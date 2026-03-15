"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SlotInfo {
  id: string;
  groupNum: number;
  status: string;
  targetTime: string | null;
}

interface Props {
  requestId: string;
  currentUserId: string;
  currentStatus: string;
  assignedTo: string | null;
  canConfirm: boolean;
  slots: SlotInfo[];
}

export function BookingRequestActions({
  requestId,
  currentUserId,
  currentStatus,
  assignedTo,
  canConfirm,
  slots,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    action: string;
    onConfirm: () => void;
  } | null>(null);

  // Confirmation slot data
  const [slotConfirmations, setSlotConfirmations] = useState<
    Record<
      string,
      { confirmationNumber: string; confirmedTeeTime: string; costPerPlayer: string }
    >
  >(
    Object.fromEntries(
      slots
        .filter((s) => s.status !== "confirmed")
        .map((s) => [
          s.id,
          { confirmationNumber: "", confirmedTeeTime: "", costPerPlayer: "" },
        ])
    )
  );

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    if (type === "success") {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Assign to self
  const handleAssign = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/booking-requests/${requestId}/assign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedTo: currentUserId }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign");
      }
      showMessage("success", "Request assigned to you.");
      router.refresh();
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Assignment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/booking-requests/${requestId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: noteText.trim() }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add note");
      }
      showMessage("success", "Note added.");
      setNoteText("");
      router.refresh();
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Failed to add note"
      );
    } finally {
      setLoading(false);
    }
  };

  // Status update
  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    setMessage(null);
    setConfirmDialog(null);
    try {
      const res = await fetch(
        `/api/admin/booking-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      showMessage("success", `Status updated to ${newStatus}.`);
      router.refresh();
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Status update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Attach confirmation
  const handleConfirmBooking = async () => {
    setLoading(true);
    setMessage(null);
    setConfirmDialog(null);

    const slotsPayload = Object.entries(slotConfirmations)
      .filter(
        ([, data]) => data.confirmationNumber && data.confirmedTeeTime
      )
      .map(([slotId, data]) => ({
        slotId,
        confirmationNumber: data.confirmationNumber,
        confirmedTeeTime: new Date(data.confirmedTeeTime).toISOString(),
        costPerPlayer: data.costPerPlayer
          ? Number(data.costPerPlayer)
          : undefined,
      }));

    if (slotsPayload.length === 0) {
      showMessage("error", "Fill in at least one slot with confirmation number and tee time.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/booking-requests/${requestId}/confirmation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots: slotsPayload }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to attach confirmation");
      }
      showMessage("success", "Booking confirmed.");
      setShowConfirmForm(false);
      router.refresh();
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Confirmation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const unconfirmedSlots = slots.filter((s) => s.status !== "confirmed");

  return (
    <div className="space-y-4">
      {/* Message banner */}
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900 mb-3">
            Are you sure you want to {confirmDialog.action}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmDialog.onConfirm}
              disabled={loading}
              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDialog(null)}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assign */}
      {!assignedTo && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-sm text-slate-900 mb-2">Assignment</h3>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
          >
            Assign to Me
          </button>
        </div>
      )}

      {/* Add note */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-sm text-slate-900 mb-2">Add Note</h3>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Enter note..."
          rows={3}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 mb-2"
        />
        <button
          onClick={handleAddNote}
          disabled={loading || !noteText.trim()}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
        >
          Add Note
        </button>
      </div>

      {/* Confirm Booking */}
      {canConfirm && unconfirmedSlots.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-sm text-slate-900 mb-2">
            Attach Confirmation
          </h3>

          {!showConfirmForm ? (
            <button
              onClick={() => setShowConfirmForm(true)}
              className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition"
            >
              Enter Confirmation Details
            </button>
          ) : (
            <div className="space-y-4">
              {unconfirmedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="border border-slate-200 rounded p-3 space-y-2"
                >
                  <p className="text-xs text-slate-600 font-medium">
                    Group {slot.groupNum}
                    {slot.targetTime ? ` (target: ${slot.targetTime})` : ""}
                  </p>
                  <input
                    type="text"
                    placeholder="Confirmation number"
                    value={slotConfirmations[slot.id]?.confirmationNumber ?? ""}
                    onChange={(e) =>
                      setSlotConfirmations((prev) => ({
                        ...prev,
                        [slot.id]: {
                          ...prev[slot.id],
                          confirmationNumber: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <input
                    type="datetime-local"
                    value={slotConfirmations[slot.id]?.confirmedTeeTime ?? ""}
                    onChange={(e) =>
                      setSlotConfirmations((prev) => ({
                        ...prev,
                        [slot.id]: {
                          ...prev[slot.id],
                          confirmedTeeTime: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <input
                    type="number"
                    placeholder="Cost per player ($)"
                    value={slotConfirmations[slot.id]?.costPerPlayer ?? ""}
                    onChange={(e) =>
                      setSlotConfirmations((prev) => ({
                        ...prev,
                        [slot.id]: {
                          ...prev[slot.id],
                          costPerPlayer: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setConfirmDialog({
                      action: "confirm this booking",
                      onConfirm: handleConfirmBooking,
                    })
                  }
                  disabled={loading}
                  className="flex-1 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => setShowConfirmForm(false)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status actions */}
      {currentStatus !== "booked" &&
        currentStatus !== "canceled" &&
        currentStatus !== "played" && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="font-bold text-sm text-slate-900 mb-2">
              Update Status
            </h3>
            <div className="space-y-2">
              {currentStatus !== "canceled" && (
                <button
                  onClick={() =>
                    setConfirmDialog({
                      action: "cancel this booking request",
                      onConfirm: () => handleStatusUpdate("canceled"),
                    })
                  }
                  disabled={loading}
                  className="w-full rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition"
                >
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
