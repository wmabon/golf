import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

let container: StartedPostgreSqlContainer;
let client: ReturnType<typeof postgres>;

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;
let testDb: TestDb;

/**
 * Start a PostgreSQL + PostGIS container and return a connected Drizzle instance.
 * Call this in beforeAll(). The container uses postgis/postgis:16-3.4.
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

  // Enable PostGIS and create all tables
  await client`CREATE EXTENSION IF NOT EXISTS postgis`;

  // Create enums and tables in dependency order
  // Users first (no FKs)
  await client`CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated')`;
  await client`CREATE TYPE system_role AS ENUM ('user', 'admin', 'concierge_ops')`;
  await client`
    CREATE TABLE users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      email_verified TIMESTAMPTZ,
      phone VARCHAR(20),
      handicap DECIMAL(3,1),
      home_airport VARCHAR(10),
      preferred_location VARCHAR(255),
      password_hash VARCHAR(255) NOT NULL,
      status user_status NOT NULL DEFAULT 'active',
      system_role system_role NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    )
  `;

  // Trips
  await client`CREATE TYPE trip_status AS ENUM ('draft', 'planning', 'voting', 'booking', 'locked', 'in_progress', 'completed', 'archived')`;
  await client`CREATE TYPE anchor_type AS ENUM ('airport_code', 'city_region', 'map_area')`;
  await client`CREATE TYPE swap_policy AS ENUM ('notify_only', 'captain_approval', 'auto_upgrade')`;
  await client`CREATE TYPE voting_mode AS ENUM ('destination', 'course')`;
  await client`
    CREATE TABLE trips (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      date_start DATE NOT NULL,
      date_end DATE NOT NULL,
      golfer_count INTEGER NOT NULL DEFAULT 4,
      anchor_type anchor_type NOT NULL,
      anchor_value VARCHAR(255) NOT NULL,
      anchor_lat DECIMAL(10,7),
      anchor_lng DECIMAL(10,7),
      budget_settings JSONB,
      status trip_status NOT NULL DEFAULT 'draft',
      creator_id UUID NOT NULL REFERENCES users(id),
      status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      freeze_date DATE,
      swap_policy swap_policy NOT NULL DEFAULT 'captain_approval',
      voting_deadline TIMESTAMPTZ,
      voting_mode voting_mode NOT NULL DEFAULT 'destination',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Trip members
  await client`CREATE TYPE trip_role AS ENUM ('collaborator', 'captain')`;
  await client`CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined')`;
  await client`CREATE TYPE invite_method AS ENUM ('email', 'share_link', 'sms')`;
  await client`
    CREATE TABLE trip_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      role trip_role NOT NULL DEFAULT 'collaborator',
      response_status invite_status NOT NULL DEFAULT 'pending',
      invite_email VARCHAR(255),
      invite_method invite_method,
      invite_token VARCHAR(64) UNIQUE,
      invited_by UUID NOT NULL REFERENCES users(id),
      hard_constraints JSONB,
      soft_preferences JSONB,
      invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(trip_id, user_id)
    )
  `;

  // Activity feed
  await client`
    CREATE TABLE activity_feed_entries (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      event_type VARCHAR(100) NOT NULL,
      actor_id UUID REFERENCES users(id),
      description TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

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
 * Clean all rows from tables (for between-test isolation).
 */
export async function cleanTables(): Promise<void> {
  await client`DELETE FROM activity_feed_entries`;
  await client`DELETE FROM trip_members`;
  await client`DELETE FROM trips`;
  await client`DELETE FROM users`;
}
