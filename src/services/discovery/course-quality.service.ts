import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  courses,
  courseComposites,
  courseReviews,
  courseRules,
  trips,
} from "@/lib/db/schema";
import { distanceMiles } from "@/lib/db/spatial-helpers";

// --- Exported constants for testability ---

export const TRIP_FIT_WEIGHTS = {
  access: 30,
  budget: 25,
  convenience: 20,
  availability: 10,
  quality: 15,
} as const;

export const ACCESS_SCORES: Record<string, number> = {
  public: 100,
  resort: 80,
  semi_private: 60,
  private: 0, // 0 by default; sponsor check elevates to 100
  unknown: 0,
};

// --- Pure scoring functions (exported for unit testing) ---

export function scoreAccessEligibility(
  accessType: string,
  hasSponsor = false
): number {
  if (accessType === "private" && hasSponsor) return 100;
  return ACCESS_SCORES[accessType] ?? 0;
}

export function scoreBudgetFit(
  coursePriceMax: number | null,
  budgetMax: number | null | undefined
): number {
  if (coursePriceMax == null || budgetMax == null) return 50; // neutral if unknown
  if (coursePriceMax <= budgetMax) return 100;
  if (coursePriceMax <= budgetMax * 1.5) return 50;
  return 0;
}

export function scoreConvenience(distanceMi: number): number {
  if (distanceMi <= 10) return 100;
  if (distanceMi <= 30) return 80;
  if (distanceMi <= 60) return 60;
  if (distanceMi <= 100) return 30;
  return 10;
}

export function scoreAvailability(publicTimesAvailable: boolean | null): number {
  return publicTimesAvailable === true ? 80 : 40;
}

export function scoreQuality(editorialScore: number | null): number {
  if (editorialScore == null) return 50; // neutral if unknown
  // editorial is 0-5; normalize to 0-100
  return Math.min(100, editorialScore * 20);
}

export function computeWeightedScore(breakdown: {
  access: number;
  budget: number;
  convenience: number;
  availability: number;
  quality: number;
}): number {
  const score =
    (breakdown.access * TRIP_FIT_WEIGHTS.access +
      breakdown.budget * TRIP_FIT_WEIGHTS.budget +
      breakdown.convenience * TRIP_FIT_WEIGHTS.convenience +
      breakdown.availability * TRIP_FIT_WEIGHTS.availability +
      breakdown.quality * TRIP_FIT_WEIGHTS.quality) /
    100;
  return Math.round(score * 10) / 10;
}

/**
 * Generate a value label based on editorial quality vs price.
 * FR-21: Label overpriced courses.
 */
export function generateValueLabel(
  editorialScore: number | null,
  priceBandMax: number | null
): { valueScore: number | null; valueLabel: string | null } {
  if (editorialScore == null || priceBandMax == null || priceBandMax === 0) {
    return { valueScore: null, valueLabel: null };
  }

  const ratio = editorialScore / (priceBandMax / 100);
  const roundedRatio = Math.round(ratio * 10) / 10;

  let valueLabel: string;
  if (ratio > 2.0) {
    valueLabel = "Excellent value";
  } else if (ratio > 1.5) {
    valueLabel = "Good value";
  } else if (ratio > 1.0) {
    valueLabel = "Fair value";
  } else if (ratio > 0.5) {
    valueLabel = "Premium price, solid quality";
  } else {
    valueLabel = "Premium price, mixed value signal";
  }

  return { valueScore: roundedRatio, valueLabel };
}

// --- Service functions ---

/**
 * Get quality breakdown for a course.
 * FR-17: Community and composite scores are ALWAYS separate, never blended.
 */
export async function getQualityBreakdown(courseId: string) {
  // Get composite scores
  const [composite] = await db
    .select()
    .from(courseComposites)
    .where(eq(courseComposites.courseId, courseId));

  // Get per-dimension community averages
  const [dimensionAverages] = await db
    .select({
      overall: sql<string | null>`ROUND(AVG(${courseReviews.overallScore}::numeric), 2)`,
      conditioning: sql<string | null>`ROUND(AVG(${courseReviews.conditioning}::numeric), 2)`,
      layout: sql<string | null>`ROUND(AVG(${courseReviews.layout}::numeric), 2)`,
      value: sql<string | null>`ROUND(AVG(${courseReviews.value}::numeric), 2)`,
      pace: sql<string | null>`ROUND(AVG(${courseReviews.pace}::numeric), 2)`,
      service: sql<string | null>`ROUND(AVG(${courseReviews.service}::numeric), 2)`,
      vibe: sql<string | null>`ROUND(AVG(${courseReviews.vibe}::numeric), 2)`,
      reviewCount: sql<number>`count(*)::int`,
    })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId));

  return {
    community: {
      overall: dimensionAverages?.overall ?? null,
      conditioning: dimensionAverages?.conditioning ?? null,
      layout: dimensionAverages?.layout ?? null,
      value: dimensionAverages?.value ?? null,
      pace: dimensionAverages?.pace ?? null,
      service: dimensionAverages?.service ?? null,
      vibe: dimensionAverages?.vibe ?? null,
      reviewCount: dimensionAverages?.reviewCount ?? 0,
    },
    composite: {
      editorialScore: composite?.editorialScore ?? null,
      externalRankScore: composite?.externalRankScore ?? null,
      valueScore: composite?.valueScore ?? null,
      valueLabel: composite?.valueLabel ?? null,
      tripFitInputs: composite?.tripFitInputs ?? null,
    },
  };
}

/**
 * Compute trip-fit score for a course relative to a specific trip.
 * FR-20: Weighted score across access, budget, convenience, availability, quality.
 */
export async function computeTripFitScore(courseId: string, tripId: string) {
  // Get the trip details
  const [trip] = await db
    .select({
      id: trips.id,
      anchorLat: trips.anchorLat,
      anchorLng: trips.anchorLng,
      budgetSettings: trips.budgetSettings,
    })
    .from(trips)
    .where(eq(trips.id, tripId));

  if (!trip) return null;

  // Get the course with distance calculation
  const anchorLat = trip.anchorLat ? Number(trip.anchorLat) : null;
  const anchorLng = trip.anchorLng ? Number(trip.anchorLng) : null;

  const courseQuery = db
    .select({
      id: courses.id,
      accessType: courses.accessType,
      priceBandMax: courses.priceBandMax,
      ...(anchorLat != null && anchorLng != null
        ? { distance: distanceMiles(courses.location, anchorLng, anchorLat) }
        : {}),
    })
    .from(courses)
    .where(eq(courses.id, courseId));

  const [course] = await courseQuery;
  if (!course) return null;

  // Get course rules for availability
  const [rules] = await db
    .select({ publicTimesAvailable: courseRules.publicTimesAvailable })
    .from(courseRules)
    .where(eq(courseRules.courseId, courseId));

  // Get composite scores for quality
  const [composite] = await db
    .select({ editorialScore: courseComposites.editorialScore })
    .from(courseComposites)
    .where(eq(courseComposites.courseId, courseId));

  // Compute each dimension
  const budgetMax = trip.budgetSettings?.perRoundMax ?? null;
  const coursePriceMax = course.priceBandMax ? Number(course.priceBandMax) : null;
  const editorialScore = composite?.editorialScore
    ? Number(composite.editorialScore)
    : null;
  const dist = "distance" in course ? Number(course.distance) : 999;

  const breakdown = {
    access: scoreAccessEligibility(course.accessType),
    budget: scoreBudgetFit(coursePriceMax, budgetMax),
    convenience: scoreConvenience(dist),
    availability: scoreAvailability(rules?.publicTimesAvailable ?? null),
    quality: scoreQuality(editorialScore),
  };

  const tripFitScore = computeWeightedScore(breakdown);

  return { tripFitScore, breakdown };
}

/**
 * Admin function to update editorial/external/value quality scores.
 * FR-22: Admin-maintainable editorial and external signals.
 */
export async function updateQualityScores(
  courseId: string,
  data: {
    editorialScore?: number;
    externalRankScore?: number;
    valueScore?: number;
    valueLabel?: string | null;
    tripFitInputs?: Record<string, number> | null;
  }
) {
  // Build the set object with only provided fields
  const setData: Record<string, unknown> = {};
  if (data.editorialScore !== undefined) {
    setData.editorialScore = String(data.editorialScore);
  }
  if (data.externalRankScore !== undefined) {
    setData.externalRankScore = String(data.externalRankScore);
  }
  if (data.valueScore !== undefined) {
    setData.valueScore = String(data.valueScore);
  }
  if (data.valueLabel !== undefined) {
    setData.valueLabel = data.valueLabel;
  }
  if (data.tripFitInputs !== undefined) {
    setData.tripFitInputs = data.tripFitInputs;
  }

  const [result] = await db
    .insert(courseComposites)
    .values({
      courseId,
      ...setData,
    })
    .onConflictDoUpdate({
      target: courseComposites.courseId,
      set: setData,
    })
    .returning();

  return result ?? null;
}
