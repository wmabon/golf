import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { readFileSync } from "fs";
import { join } from "path";

let container: StartedPostgreSqlContainer;
let client: ReturnType<typeof postgres>;
export type TestDb = ReturnType<typeof drizzle<typeof schema>>;
let testDb: TestDb;

/**
 * Start a PostgreSQL + PostGIS container, run the full migration,
 * and return a connected Drizzle instance. Call this in beforeAll().
 */
export async function setupTestDb(): Promise<TestDb> {
  container = await new PostgreSqlContainer("postgis/postgis:16-3.4")
    .withDatabase("golf_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const connectionString = container.getConnectionUri();
  client = postgres(connectionString);
  testDb = drizzle(client, { schema });

  // Read and execute the full migration
  const migrationPath = join(process.cwd(), "src/lib/db/migrations/0000_redundant_jubilee.sql");
  const migrationSql = readFileSync(migrationPath, "utf-8");

  // Split by statement-breakpoint and execute each
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await client.unsafe(stmt);
  }

  return testDb;
}

/**
 * Tear down the test container. Call in afterAll().
 */
export async function teardownTestDb(): Promise<void> {
  if (client) await client.end();
  if (container) await container.stop();
}

/**
 * Truncate all tables for test isolation (reverse dependency order).
 * Uses CASCADE to handle foreign key constraints.
 */
export async function cleanTables(): Promise<void> {
  await client.unsafe(`
    TRUNCATE 
      settlement_actions, trip_expenses, photo_consents, photo_tags, photo_assets,
      microsites, bet_participants, bets, score_entries, games, game_templates, rounds,
      reservation_swaps, reservations, booking_slots, booking_requests,
      fee_charges, fee_schedules, external_bookings, itinerary_items,
      notification_preferences, notifications, lodging_options, flight_options,
      course_reviews, course_reports, course_composites, course_rules, courses,
      airports, votes, trip_options, activity_feed_entries, trip_members,
      trips, membership_entitlements, trip_series, users
    CASCADE
  `);
}
