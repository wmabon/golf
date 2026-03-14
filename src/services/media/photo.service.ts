import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  photoAssets,
  photoTags,
  photoConsents,
  activityFeedEntries,
} from "@/lib/db/schema";
import type { PublishState } from "@/types";
import { randomUUID } from "crypto";

export async function uploadPhoto(
  tripId: string,
  uploaderId: string,
  data: { caption?: string }
) {
  return db.transaction(async (tx) => {
    const storageKey = `trips/${tripId}/photos/${randomUUID()}`;

    const [photo] = await tx
      .insert(photoAssets)
      .values({
        tripId,
        uploaderId,
        storageKey,
        caption: data.caption ?? null,
        publishState: "private",
      })
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "photo_uploaded",
      actorId: uploaderId,
      description: "Uploaded a photo",
      metadata: { photoId: photo.id },
    });

    return photo;
  });
}

export async function listPhotos(
  tripId: string,
  filters?: { publishState?: PublishState }
) {
  const conditions = [
    eq(photoAssets.tripId, tripId),
    isNull(photoAssets.deletedAt),
  ];

  if (filters?.publishState) {
    conditions.push(eq(photoAssets.publishState, filters.publishState));
  }

  return db
    .select()
    .from(photoAssets)
    .where(and(...conditions));
}

export async function getPhoto(photoId: string) {
  const [photo] = await db
    .select()
    .from(photoAssets)
    .where(and(eq(photoAssets.id, photoId), isNull(photoAssets.deletedAt)));

  if (!photo) return null;

  const tags = await db
    .select()
    .from(photoTags)
    .where(eq(photoTags.photoAssetId, photoId));

  const consents = await db
    .select()
    .from(photoConsents)
    .where(eq(photoConsents.photoAssetId, photoId));

  return { photo, tags, consents };
}

export async function deletePhoto(photoId: string, userId: string) {
  const [photo] = await db
    .select()
    .from(photoAssets)
    .where(and(eq(photoAssets.id, photoId), isNull(photoAssets.deletedAt)));

  if (!photo) return { error: "Photo not found" };

  // Only uploader or captain can delete (captain check done at API layer)
  if (photo.uploaderId !== userId) {
    return { error: "Only the uploader or captain can delete this photo" };
  }

  const [updated] = await db
    .update(photoAssets)
    .set({ deletedAt: new Date() })
    .where(eq(photoAssets.id, photoId))
    .returning();

  return { photo: updated };
}

export async function deletePhotoAsCaptain(photoId: string) {
  const [photo] = await db
    .select()
    .from(photoAssets)
    .where(and(eq(photoAssets.id, photoId), isNull(photoAssets.deletedAt)));

  if (!photo) return { error: "Photo not found" };

  const [updated] = await db
    .update(photoAssets)
    .set({ deletedAt: new Date() })
    .where(eq(photoAssets.id, photoId))
    .returning();

  return { photo: updated };
}

export async function getPresignedUploadUrl(tripId: string) {
  // STUB: Real S3 integration later
  const key = `trips/${tripId}/photos/${randomUUID()}`;
  return {
    uploadUrl: `https://s3.stub.example.com/${key}?X-Amz-Signature=stub`,
    storageKey: key,
  };
}
