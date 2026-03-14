import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  microsites,
  photoAssets,
  activityFeedEntries,
} from "@/lib/db/schema";
import { dispatchToTripMembers } from "@/services/notification/dispatch.service";
import type { PublishState } from "@/types";
import { randomUUID } from "crypto";

export async function getMicrosite(tripId: string) {
  const [microsite] = await db
    .select()
    .from(microsites)
    .where(eq(microsites.tripId, tripId));

  return microsite ?? null;
}

export async function createOrUpdateMicrosite(
  tripId: string,
  data: {
    selectedAssetIds?: string[];
    content?: Record<string, unknown>;
  }
) {
  const existing = await getMicrosite(tripId);

  if (existing) {
    const updateData: Record<string, unknown> = {};
    if (data.selectedAssetIds !== undefined) {
      updateData.selectedAssetIds = data.selectedAssetIds;
    }
    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    const [updated] = await db
      .update(microsites)
      .set(updateData)
      .where(eq(microsites.tripId, tripId))
      .returning();

    return updated;
  }

  // Create new microsite
  const slug = `trip-${tripId.slice(0, 8)}-${randomUUID().slice(0, 6)}`;

  const [created] = await db
    .insert(microsites)
    .values({
      tripId,
      slug,
      selectedAssetIds: data.selectedAssetIds ?? [],
      content: data.content ?? null,
      publishState: "draft",
      visibilityMode: "unlisted",
    })
    .returning();

  return created;
}

export async function publishMicrosite(tripId: string, captainId: string) {
  const microsite = await getMicrosite(tripId);
  if (!microsite) return { error: "Microsite not found" };

  if (microsite.publishState === "published") {
    return { error: "Microsite is already published" };
  }

  // Validate all selected photos are publish_eligible or published
  if (microsite.selectedAssetIds.length > 0) {
    const photos = await db
      .select()
      .from(photoAssets)
      .where(
        and(
          inArray(photoAssets.id, microsite.selectedAssetIds),
          isNull(photoAssets.deletedAt)
        )
      );

    const validStates: PublishState[] = ["publish_eligible", "published"];
    const ineligible = photos.filter(
      (p) => !validStates.includes(p.publishState as PublishState)
    );

    if (ineligible.length > 0) {
      return {
        error: "Some selected photos are not eligible for publication",
        ineligibleIds: ineligible.map((p) => p.id),
      };
    }

    // Transition eligible photos to published
    await db
      .update(photoAssets)
      .set({
        publishState: "published",
        publishedAt: new Date(),
        statusChangedAt: new Date(),
      })
      .where(
        and(
          inArray(photoAssets.id, microsite.selectedAssetIds),
          eq(photoAssets.publishState, "publish_eligible")
        )
      );
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(microsites)
      .set({
        publishState: "published",
        publishedAt: new Date(),
        statusChangedAt: new Date(),
      })
      .where(eq(microsites.tripId, tripId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "microsite_published",
      actorId: captainId,
      description: "Published the trip recap microsite",
      metadata: { slug: updated.slug },
    });

    return { microsite: updated };
  }).then(async (result) => {
    await dispatchToTripMembers({
      tripId,
      eventType: "microsite_published",
      title: "Trip recap is live",
      body: "The trip recap microsite has been published.",
      excludeUserId: captainId,
    });
    return result;
  });
}

export async function setVisibility(
  tripId: string,
  mode: "unlisted" | "public"
) {
  const [updated] = await db
    .update(microsites)
    .set({
      visibilityMode: mode,
      statusChangedAt: new Date(),
    })
    .where(eq(microsites.tripId, tripId))
    .returning();

  if (!updated) return { error: "Microsite not found" };
  return { microsite: updated };
}

export async function unpublishMicrosite(tripId: string) {
  const microsite = await getMicrosite(tripId);
  if (!microsite) return { error: "Microsite not found" };

  if (microsite.publishState !== "published") {
    return { error: "Microsite is not currently published" };
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(microsites)
      .set({
        publishState: "unpublished",
        statusChangedAt: new Date(),
      })
      .where(eq(microsites.tripId, tripId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "microsite_unpublished",
      actorId: null,
      description: "Trip recap microsite was unpublished",
      metadata: { slug: updated.slug },
    });

    return { microsite: updated };
  });
}

export async function getPublicMicrosite(slug: string) {
  const [microsite] = await db
    .select()
    .from(microsites)
    .where(
      and(eq(microsites.slug, slug), eq(microsites.publishState, "published"))
    );

  if (!microsite) return null;

  // Load published photos for the microsite
  let photos: typeof photoAssets.$inferSelect[] = [];
  if (microsite.selectedAssetIds.length > 0) {
    photos = await db
      .select()
      .from(photoAssets)
      .where(
        and(
          inArray(photoAssets.id, microsite.selectedAssetIds),
          eq(photoAssets.publishState, "published"),
          isNull(photoAssets.deletedAt)
        )
      );
  }

  return {
    slug: microsite.slug,
    content: microsite.content,
    visibilityMode: microsite.visibilityMode,
    publishedAt: microsite.publishedAt,
    photos: photos.map((p) => ({
      id: p.id,
      storageKey: p.storageKey,
      caption: p.caption,
      metadata: p.metadata,
    })),
  };
}
