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

export type SwapApprovalState =
  | "suggested"
  | "approved"
  | "declined"
  | "auto_approved"
  | "expired";

export type ItineraryItemType =
  | "golf"
  | "lodging"
  | "flight"
  | "dining"
  | "transport"
  | "note"
  | "other";

export type ItineraryItemStatus =
  | "confirmed"
  | "pending"
  | "canceled"
  | "completed";

export type ItineraryItemSource = "platform" | "external" | "manual";

export type SwapPolicy = "notify_only" | "captain_approval" | "auto_upgrade";

export type NotificationChannel = "email" | "in_app" | "sms";

export type RoundStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "finalized"
  | "canceled";

export type GameFormat =
  | "stroke_play"
  | "best_ball"
  | "skins"
  | "nassau"
  | "custom";

export type GameStatus = "created" | "in_play" | "completed";

export type BetStatus =
  | "proposed"
  | "accepted"
  | "declined"
  | "resolved"
  | "voided"
  | "expired";

export type BetParticipantStatus = "pending" | "accepted" | "declined";

export type PublishState =
  | "private"
  | "review_pending"
  | "publish_eligible"
  | "published"
  | "withdrawn";

export type ConsentState = "pending" | "approved" | "vetoed";

export type MicrositePublishState = "draft" | "published" | "unpublished";

export type MicrositeVisibility = "unlisted" | "public";

export type ExpenseCategory =
  | "tee_time"
  | "lodging"
  | "meal"
  | "transport"
  | "other";

export type SplitMethod = "equal" | "custom" | "exclude";

export type SettlementStatus = "pending" | "confirmed";

export type TravelSource = "affiliate" | "partner" | "manual";
