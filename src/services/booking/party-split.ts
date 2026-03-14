/**
 * Party split algorithm for golf tee-time coordination.
 *
 * Splits a group of golfers into tee-time units respecting course max-players-per-group
 * rules, aiming for balanced group sizes to keep groups together on the course.
 *
 * Strategy: prefer balanced splits (e.g., 6 -> [3,3] not [4,2]) to keep
 * groups similar in size for better pace-of-play and social experience.
 */

const MIN_GOLFERS = 1;
const MAX_GOLFERS = 8;

/**
 * Compute how to split a party of golfers into tee-time groups.
 *
 * @param golferCount - Total number of golfers (1-8)
 * @param maxPlayers - Maximum players per tee time (typically 4)
 * @returns Array of group sizes, sorted descending
 * @throws Error if golferCount is out of range or maxPlayers < 1
 */
export function computePartySplit(
  golferCount: number,
  maxPlayers: number
): number[] {
  if (
    !Number.isInteger(golferCount) ||
    golferCount < MIN_GOLFERS ||
    golferCount > MAX_GOLFERS
  ) {
    throw new Error(
      `Golfer count must be an integer between ${MIN_GOLFERS} and ${MAX_GOLFERS}, got ${golferCount}`
    );
  }

  if (!Number.isInteger(maxPlayers) || maxPlayers < 1) {
    throw new Error(
      `Max players must be a positive integer, got ${maxPlayers}`
    );
  }

  // Single group fits within max
  if (golferCount <= maxPlayers) {
    return [golferCount];
  }

  // Calculate number of groups needed
  const numGroups = Math.ceil(golferCount / maxPlayers);

  // Distribute as evenly as possible
  const baseSize = Math.floor(golferCount / numGroups);
  const remainder = golferCount % numGroups;

  // Build groups: first `remainder` groups get baseSize+1, rest get baseSize
  const groups: number[] = [];
  for (let i = 0; i < numGroups; i++) {
    groups.push(i < remainder ? baseSize + 1 : baseSize);
  }

  return groups;
}

/**
 * Compute target tee times for each group, spaced at a fixed interval.
 *
 * @param baseTime - Start time in "HH:MM" format (24h)
 * @param groups - Array of group sizes from computePartySplit
 * @param intervalMinutes - Minutes between tee times (default 10)
 * @returns Array of target times in "HH:MM" format
 * @throws Error if baseTime format is invalid or intervalMinutes < 1
 */
export function computeTargetTimes(
  baseTime: string,
  groups: number[],
  intervalMinutes: number = 10
): string[] {
  if (!/^\d{2}:\d{2}$/.test(baseTime)) {
    throw new Error(
      `Base time must be in "HH:MM" format, got "${baseTime}"`
    );
  }

  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1) {
    throw new Error(
      `Interval must be a positive integer in minutes, got ${intervalMinutes}`
    );
  }

  const [hours, minutes] = baseTime.split(":").map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(
      `Invalid time values in "${baseTime}"`
    );
  }

  const baseMinutes = hours * 60 + minutes;

  return groups.map((_, index) => {
    const totalMinutes = baseMinutes + index * intervalMinutes;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });
}
