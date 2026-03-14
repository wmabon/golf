import { eq, and, sql, isNull, inArray, gte, lte, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  courses,
  courseComposites,
  tripMembers,
  membershipEntitlements,
} from "@/lib/db/schema";
import {
  withinRadius,
  withinBounds,
  distanceMiles,
  extractLat,
  extractLng,
} from "@/lib/db/spatial-helpers";

type AccessType = "public" | "resort" | "semi_private" | "private";

interface SearchParams {
  lat: number;
  lng: number;
  radiusMiles: number;
  priceBand?: { min?: number; max?: number };
  accessTypes?: AccessType[];
  includePrivate?: boolean;
  tripId?: string;
  sortBy: "distance" | "price" | "quality";
  page: number;
  pageSize: number;
}

interface BoundsSearchParams {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
  priceBand?: { min?: number; max?: number };
  accessTypes?: AccessType[];
  includePrivate?: boolean;
  tripId?: string;
  sortBy: "distance" | "price" | "quality";
}

export async function searchCourses(params: SearchParams) {
  const {
    lat,
    lng,
    radiusMiles,
    priceBand,
    accessTypes,
    includePrivate,
    tripId,
    sortBy,
    page,
    pageSize,
  } = params;

  const conditions = buildWhereConditions({
    lat,
    lng,
    radiusMiles,
    priceBand,
    accessTypes,
    includePrivate,
  });

  // Build ORDER BY
  const orderClause = buildOrderBy(sortBy, lng, lat);

  const offset = (page - 1) * pageSize;

  const results = await db
    .select({
      id: courses.id,
      name: courses.name,
      city: courses.city,
      state: courses.state,
      lat: extractLat(courses.location),
      lng: extractLng(courses.location),
      accessType: courses.accessType,
      accessConfidence: courses.accessConfidence,
      distanceMiles: distanceMiles(courses.location, lng, lat),
      priceBandMin: courses.priceBandMin,
      priceBandMax: courses.priceBandMax,
      reasonsToPlay: courses.reasonsToPlay,
      editorialScore: courseComposites.editorialScore,
      externalRankScore: courseComposites.externalRankScore,
      valueScore: courseComposites.valueScore,
      communityAverageScore: courseComposites.communityAverageScore,
      reviewCount: courseComposites.reviewCount,
      valueLabel: courseComposites.valueLabel,
    })
    .from(courses)
    .leftJoin(courseComposites, eq(courses.id, courseComposites.courseId))
    .where(and(...conditions))
    .orderBy(...orderClause)
    .limit(pageSize)
    .offset(offset);

  // Separate COUNT query for totalCount
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courses)
    .where(and(...conditions));

  const totalCount = countResult?.count ?? 0;

  // Resolve member-unlocked private courses if tripId provided
  let memberUnlockedCourses: Array<{
    courseId: string;
    courseName: string;
    sponsorName: string;
    accessExplanation: string;
  }> = [];

  if (tripId) {
    memberUnlockedCourses = await resolveSponsoredCourses(
      tripId,
      lat,
      lng,
      radiusMiles
    );
  }

  return {
    courses: results,
    totalCount,
    page,
    pageSize,
    memberUnlockedCourses,
  };
}

export async function searchCoursesByBounds(params: BoundsSearchParams) {
  const { sw, ne, priceBand, accessTypes, includePrivate, sortBy } = params;

  const conditions = buildBoundsWhereConditions({
    sw,
    ne,
    priceBand,
    accessTypes,
    includePrivate,
  });

  // Use center of bounds for distance calculations
  const centerLat = (sw.lat + ne.lat) / 2;
  const centerLng = (sw.lng + ne.lng) / 2;

  const orderClause = buildOrderBy(sortBy, centerLng, centerLat);

  const results = await db
    .select({
      id: courses.id,
      name: courses.name,
      city: courses.city,
      state: courses.state,
      lat: extractLat(courses.location),
      lng: extractLng(courses.location),
      accessType: courses.accessType,
      accessConfidence: courses.accessConfidence,
      distanceMiles: distanceMiles(courses.location, centerLng, centerLat),
      priceBandMin: courses.priceBandMin,
      priceBandMax: courses.priceBandMax,
      reasonsToPlay: courses.reasonsToPlay,
      editorialScore: courseComposites.editorialScore,
      externalRankScore: courseComposites.externalRankScore,
      valueScore: courseComposites.valueScore,
      communityAverageScore: courseComposites.communityAverageScore,
      reviewCount: courseComposites.reviewCount,
      valueLabel: courseComposites.valueLabel,
    })
    .from(courses)
    .leftJoin(courseComposites, eq(courses.id, courseComposites.courseId))
    .where(and(...conditions))
    .orderBy(...orderClause)
    .limit(200);

  return {
    courses: results,
    totalCount: results.length,
    page: 1,
    pageSize: 200,
    memberUnlockedCourses: [],
  };
}

// --- Internal helpers ---

function buildWhereConditions(params: {
  lat: number;
  lng: number;
  radiusMiles: number;
  priceBand?: { min?: number; max?: number };
  accessTypes?: AccessType[];
  includePrivate?: boolean;
}) {
  const { lat, lng, radiusMiles, priceBand, accessTypes, includePrivate } =
    params;

  const conditions = [
    eq(courses.status, "active"),
    isNull(courses.deletedAt),
    withinRadius(courses.location, lng, lat, radiusMiles),
  ];

  if (!includePrivate && !accessTypes) {
    conditions.push(
      sql`${courses.accessType} NOT IN ('private', 'unknown')`
    );
  }

  if (accessTypes && accessTypes.length > 0) {
    conditions.push(inArray(courses.accessType, accessTypes));
  }

  if (priceBand?.max !== undefined) {
    conditions.push(lte(courses.priceBandMax, String(priceBand.max)));
  }

  if (priceBand?.min !== undefined) {
    conditions.push(gte(courses.priceBandMin, String(priceBand.min)));
  }

  return conditions;
}

function buildBoundsWhereConditions(params: {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
  priceBand?: { min?: number; max?: number };
  accessTypes?: AccessType[];
  includePrivate?: boolean;
}) {
  const { sw, ne, priceBand, accessTypes, includePrivate } = params;

  const conditions = [
    eq(courses.status, "active"),
    isNull(courses.deletedAt),
    withinBounds(courses.location, sw, ne),
  ];

  if (!includePrivate && !accessTypes) {
    conditions.push(
      sql`${courses.accessType} NOT IN ('private', 'unknown')`
    );
  }

  if (accessTypes && accessTypes.length > 0) {
    conditions.push(inArray(courses.accessType, accessTypes));
  }

  if (priceBand?.max !== undefined) {
    conditions.push(lte(courses.priceBandMax, String(priceBand.max)));
  }

  if (priceBand?.min !== undefined) {
    conditions.push(gte(courses.priceBandMin, String(priceBand.min)));
  }

  return conditions;
}

function buildOrderBy(sortBy: string, lng: number, lat: number) {
  switch (sortBy) {
    case "price":
      return [sql`${courses.priceBandMax} ASC NULLS LAST`];
    case "quality":
      return [sql`${courseComposites.editorialScore} DESC NULLS LAST`];
    case "distance":
    default:
      return [asc(distanceMiles(courses.location, lng, lat))];
  }
}

async function resolveSponsoredCourses(
  tripId: string,
  lat: number,
  lng: number,
  radiusMiles: number
) {
  // Find private courses within the radius
  const privateCourses = await db
    .select({
      id: courses.id,
      name: courses.name,
    })
    .from(courses)
    .where(
      and(
        eq(courses.status, "active"),
        isNull(courses.deletedAt),
        eq(courses.accessType, "private"),
        withinRadius(courses.location, lng, lat, radiusMiles)
      )
    );

  if (privateCourses.length === 0) return [];

  // Find trip members who are willing to sponsor
  const sponsors = await db
    .select({
      userId: tripMembers.userId,
      clubName: membershipEntitlements.clubName,
    })
    .from(tripMembers)
    .innerJoin(
      membershipEntitlements,
      and(
        eq(tripMembers.userId, membershipEntitlements.userId),
        eq(membershipEntitlements.willingToSponsor, true)
      )
    )
    .where(eq(tripMembers.tripId, tripId));

  if (sponsors.length === 0) return [];

  // Fuzzy match: check if any sponsor's club name matches a private course name
  const unlocked: Array<{
    courseId: string;
    courseName: string;
    sponsorName: string;
    accessExplanation: string;
  }> = [];

  for (const course of privateCourses) {
    for (const sponsor of sponsors) {
      // Case-insensitive partial match
      const courseNameLower = course.name.toLowerCase();
      const clubNameLower = sponsor.clubName.toLowerCase();
      if (
        courseNameLower.includes(clubNameLower) ||
        clubNameLower.includes(courseNameLower)
      ) {
        unlocked.push({
          courseId: course.id,
          courseName: course.name,
          sponsorName: sponsor.userId ?? "Unknown",
          accessExplanation: `Playable through member's ${sponsor.clubName} access`,
        });
        break; // One sponsor per course is enough
      }
    }
  }

  return unlocked;
}

/** Export for testing: the pure access-filtering logic */
export function filterAccessTypes(
  includePrivate: boolean,
  accessTypes?: AccessType[]
): AccessType[] | null {
  if (accessTypes && accessTypes.length > 0) {
    return accessTypes;
  }
  if (!includePrivate) {
    // Exclude private and unknown
    return ["public", "resort", "semi_private"];
  }
  // Include all
  return null;
}
