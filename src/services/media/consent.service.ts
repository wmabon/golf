import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  photoAssets,
  photoConsents,
  activityFeedEntries,
} from "@/lib/db/schema";
import {
  validateTransition,
  canTransition,
} from "@/services/media/state-machines/photo-asset-sm";
import { dispatchNotification } from "@/services/notification/dispatch.service";
import type { PublishState } from "@/types";

export async function nominateForPublication(photoId: string, userId: string) {
  const [photo] = await db
    .select()
    .from(photoAssets)
    .where(and(eq(photoAssets.id, photoId), isNull(photoAssets.deletedAt)));

  if (!photo) return { error: "Photo not found" };

  const result = validateTransition(
    photo.publishState as PublishState,
    "review_pending"
  );
  if (!result.valid) return { error: result.reason };

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(photoAssets)
      .set({
        publishState: "review_pending",
        statusChangedAt: new Date(),
      })
      .where(eq(photoAssets.id, photoId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: photo.tripId,
      eventType: "photo_nominated",
      actorId: userId,
      description: "Nominated a photo for publication",
      metadata: { photoId },
    });

    // Dispatch consent requests to all tagged users with pending consent
    const pendingConsents = await tx
      .select()
      .from(photoConsents)
      .where(
        and(
          eq(photoConsents.photoAssetId, photoId),
          eq(photoConsents.consentState, "pending")
        )
      );

    return { photo: updated, pendingConsents };
  }).then(async (result) => {
    for (const consent of result.pendingConsents) {
      await dispatchNotification({
        userId: consent.userId,
        eventType: "photo_consent_requested",
        title: "Photo consent requested",
        body: "A photo you are tagged in has been nominated for publication. Please approve or veto.",
      });
    }
    return { photo: result.photo };
  });
}

export async function submitConsent(
  photoId: string,
  userId: string,
  decision: "approved" | "vetoed"
) {
  // Verify the consent record exists and is pending
  const [consent] = await db
    .select()
    .from(photoConsents)
    .where(
      and(
        eq(photoConsents.photoAssetId, photoId),
        eq(photoConsents.userId, userId)
      )
    );

  if (!consent) return { error: "No consent record found for this user" };
  if (consent.consentState !== "pending") {
    return { error: "Consent decision has already been submitted" };
  }

  const [photo] = await db
    .select()
    .from(photoAssets)
    .where(eq(photoAssets.id, photoId));

  if (!photo) return { error: "Photo not found" };

  return db.transaction(async (tx) => {
    // Update consent record
    const [updatedConsent] = await tx
      .update(photoConsents)
      .set({
        consentState: decision,
        decidedAt: new Date(),
        statusChangedAt: new Date(),
      })
      .where(eq(photoConsents.id, consent.id))
      .returning();

    // Log to activity feed
    await tx.insert(activityFeedEntries).values({
      tripId: photo.tripId,
      eventType: "photo_consent_decision",
      actorId: userId,
      description: `${decision === "approved" ? "Approved" : "Vetoed"} a photo`,
      metadata: { photoId, decision },
    });

    // If vetoed, immediately transition photo to withdrawn
    if (decision === "vetoed") {
      if (canTransition(photo.publishState as PublishState, "withdrawn")) {
        await tx
          .update(photoAssets)
          .set({
            publishState: "withdrawn",
            statusChangedAt: new Date(),
          })
          .where(eq(photoAssets.id, photoId));
      }
      return { consent: updatedConsent, photoState: "withdrawn" as const };
    }

    // If approved, check if ALL consents are approved
    const allConsents = await tx
      .select()
      .from(photoConsents)
      .where(eq(photoConsents.photoAssetId, photoId));

    const allApproved = allConsents.every(
      (c) => c.id === consent.id ? decision === "approved" : c.consentState === "approved"
    );

    if (
      allApproved &&
      canTransition(photo.publishState as PublishState, "publish_eligible")
    ) {
      await tx
        .update(photoAssets)
        .set({
          publishState: "publish_eligible",
          statusChangedAt: new Date(),
        })
        .where(eq(photoAssets.id, photoId));

      return {
        consent: updatedConsent,
        photoState: "publish_eligible" as const,
      };
    }

    return {
      consent: updatedConsent,
      photoState: photo.publishState as PublishState,
    };
  });
}

export async function requestTakedown(photoId: string, userId: string) {
  const [photo] = await db
    .select()
    .from(photoAssets)
    .where(and(eq(photoAssets.id, photoId), isNull(photoAssets.deletedAt)));

  if (!photo) return { error: "Photo not found" };

  if (photo.publishState !== "published") {
    return { error: "Only published photos can be taken down" };
  }

  const result = validateTransition("published", "withdrawn");
  if (!result.valid) return { error: result.reason };

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(photoAssets)
      .set({
        publishState: "withdrawn",
        statusChangedAt: new Date(),
      })
      .where(eq(photoAssets.id, photoId))
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: photo.tripId,
      eventType: "photo_takedown",
      actorId: userId,
      description: "Requested takedown of a published photo",
      metadata: { photoId, previousState: "published" },
    });

    return { photo: updated };
  });
}

export async function getConsentQueue(userId: string) {
  return db
    .select({
      consent: photoConsents,
      photo: photoAssets,
    })
    .from(photoConsents)
    .innerJoin(photoAssets, eq(photoConsents.photoAssetId, photoAssets.id))
    .where(
      and(
        eq(photoConsents.userId, userId),
        eq(photoConsents.consentState, "pending"),
        isNull(photoAssets.deletedAt)
      )
    )
    .orderBy(desc(photoConsents.createdAt));
}

export async function getAuditLog(tripId: string) {
  return db
    .select({
      consent: photoConsents,
      photo: photoAssets,
    })
    .from(photoConsents)
    .innerJoin(photoAssets, eq(photoConsents.photoAssetId, photoAssets.id))
    .where(eq(photoAssets.tripId, tripId))
    .orderBy(desc(photoConsents.statusChangedAt));
}
