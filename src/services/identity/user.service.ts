import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type NewUser } from "@/lib/db/schema";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** Fields safe to return to the client (excludes passwordHash) */
function sanitize(user: typeof users.$inferSelect) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
    } satisfies NewUser)
    .returning();

  return sanitize(user);
}

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)));

  return user ? sanitize(user) : null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)));

  return user ?? null;
}

export async function verifyPassword(
  user: typeof users.$inferSelect,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    phone: string | null;
    handicap: string | null;
    homeAirport: string | null;
    preferredLocation: string | null;
  }>
) {
  const [user] = await db
    .update(users)
    .set(data)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();

  return user ? sanitize(user) : null;
}

export async function updatePassword(id: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}
