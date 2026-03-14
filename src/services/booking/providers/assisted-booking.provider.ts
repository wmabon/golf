import type {
  BookingProvider,
  AvailableSlot,
  HoldResult,
  ConfirmResult,
  CancelResult,
} from "./booking-provider.interface";
import { bookingQueue, JobNames } from "@/jobs/queues";

/**
 * Assisted booking provider for courses without direct API integration.
 *
 * In assisted mode, a concierge operator handles the actual booking.
 * This provider creates ops work items via the booking queue rather
 * than making direct API calls.
 */
export class AssistedBookingProvider implements BookingProvider {
  readonly providerName = "assisted";

  /**
   * Search is not applicable for assisted bookings.
   * Returns an empty array since availability must be checked manually.
   */
  async search(
    _courseId: string,
    _date: string,
    _timeRange: { earliest: string; latest: string }
  ): Promise<AvailableSlot[]> {
    return [];
  }

  /**
   * Creates an ops work item for the concierge team to process.
   * The "hold" in assisted mode means the request has been queued for processing.
   */
  async hold(slotId: string): Promise<HoldResult> {
    await bookingQueue.add(JobNames.ASSISTED_BOOKING_PROCESS, {
      requestId: slotId,
      action: "hold",
    });

    return {
      success: true,
      holdId: slotId,
      expiresAt: null, // No automatic expiration for assisted holds
    };
  }

  /**
   * No-op for assisted bookings.
   * Confirmation is captured by the concierge via the ops console.
   */
  async confirm(_holdId: string): Promise<ConfirmResult> {
    return {
      success: true,
      confirmationNumber: null,
      confirmedTeeTime: null,
      totalChargeCents: null,
      cancellationDeadline: null,
      cancellationPenaltyCents: null,
    };
  }

  /**
   * No-op for assisted bookings.
   * Holds don't exist in the traditional sense for assisted mode.
   */
  async release(_holdId: string): Promise<void> {
    // No-op: assisted bookings don't have provider-side holds to release
  }

  /**
   * No-op for assisted bookings.
   * Cancellation is handled by the concierge via booking-request.service.
   *
   * Per FR-36: never cancel speculatively. Cancellation of the actual
   * reservation is coordinated by the concierge operator.
   */
  async cancel(_confirmationId: string): Promise<CancelResult> {
    return {
      success: true,
      penaltyChargeCents: 0,
      refundAmountCents: 0,
    };
  }
}
