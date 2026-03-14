/**
 * Booking provider interface for tee-time aggregator/course integrations.
 *
 * Implementations may be:
 * - Direct API integrations (GolfNow, TeeOff, etc.)
 * - Guided checkout (open booking page with pre-filled params)
 * - Assisted (concierge ops books manually)
 *
 * The concurrent cart-hold pattern (PRD Section 11.3) is a future extension.
 * Until the aggregator API spike is completed, only assisted and guided
 * checkout modes should be used in production.
 */

export interface AvailableSlot {
  /** Provider-specific slot identifier */
  slotId: string;
  /** Course identifier in our system */
  courseId: string;
  /** Tee time in ISO 8601 format */
  teeTime: string;
  /** Maximum players for this slot */
  maxPlayers: number;
  /** Available spots remaining */
  availableSpots: number;
  /** Price per player in USD cents */
  pricePerPlayerCents: number;
  /** Whether cart is included */
  cartIncluded: boolean;
  /** Whether a hold can be placed on this slot */
  holdable: boolean;
  /** Provider-specific metadata */
  metadata?: Record<string, unknown>;
}

export interface HoldResult {
  /** Whether the hold was successful */
  success: boolean;
  /** Provider-assigned hold identifier */
  holdId: string | null;
  /** When the hold expires (ISO 8601) */
  expiresAt: string | null;
  /** Error message if hold failed */
  error?: string;
  /** HTTP-like status code from provider */
  statusCode?: number;
}

export interface ConfirmResult {
  /** Whether confirmation was successful */
  success: boolean;
  /** Provider-assigned confirmation number */
  confirmationNumber: string | null;
  /** Confirmed tee time (ISO 8601, may differ from requested) */
  confirmedTeeTime: string | null;
  /** Total charge in USD cents */
  totalChargeCents: number | null;
  /** Cancellation deadline (ISO 8601) */
  cancellationDeadline: string | null;
  /** Cancellation penalty in USD cents */
  cancellationPenaltyCents: number | null;
  /** Error message if confirmation failed */
  error?: string;
}

export interface CancelResult {
  /** Whether cancellation was successful */
  success: boolean;
  /** Penalty charged in USD cents (0 if free cancellation) */
  penaltyChargeCents: number;
  /** Refund amount in USD cents */
  refundAmountCents: number;
  /** Error message if cancellation failed */
  error?: string;
}

export interface BookingProvider {
  /** Human-readable provider name for display and logging */
  readonly providerName: string;

  /**
   * Search for available tee times at a course.
   *
   * @param courseId - Internal course identifier
   * @param date - Target date in "YYYY-MM-DD" format
   * @param timeRange - Acceptable time window
   * @returns Available slots within the time range
   */
  search(
    courseId: string,
    date: string,
    timeRange: { earliest: string; latest: string }
  ): Promise<AvailableSlot[]>;

  /**
   * Place a temporary hold on a tee-time slot.
   * Hold duration varies by provider (typically 5-10 minutes).
   *
   * @param slotId - Provider-specific slot identifier from search results
   * @returns Hold result with expiration time
   */
  hold(slotId: string): Promise<HoldResult>;

  /**
   * Confirm a held slot, completing the booking.
   *
   * @param holdId - Hold identifier from a successful hold call
   * @returns Confirmation details including confirmation number
   */
  confirm(holdId: string): Promise<ConfirmResult>;

  /**
   * Release a hold without booking.
   * Should be called when a concurrent hold strategy needs to release
   * unsuccessful holds, or when the user abandons the booking flow.
   *
   * @param holdId - Hold identifier to release
   */
  release(holdId: string): Promise<void>;

  /**
   * Cancel a confirmed reservation.
   * Subject to the course's cancellation policy.
   *
   * IMPORTANT: Per FR-36, never cancel speculatively. Only call this
   * after a replacement reservation has been confirmed.
   *
   * @param confirmationId - Confirmation number from a successful booking
   * @returns Cancellation result with any penalties applied
   */
  cancel(confirmationId: string): Promise<CancelResult>;
}
