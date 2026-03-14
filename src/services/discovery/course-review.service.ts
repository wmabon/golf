import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseReviews, courseComposites } from "@/lib/db/schema";
import type { CreateReviewInput, UpdateReviewInput } from "@/lib/validation/reviews";

const DIMENSION_KEYS = [
  "conditioning",
  "layout",
  "value",
  "pace",
  "service",
  "vibe",
] as const;

function computeOverallScore(dimensions: {
  conditioning: number;
  layout: number;
  value: number;
  pace: number;
  service: number;
  vibe: number;
}): string {
  const sum =
    dimensions.conditioning +
    dimensions.layout +
    dimensions.value +
    dimensions.pace +
    dimensions.service +
    dimensions.vibe;
  return (Math.round((sum / 6) * 10) / 10).toFixed(1);
}

export async function createReview(
  courseId: string,
  userId: string,
  data: CreateReviewInput
) {
  const overallScore = computeOverallScore(data);

  const [review] = await db
    .insert(courseReviews)
    .values({
      courseId,
      userId,
      conditioning: data.conditioning,
      layout: data.layout,
      value: data.value,
      pace: data.pace,
      service: data.service,
      vibe: data.vibe,
      overallScore,
      text: data.text ?? null,
      roundId: data.roundId ?? null,
    })
    .returning();

  await refreshCommunityScore(courseId);

  return review;
}

export async function updateReview(
  reviewId: string,
  userId: string,
  data: UpdateReviewInput
) {
  // Verify ownership
  const existing = await getReview(reviewId);
  if (!existing || existing.userId !== userId) return null;

  // Merge partial update with existing dimensions
  const merged = {
    conditioning: data.conditioning ?? existing.conditioning,
    layout: data.layout ?? existing.layout,
    value: data.value ?? existing.value,
    pace: data.pace ?? existing.pace,
    service: data.service ?? existing.service,
    vibe: data.vibe ?? existing.vibe,
  };

  // Recompute overall if any dimension changed
  const hasDimensionChange = DIMENSION_KEYS.some(
    (key) => data[key] !== undefined
  );
  const updateData: Record<string, unknown> = { ...data };
  if (hasDimensionChange) {
    updateData.overallScore = computeOverallScore(merged);
    // Also include merged dimensions so partial updates are applied
    for (const key of DIMENSION_KEYS) {
      updateData[key] = merged[key];
    }
  }

  const [updated] = await db
    .update(courseReviews)
    .set(updateData)
    .where(and(eq(courseReviews.id, reviewId), eq(courseReviews.userId, userId)))
    .returning();

  if (updated) {
    await refreshCommunityScore(existing.courseId);
  }

  return updated ?? null;
}

export async function deleteReview(reviewId: string, userId: string) {
  const existing = await getReview(reviewId);
  if (!existing || existing.userId !== userId) return null;

  const [deleted] = await db
    .delete(courseReviews)
    .where(and(eq(courseReviews.id, reviewId), eq(courseReviews.userId, userId)))
    .returning();

  if (deleted) {
    await refreshCommunityScore(existing.courseId);
  }

  return deleted ?? null;
}

export async function listReviews(
  courseId: string,
  page = 1,
  pageSize = 20
) {
  const offset = (page - 1) * pageSize;

  const reviews = await db
    .select()
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId))
    .orderBy(desc(courseReviews.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId));

  const totalCount = countResult?.count ?? 0;

  return { reviews, totalCount, page, pageSize };
}

export async function getReview(reviewId: string) {
  const [review] = await db
    .select()
    .from(courseReviews)
    .where(eq(courseReviews.id, reviewId));

  return review ?? null;
}

/**
 * Recompute community average score and review count for a course.
 * FR-17: Only touches communityAverageScore and reviewCount.
 * Never modifies editorialScore, externalRankScore, or valueScore.
 */
export async function refreshCommunityScore(courseId: string) {
  const [stats] = await db
    .select({
      avgScore: sql<string | null>`ROUND(AVG(${courseReviews.overallScore}::numeric), 2)`,
      count: sql<number>`count(*)::int`,
    })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId));

  const avgScore = stats?.avgScore ?? null;
  const count = stats?.count ?? 0;

  // UPSERT: only community fields, never editorial/external/value
  await db
    .insert(courseComposites)
    .values({
      courseId,
      communityAverageScore: avgScore,
      reviewCount: count,
    })
    .onConflictDoUpdate({
      target: courseComposites.courseId,
      set: {
        communityAverageScore: avgScore,
        reviewCount: count,
      },
    });
}
