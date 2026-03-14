import { Worker } from "bullmq";
import { eq, and, lt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookingRequests } from "@/lib/db/schema";
import { JobNames } from "./queues";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// ---------------------------------------------------------------------------
// Job handlers
// ---------------------------------------------------------------------------

/**
 * BOOKING_ESCALATION — Find booking requests that have been in "requested"
 * status with no assignee for more than 4 hours and flag them for escalation.
 */
async function handleBookingEscalation(): Promise<number> {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  const staleRequests = await db
    .select({ id: bookingRequests.id, tripId: bookingRequests.tripId })
    .from(bookingRequests)
    .where(
      and(
        isNull(bookingRequests.assignedTo),
        eq(bookingRequests.status, "requested"),
        lt(bookingRequests.createdAt, fourHoursAgo)
      )
    );

  for (const request of staleRequests) {
    console.warn(
      `[booking] ESCALATION: Booking request ${request.id} (trip ${request.tripId}) ` +
        `unassigned for >4 hours`
    );
    // Future: update escalation_state field, dispatch notification to ops
  }

  console.log(
    `[booking] Escalation check complete: ${staleRequests.length} requests flagged`
  );
  return staleRequests.length;
}

/**
 * BOOKING_CONFIRMATION_CAPTURE — Post-confirmation side effects.
 * The heavy lifting happens in booking-ops.service.attachConfirmation;
 * this job handles async follow-up tasks (notifications, audit, etc.).
 */
async function handleConfirmationCapture(data: {
  requestId: string;
  conciergeId: string;
  slots: unknown[];
}): Promise<void> {
  console.log(
    `[booking] Confirmation capture for request ${data.requestId} ` +
      `by concierge ${data.conciergeId}, ${data.slots.length} slot(s)`
  );
  // Future: dispatch notification to trip members, write audit log entry
}

/** Booking queue worker */
const bookingWorker = new Worker(
  "booking",
  async (job) => {
    switch (job.name) {
      case JobNames.BOOKING_WINDOW_ALERT:
        console.log(`[booking] Processing window alert: ${job.id}`);
        // TODO: Implement in Phase 4
        break;
      case JobNames.BOOKING_ESCALATION:
        console.log(`[booking] Processing escalation: ${job.id}`);
        await handleBookingEscalation();
        break;
      case JobNames.CART_HOLD_ORCHESTRATE:
        console.log(`[booking] Processing cart hold: ${job.id}`);
        // TODO: Implement in Phase 5 (feature-flagged)
        break;
      case JobNames.ASSISTED_BOOKING_PROCESS:
        console.log(`[booking] Processing assisted booking: ${job.id}`);
        // TODO: Implement in Phase 2
        break;
      case JobNames.BOOKING_CONFIRMATION_CAPTURE:
        console.log(`[booking] Processing confirmation capture: ${job.id}`);
        await handleConfirmationCapture(job.data);
        break;
      case JobNames.CANCELLATION_DEADLINE_MONITOR:
        console.log(`[booking] Processing cancellation monitor: ${job.id}`);
        // TODO: Implement in Phase 4
        break;
      default:
        console.warn(`[booking] Unknown job: ${job.name}`);
    }
  },
  { connection }
);

/** Billing queue worker */
const billingWorker = new Worker(
  "billing",
  async (job) => {
    switch (job.name) {
      case JobNames.FEE_CAPTURE_THRESHOLD:
        console.log(`[billing] Processing fee capture: ${job.id}`);
        // TODO: Implement in Phase 3
        break;
      case JobNames.BILLING_AUDIT_LOG:
        console.log(`[billing] Processing audit log: ${job.id}`);
        // TODO: Implement in Phase 3
        break;
      default:
        console.warn(`[billing] Unknown job: ${job.name}`);
    }
  },
  { connection }
);

/** Notification queue worker */
const notificationWorker = new Worker(
  "notification",
  async (job) => {
    switch (job.name) {
      case JobNames.DISPATCH_NOTIFICATION:
        console.log(`[notification] Dispatching: ${job.id}`);
        // TODO: Implement in Phase 4
        break;
      default:
        console.warn(`[notification] Unknown job: ${job.name}`);
    }
  },
  { connection }
);

console.log("Workers started: booking, billing, notification");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await bookingWorker.close();
  await billingWorker.close();
  await notificationWorker.close();
  process.exit(0);
});
