import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tripMembers, activityFeedEntries } from "@/lib/db/schema";
import { nanoid } from "nanoid";

export async function sendInvites(
  tripId: string,
  inviterId: string,
  emails: string[]
) {
  const results = [];

  for (const email of emails) {
    const token = nanoid(32);

    try {
      const [member] = await db
        .insert(tripMembers)
        .values({
          tripId,
          inviteEmail: email.toLowerCase(),
          inviteMethod: "email",
          inviteToken: token,
          invitedBy: inviterId,
        })
        .returning();

      await db.insert(activityFeedEntries).values({
        tripId,
        eventType: "member_invited",
        actorId: inviterId,
        description: `Invited ${email}`,
        metadata: { email },
      });

      results.push({ email, status: "sent" as const, invite: member });
    } catch {
      // Likely duplicate — user already invited
      results.push({ email, status: "already_invited" as const });
    }
  }

  return results;
}

export async function generateShareLink(tripId: string, inviterId: string) {
  const token = nanoid(32);

  const [member] = await db
    .insert(tripMembers)
    .values({
      tripId,
      inviteMethod: "share_link",
      inviteToken: token,
      invitedBy: inviterId,
    })
    .returning();

  return { token: member.inviteToken, id: member.id };
}

export async function getInviteByToken(token: string) {
  const [member] = await db
    .select()
    .from(tripMembers)
    .where(eq(tripMembers.inviteToken, token));

  return member ?? null;
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await getInviteByToken(token);
  if (!invite) return { error: "Invite not found" };
  if (invite.responseStatus !== "pending") {
    return { error: "Invite already responded to" };
  }

  const [updated] = await db
    .update(tripMembers)
    .set({
      userId,
      responseStatus: "accepted",
      respondedAt: new Date(),
    })
    .where(eq(tripMembers.id, invite.id))
    .returning();

  await db.insert(activityFeedEntries).values({
    tripId: invite.tripId,
    eventType: "member_accepted",
    actorId: userId,
    description: "Accepted trip invitation",
  });

  return { member: updated };
}

export async function declineInvite(token: string, userId: string) {
  const invite = await getInviteByToken(token);
  if (!invite) return { error: "Invite not found" };
  if (invite.responseStatus !== "pending") {
    return { error: "Invite already responded to" };
  }

  const [updated] = await db
    .update(tripMembers)
    .set({
      userId,
      responseStatus: "declined",
      respondedAt: new Date(),
    })
    .where(eq(tripMembers.id, invite.id))
    .returning();

  await db.insert(activityFeedEntries).values({
    tripId: invite.tripId,
    eventType: "member_declined",
    actorId: userId,
    description: "Declined trip invitation",
  });

  return { member: updated };
}

export async function listInvites(tripId: string) {
  return db
    .select()
    .from(tripMembers)
    .where(eq(tripMembers.tripId, tripId));
}

export async function listMembers(tripId: string) {
  return db
    .select()
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.responseStatus, "accepted")
      )
    );
}

export async function transferCaptain(
  tripId: string,
  currentCaptainId: string,
  newCaptainId: string
) {
  return db.transaction(async (tx) => {
    // Demote current captain
    await tx
      .update(tripMembers)
      .set({ role: "collaborator" })
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, currentCaptainId)
        )
      );

    // Promote new captain
    await tx
      .update(tripMembers)
      .set({ role: "captain" })
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, newCaptainId)
        )
      );

    await tx.insert(activityFeedEntries).values({
      tripId,
      eventType: "captain_transferred",
      actorId: currentCaptainId,
      description: "Captain role transferred",
      metadata: {
        previousCaptainId: currentCaptainId,
        newCaptainId,
      },
    });
  });
}

export async function removeMember(
  tripId: string,
  captainId: string,
  targetUserId: string
) {
  const [deleted] = await db
    .delete(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, targetUserId)
      )
    )
    .returning();

  if (!deleted) return null;

  await db.insert(activityFeedEntries).values({
    tripId,
    eventType: "member_removed",
    actorId: captainId,
    description: "Removed a member from the trip",
    metadata: { removedUserId: targetUserId },
  });

  return deleted;
}

export async function setConstraints(
  tripId: string,
  userId: string,
  hardConstraints: Record<string, unknown> | null,
  softPreferences: Record<string, unknown> | null
) {
  const [updated] = await db
    .update(tripMembers)
    .set({ hardConstraints, softPreferences })
    .where(
      and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId))
    )
    .returning();

  return updated ?? null;
}
