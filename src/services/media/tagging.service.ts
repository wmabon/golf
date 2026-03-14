import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { photoTags, photoConsents } from "@/lib/db/schema";
import { dispatchNotification } from "@/services/notification/dispatch.service";

export async function tagUsers(
  photoId: string,
  userIds: string[],
  taggedById: string
) {
  return db.transaction(async (tx) => {
    const inserted = [];

    for (const userId of userIds) {
      // Insert tag (unique constraint will prevent duplicates)
      const [tag] = await tx
        .insert(photoTags)
        .values({
          photoAssetId: photoId,
          userId,
          taggedById,
        })
        .onConflictDoNothing()
        .returning();

      if (tag) {
        inserted.push(tag);

        // Create pending consent record for each tagged user
        await tx
          .insert(photoConsents)
          .values({
            photoAssetId: photoId,
            userId,
            consentState: "pending",
          })
          .onConflictDoNothing();

        // Dispatch consent notification (fire-and-forget outside tx)
      }
    }

    return { tags: inserted };
  }).then(async (result) => {
    // Dispatch notifications outside the transaction
    for (const tag of result.tags) {
      await dispatchNotification({
        userId: tag.userId,
        eventType: "photo_tagged",
        title: "You were tagged in a photo",
        body: "You have been tagged in a trip photo. Please review and provide your consent.",
      });
    }
    return result;
  });
}

export async function removeTag(photoId: string, userId: string) {
  return db.transaction(async (tx) => {
    // Delete the tag
    const deleted = await tx
      .delete(photoTags)
      .where(
        and(
          eq(photoTags.photoAssetId, photoId),
          eq(photoTags.userId, userId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return { error: "Tag not found" };
    }

    // Delete associated consent
    await tx
      .delete(photoConsents)
      .where(
        and(
          eq(photoConsents.photoAssetId, photoId),
          eq(photoConsents.userId, userId)
        )
      );

    return { removed: true };
  });
}
