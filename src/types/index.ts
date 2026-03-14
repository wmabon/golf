// Shared TypeScript types
// Will be populated as entities are defined

export type TripStatus =
  | "draft"
  | "planning"
  | "voting"
  | "booking"
  | "locked"
  | "in_progress"
  | "completed"
  | "archived";

export type UserStatus = "active" | "suspended" | "deactivated";

export type SystemRole = "user" | "admin" | "concierge_ops";

export type TripRole = "collaborator" | "captain";

export type InviteStatus = "pending" | "accepted" | "declined";

export type VoteValue = "in" | "fine" | "out";

export type VerifiedStatus =
  | "unverified"
  | "pending_verification"
  | "verified"
  | "rejected";

export type CourseAccessType =
  | "public"
  | "resort"
  | "semi_private"
  | "private"
  | "unknown";

export type CourseAccessConfidence = "verified" | "unverified" | "disputed";

export type CourseStatus = "draft" | "active" | "hidden" | "archived";

export type ReportType =
  | "misclassified_access"
  | "wrong_price"
  | "closed_permanently"
  | "duplicate"
  | "other";

export type ReportStatus = "open" | "reviewed" | "resolved" | "dismissed";

export type ReviewDimensions = {
  conditioning: number;
  layout: number;
  value: number;
  pace: number;
  service: number;
  vibe: number;
};

export type FeeType =
  | "tee_time_service"
  | "bet_fee"
  | "lodging_service"
  | "air_service"
  | "cancellation_penalty"
  | "pass_through";

export type FeeCalculationMethod = "flat" | "percentage";

export type FeeChargeStatus =
  | "pending"
  | "collectible"
  | "charged"
  | "refunded"
  | "waived";

export type BookingRequestStatus =
  | "candidate"
  | "window_pending"
  | "requested"
  | "partial_hold"
  | "booked"
  | "swappable"
  | "locked"
  | "played"
  | "canceled";

export type BookingMode = "direct" | "guided_checkout" | "assisted";

export type AssignedToType = "user" | "automation" | "concierge";

export type BookingSlotStatus =
  | "pending"
  | "attempting"
  | "held"
  | "confirmed"
  | "failed"
  | "released";

export type ReservationStatus =
  | "confirmed"
  | "swappable"
  | "locked"
  | "played"
  | "canceled"
  | "no_show";

export type BookingSource =
  | "direct_api"
  | "guided_checkout"
  | "assisted"
  | "external";

export type ExternalBookingType = "golf" | "lodging" | "flight" | "other";
