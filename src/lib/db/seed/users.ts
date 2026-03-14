import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const TEST_USERS = [
  {
    name: "Demo Golfer",
    email: "demo@golf.test",
    handicap: "14.2",
    homeAirport: "MCO",
    systemRole: "user" as const,
  },
  {
    name: "Captain Kirk",
    email: "captain@golf.test",
    handicap: "8.5",
    homeAirport: "LAX",
    systemRole: "user" as const,
  },
  {
    name: "Admin User",
    email: "admin@golf.test",
    homeAirport: "JFK",
    systemRole: "admin" as const,
  },
];

const TEST_PASSWORD = "password123";

export async function seedUsers() {
  console.log("Seeding test users...");

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4); // fast rounds for seed

  for (const testUser of TEST_USERS) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, testUser.email));

    if (existing) {
      console.log(`  Skipping ${testUser.email} (already exists)`);
      continue;
    }

    await db.insert(users).values({
      name: testUser.name,
      email: testUser.email,
      passwordHash,
      handicap: testUser.handicap ?? null,
      homeAirport: testUser.homeAirport ?? null,
      systemRole: testUser.systemRole,
    });

    console.log(`  Created ${testUser.email} (${testUser.systemRole})`);
  }

  console.log("\n  Test credentials:");
  console.log("  demo@golf.test    / password123");
  console.log("  captain@golf.test / password123");
  console.log("  admin@golf.test   / password123 (admin role)");
}
