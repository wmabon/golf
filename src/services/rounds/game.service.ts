import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  games,
  scoreEntries,
  activityFeedEntries,
  rounds,
  type NewGame,
} from "@/lib/db/schema";
import type { CreateGameInput } from "@/lib/validation/rounds";
import type { GameFormat } from "@/types";

export async function createGame(
  roundId: string,
  userId: string,
  data: CreateGameInput
) {
  // Look up the round to get the tripId for activity feed
  const [round] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.id, roundId));

  if (!round) return { error: "Round not found" };

  const gameName =
    data.name ?? data.format.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return db.transaction(async (tx) => {
    const [game] = await tx
      .insert(games)
      .values({
        roundId,
        templateId: data.templateId ?? null,
        name: gameName,
        teams: data.teams ?? [],
        stakesPerPlayer: data.stakesPerPlayer?.toString() ?? null,
        status: "created",
      } satisfies NewGame)
      .returning();

    await tx.insert(activityFeedEntries).values({
      tripId: round.tripId,
      eventType: "game_created",
      actorId: userId,
      description: `Game "${gameName}" created`,
      metadata: {
        gameId: game.id,
        roundId,
        format: data.format,
      },
    });

    return { game };
  });
}

export async function listGames(roundId: string) {
  return db
    .select()
    .from(games)
    .where(eq(games.roundId, roundId))
    .orderBy(games.createdAt);
}

export async function getGame(gameId: string) {
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.id, gameId));

  return game ?? null;
}

export async function updateGame(
  gameId: string,
  data: Partial<{
    name: string;
    teams: { name: string; playerIds: string[] }[];
    stakesPerPlayer: number;
    status: string;
  }>
) {
  const [existing] = await db
    .select()
    .from(games)
    .where(eq(games.id, gameId));

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.teams !== undefined) updateData.teams = data.teams;
  if (data.stakesPerPlayer !== undefined)
    updateData.stakesPerPlayer = data.stakesPerPlayer.toString();
  if (data.status !== undefined) {
    updateData.status = data.status;
    updateData.statusChangedAt = new Date();
  }

  if (Object.keys(updateData).length === 0) {
    return { game: existing };
  }

  const [updated] = await db
    .update(games)
    .set(updateData)
    .where(eq(games.id, gameId))
    .returning();

  return { game: updated };
}

// --- Result Calculation ---

type ScoreRow = {
  playerId: string;
  holeNumber: number;
  strokes: number;
  netStrokes: number | null;
};

type TeamDef = { name: string; playerIds: string[] };

/**
 * Calculate results for a game based on its format and the round's scores.
 */
export async function calculateResults(gameId: string) {
  const game = await getGame(gameId);
  if (!game) return { error: "Game not found" };

  // Get scores for this round
  const scores = await db
    .select()
    .from(scoreEntries)
    .where(eq(scoreEntries.roundId, game.roundId))
    .orderBy(scoreEntries.holeNumber);

  // Determine format from game name or look at template
  // For now we check the activity feed metadata or infer from the game
  // The format is stored in the activity feed metadata. We'll need
  // to look it up from the game's creation context.
  // Since format is not on the games table directly, we infer from the name.
  // A better approach: look up the template if available.
  const format = await resolveGameFormat(game);

  const teams = (game.teams ?? []) as TeamDef[];
  const allPlayerIds = teams.flatMap((t) => t.playerIds);

  // Filter scores to only players in this game's teams
  const relevantScores =
    allPlayerIds.length > 0
      ? scores.filter((s) => allPlayerIds.includes(s.playerId))
      : scores;

  switch (format) {
    case "stroke_play":
      return { results: calculateStrokePlay(relevantScores) };
    case "best_ball":
      return { results: calculateBestBall(relevantScores, teams) };
    case "skins":
      return { results: calculateSkins(relevantScores) };
    case "nassau":
      return { results: calculateNassau(relevantScores) };
    default:
      return { results: { format: "custom", note: "Custom games require manual scoring" } };
  }
}

/**
 * Resolve the game format. Since format is not stored on the game table directly,
 * we check the template or fall back to inferring from the game name.
 */
async function resolveGameFormat(game: {
  templateId: string | null;
  name: string;
}): Promise<GameFormat> {
  if (game.templateId) {
    const { gameTemplates } = await import("@/lib/db/schema");
    const [template] = await db
      .select()
      .from(gameTemplates)
      .where(eq(gameTemplates.id, game.templateId));
    if (template) return template.format as GameFormat;
  }

  // Infer from name
  const lowerName = game.name.toLowerCase();
  if (lowerName.includes("stroke")) return "stroke_play";
  if (lowerName.includes("best ball")) return "best_ball";
  if (lowerName.includes("skin")) return "skins";
  if (lowerName.includes("nassau")) return "nassau";
  return "custom";
}

/**
 * Stroke play: sum total strokes per player, rank lowest first.
 */
export function calculateStrokePlay(scores: ScoreRow[]) {
  const totals = new Map<string, number>();

  for (const s of scores) {
    totals.set(s.playerId, (totals.get(s.playerId) ?? 0) + s.strokes);
  }

  const standings = Array.from(totals.entries())
    .map(([playerId, totalStrokes]) => ({ playerId, totalStrokes }))
    .sort((a, b) => a.totalStrokes - b.totalStrokes);

  // Assign ranks (handle ties)
  let rank = 1;
  return standings.map((entry, i) => {
    if (i > 0 && entry.totalStrokes > standings[i - 1].totalStrokes) {
      rank = i + 1;
    }
    return { ...entry, rank };
  });
}

/**
 * Best ball: for each hole, take the best (lowest) score from each team.
 * Sum best scores per team across all holes.
 */
export function calculateBestBall(scores: ScoreRow[], teams: TeamDef[]) {
  if (teams.length === 0) {
    return { error: "Best ball requires teams" };
  }

  // Group scores by hole
  const byHole = new Map<number, ScoreRow[]>();
  for (const s of scores) {
    const existing = byHole.get(s.holeNumber) ?? [];
    existing.push(s);
    byHole.set(s.holeNumber, existing);
  }

  const teamResults = teams.map((team) => {
    let total = 0;
    const holeDetails: { holeNumber: number; bestScore: number; playerId: string }[] = [];

    for (const [holeNumber, holeScores] of byHole) {
      const teamScores = holeScores.filter((s) =>
        team.playerIds.includes(s.playerId)
      );
      if (teamScores.length > 0) {
        const best = teamScores.reduce((min, s) =>
          s.strokes < min.strokes ? s : min
        );
        total += best.strokes;
        holeDetails.push({
          holeNumber,
          bestScore: best.strokes,
          playerId: best.playerId,
        });
      }
    }

    return {
      teamName: team.name,
      playerIds: team.playerIds,
      totalBestBall: total,
      holes: holeDetails.sort((a, b) => a.holeNumber - b.holeNumber),
    };
  });

  return teamResults.sort((a, b) => a.totalBestBall - b.totalBestBall);
}

/**
 * Skins: each hole is worth one skin. A player wins the skin only if they
 * have the lowest score on that hole outright (no ties). Tied holes carry over.
 */
export function calculateSkins(scores: ScoreRow[]) {
  // Group scores by hole
  const byHole = new Map<number, ScoreRow[]>();
  for (const s of scores) {
    const existing = byHole.get(s.holeNumber) ?? [];
    existing.push(s);
    byHole.set(s.holeNumber, existing);
  }

  const holeNumbers = Array.from(byHole.keys()).sort((a, b) => a - b);
  const skinResults: { holeNumber: number; winner: string | null; carryover: boolean }[] = [];
  const skinCounts = new Map<string, number>();
  let carryoverCount = 0;

  for (const holeNumber of holeNumbers) {
    const holeScores = byHole.get(holeNumber) ?? [];
    if (holeScores.length === 0) continue;

    const minStrokes = Math.min(...holeScores.map((s) => s.strokes));
    const winners = holeScores.filter((s) => s.strokes === minStrokes);

    if (winners.length === 1) {
      // Outright winner — gets this skin plus any carryovers
      const winnerId = winners[0].playerId;
      const skinsWon = 1 + carryoverCount;
      skinCounts.set(winnerId, (skinCounts.get(winnerId) ?? 0) + skinsWon);
      skinResults.push({ holeNumber, winner: winnerId, carryover: false });
      carryoverCount = 0;
    } else {
      // Tie — no winner, skin carries over
      skinResults.push({ holeNumber, winner: null, carryover: true });
      carryoverCount++;
    }
  }

  const standings = Array.from(skinCounts.entries())
    .map(([playerId, skins]) => ({ playerId, skins }))
    .sort((a, b) => b.skins - a.skins);

  return {
    holes: skinResults,
    standings,
    unclaimedSkins: carryoverCount,
  };
}

/**
 * Nassau: three separate bets — front 9 (holes 1-9), back 9 (holes 10-18), overall (1-18).
 * Each is a stroke play competition.
 */
export function calculateNassau(scores: ScoreRow[]) {
  const front9 = scores.filter((s) => s.holeNumber >= 1 && s.holeNumber <= 9);
  const back9 = scores.filter((s) => s.holeNumber >= 10 && s.holeNumber <= 18);

  return {
    front9: calculateStrokePlay(front9),
    back9: calculateStrokePlay(back9),
    overall: calculateStrokePlay(scores),
  };
}
