import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  membershipEntitlements,
  type NewMembershipEntitlement,
} from "@/lib/db/schema";

export async function listMemberships(userId: string) {
  return db
    .select()
    .from(membershipEntitlements)
    .where(eq(membershipEntitlements.userId, userId));
}

export async function createMembership(
  userId: string,
  data: {
    clubName: string;
    networkName?: string | null;
    accessType: string;
    willingToSponsor?: boolean;
    guestLimitNotes?: string | null;
    notes?: string | null;
  }
) {
  const [membership] = await db
    .insert(membershipEntitlements)
    .values({
      userId,
      clubName: data.clubName,
      networkName: data.networkName ?? null,
      accessType: data.accessType,
      willingToSponsor: data.willingToSponsor ?? false,
      guestLimitNotes: data.guestLimitNotes ?? null,
      notes: data.notes ?? null,
    } satisfies NewMembershipEntitlement)
    .returning();

  return membership;
}

export async function updateMembership(
  id: string,
  userId: string,
  data: Partial<{
    clubName: string;
    networkName: string | null;
    accessType: string;
    willingToSponsor: boolean;
    guestLimitNotes: string | null;
    notes: string | null;
  }>
) {
  const [membership] = await db
    .update(membershipEntitlements)
    .set(data)
    .where(
      and(
        eq(membershipEntitlements.id, id),
        eq(membershipEntitlements.userId, userId)
      )
    )
    .returning();

  return membership ?? null;
}

export async function deleteMembership(id: string, userId: string) {
  const [deleted] = await db
    .delete(membershipEntitlements)
    .where(
      and(
        eq(membershipEntitlements.id, id),
        eq(membershipEntitlements.userId, userId)
      )
    )
    .returning();

  return deleted ?? null;
}

export async function toggleSponsorWillingness(id: string, userId: string) {
  // Fetch current value, then toggle
  const [current] = await db
    .select({ willingToSponsor: membershipEntitlements.willingToSponsor })
    .from(membershipEntitlements)
    .where(
      and(
        eq(membershipEntitlements.id, id),
        eq(membershipEntitlements.userId, userId)
      )
    );

  if (!current) return null;

  const [updated] = await db
    .update(membershipEntitlements)
    .set({ willingToSponsor: !current.willingToSponsor })
    .where(eq(membershipEntitlements.id, id))
    .returning();

  return updated;
}
