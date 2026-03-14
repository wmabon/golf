import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

/** Booking-related jobs: window alerts, escalation, hold orchestration */
export const bookingQueue = new Queue("booking", { connection });

/** Billing-related jobs: fee capture, audit logging */
export const billingQueue = new Queue("billing", { connection });

/** Notification dispatch: email, SMS, in-app */
export const notificationQueue = new Queue("notification", { connection });

/** Job names for type-safe dispatching */
export const JobNames = {
  // Booking
  BOOKING_WINDOW_ALERT: "booking-window-alert",
  BOOKING_ESCALATION: "booking-escalation",
  CART_HOLD_ORCHESTRATE: "cart-hold-orchestrate",
  ASSISTED_BOOKING_PROCESS: "assisted-booking-process",
  BOOKING_CONFIRMATION_CAPTURE: "booking-confirmation-capture",
  CANCELLATION_DEADLINE_MONITOR: "cancellation-deadline-monitor",

  // Billing
  FEE_CAPTURE_THRESHOLD: "fee-capture-threshold",
  BILLING_AUDIT_LOG: "billing-audit-log",

  // Notification
  DISPATCH_NOTIFICATION: "dispatch-notification",
} as const;
