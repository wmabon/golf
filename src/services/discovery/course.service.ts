import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, courseRules, courseComposites } from "@/lib/db/schema";
import { extractLat, extractLng } from "@/lib/db/spatial-helpers";

export async function getCourseById(courseId: string) {
  const [result] = await db
    .select({
      id: courses.id,
      name: courses.name,
      city: courses.city,
      state: courses.state,
      lat: extractLat(courses.location),
      lng: extractLng(courses.location),
      accessType: courses.accessType,
      accessConfidence: courses.accessConfidence,
      priceBandMin: courses.priceBandMin,
      priceBandMax: courses.priceBandMax,
      reasonsToPlay: courses.reasonsToPlay,
      websiteUrl: courses.websiteUrl,
      phone: courses.phone,
      amenities: courses.amenities,
      photos: courses.photos,
      status: courses.status,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      // Course rules
      bookingWindowRule: courseRules.bookingWindowRule,
      bookingWindowDays: courseRules.bookingWindowDays,
      cancellationRule: courseRules.cancellationRule,
      cancellationDeadlineHours: courseRules.cancellationDeadlineHours,
      maxPlayers: courseRules.maxPlayers,
      publicTimesAvailable: courseRules.publicTimesAvailable,
      ruleSource: courseRules.source,
      // Quality scores
      editorialScore: courseComposites.editorialScore,
      externalRankScore: courseComposites.externalRankScore,
      valueScore: courseComposites.valueScore,
      communityAverageScore: courseComposites.communityAverageScore,
      reviewCount: courseComposites.reviewCount,
      valueLabel: courseComposites.valueLabel,
      tripFitInputs: courseComposites.tripFitInputs,
    })
    .from(courses)
    .leftJoin(courseRules, eq(courses.id, courseRules.courseId))
    .leftJoin(courseComposites, eq(courses.id, courseComposites.courseId))
    .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)));

  return result ?? null;
}

export async function getCourse(courseId: string) {
  const [course] = await db
    .select({
      id: courses.id,
      name: courses.name,
      status: courses.status,
    })
    .from(courses)
    .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)));

  return course ?? null;
}
