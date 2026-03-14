import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scoreEntries, type NewScoreEntry } from "@/lib/db/schema";
import type { BatchScoreInput } from "@/lib/validation/rounds";

/**
 * Batch upsert scores for a player in a round.
 * Uses INSERT ON CONFLICT to handle offline sync — client_timestamp
 * is set on every write so latest-wins resolution is possible.
 */
export async function batchUpsertScores(
  roundId: string,
  playerId: string,
  entries: BatchScoreInput["entries"]
) {
  const now = new Date();

  const results = await Promise.all(
    entries.map(async (entry) => {
      const [upserted] = await db
        .insert(scoreEntries)
        .values({
          roundId,
          playerId,
          holeNumber: entry.holeNumber,
          strokes: entry.strokes,
          netStrokes: entry.netStrokes ?? null,
          clientTimestamp: now,
        } satisfies NewScoreEntry)
        .onConflictDoUpdate({
          target: [
            scoreEntries.roundId,
            scoreEntries.playerId,
            scoreEntries.holeNumber,
          ],
          set: {
            strokes: entry.strokes,
            netStrokes: entry.netStrokes ?? null,
            clientTimestamp: now,
          },
        })
        .returning();

      return upserted;
    })
  );

  return results;
}

/**
 * Get all scores for a round, grouped by player.
 */
export async function getScores(roundId: string) {
  const scores = await db
    .select()
    .from(scoreEntries)
    .where(eq(scoreEntries.roundId, roundId))
    .orderBy(scoreEntries.playerId, scoreEntries.holeNumber);

  // Group by player
  const byPlayer = new Map<string, typeof scores>();
  for (const score of scores) {
    const existing = byPlayer.get(score.playerId) ?? [];
    existing.push(score);
    byPlayer.set(score.playerId, existing);
  }

  return Object.fromEntries(byPlayer);
}

/**
 * Get all scores for review — useful for finding discrepancies.
 * Returns raw scores so the caller can compare entries across players.
 */
export async function getDiscrepancies(roundId: string) {
  const scores = await db
    .select()
    .from(scoreEntries)
    .where(eq(scoreEntries.roundId, roundId))
    .orderBy(scoreEntries.holeNumber, scoreEntries.playerId);

  return scores;
}
