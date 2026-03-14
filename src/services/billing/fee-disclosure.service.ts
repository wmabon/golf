import { eq, desc, isNull, lte, or, gt, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { feeSchedules, feeCharges, type FeeSchedule } from "@/lib/db/schema";
import type { FeeType } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeeLineItem {
  label: string;
  amount: number;
}

export interface FeeEstimate {
  serviceFee: number;
  passThrough: number;
  total: number;
  lineItems: FeeLineItem[];
  noSchedule?: boolean;
}

// ---------------------------------------------------------------------------
// Pure computation (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Compute the fee amount from schedule parameters.
 * This is a pure function with no DB dependency.
 *
 * @param calculationMethod  "flat" or "percentage"
 * @param baseCost           The base cost the fee is applied against
 * @param flatAmount         Flat fee amount (used when method is "flat")
 * @param percentageRate     Percentage rate stored as a whole number (e.g. 5.0 = 5%).
 *                           Divided by 100 internally to calculate the fee.
 * @param perGolferCap       Optional per-golfer cap on the fee
 * @param numGolfers         Number of golfers (used with perGolferCap)
 */
export function computeFee(
  calculationMethod: "flat" | "percentage",
  baseCost: number,
  flatAmount: number | null,
  percentageRate: number | null,
  perGolferCap: number | null,
  numGolfers?: number
): number {
  let fee: number;

  if (calculationMethod === "flat") {
    fee = flatAmount ?? 0;
  } else {
    // percentageRate is stored as whole-number percentage (e.g. 5.0 = 5%)
    fee = baseCost * ((percentageRate ?? 0) / 100);
  }

  // Apply per-golfer cap if both cap and golfer count are provided
  if (perGolferCap != null && numGolfers != null) {
    const maxFee = perGolferCap * numGolfers;
    fee = Math.min(fee, maxFee);
  }

  // Round to two decimal places to avoid floating point drift
  return Math.round(fee * 100) / 100;
}

// ---------------------------------------------------------------------------
// Schedule lookup helper
// ---------------------------------------------------------------------------

/**
 * Find the currently-active fee schedule for a given fee type.
 * Returns the most recently effective schedule where:
 *   effective_from <= NOW() AND (effective_to IS NULL OR effective_to > NOW())
 */
async function findActiveSchedule(
  feeType: FeeType
): Promise<FeeSchedule | null> {
  const now = new Date();

  const [schedule] = await db
    .select()
    .from(feeSchedules)
    .where(
      and(
        eq(feeSchedules.feeType, feeType),
        lte(feeSchedules.effectiveFrom, now),
        or(isNull(feeSchedules.effectiveTo), gt(feeSchedules.effectiveTo, now))
      )
    )
    .orderBy(desc(feeSchedules.effectiveFrom))
    .limit(1);

  return schedule ?? null;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Calculate a fee estimate for a given fee type and base cost.
 * Looks up the active fee schedule and computes the fee.
 */
export async function calculateFeeEstimate(
  type: FeeType,
  baseCost: number,
  numGolfers?: number
): Promise<FeeEstimate> {
  const schedule = await findActiveSchedule(type);

  if (!schedule) {
    return {
      serviceFee: 0,
      passThrough: 0,
      total: 0,
      lineItems: [],
      noSchedule: true,
    };
  }

  const fee = computeFee(
    schedule.calculationMethod,
    baseCost,
    schedule.flatAmount ? Number(schedule.flatAmount) : null,
    schedule.percentageRate ? Number(schedule.percentageRate) : null,
    schedule.perGolferCap ? Number(schedule.perGolferCap) : null,
    numGolfers
  );

  return {
    serviceFee: fee,
    passThrough: 0,
    total: fee,
    lineItems: [{ label: "Service fee", amount: fee }],
  };
}

/**
 * Create a fee charge record for a booking/reservation.
 * Calculates the fee from the active schedule and inserts a pending charge.
 */
export async function createFeeChargeForBooking(
  tripId: string,
  userId: string,
  reservationId: string,
  totalCost: number
) {
  const estimate = await calculateFeeEstimate("tee_time_service", totalCost);
  const schedule = await findActiveSchedule("tee_time_service");

  const [charge] = await db
    .insert(feeCharges)
    .values({
      tripId,
      userId,
      feeType: "tee_time_service",
      sourceObjectType: "reservation",
      sourceObjectId: reservationId,
      feeScheduleId: schedule?.id ?? null,
      amount: String(estimate.serviceFee),
      status: "pending",
      disclosedAt: new Date(),
    })
    .returning();

  return charge;
}

/**
 * List all fee charges for a trip, ordered by creation date descending.
 */
export async function listTripFees(tripId: string) {
  return db
    .select()
    .from(feeCharges)
    .where(eq(feeCharges.tripId, tripId))
    .orderBy(desc(feeCharges.createdAt));
}
