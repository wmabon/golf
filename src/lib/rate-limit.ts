import { redis } from "./redis";

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Sliding window rate limiter using Redis.
 * Key format: "rl:{prefix}:{identifier}"
 */
export async function checkRateLimit(
  prefix: string,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rl:${prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  const pipeline = redis.pipeline();
  // Remove old entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);
  // Count current entries
  pipeline.zcard(key);
  // Add the current request
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  // Set expiry on the key
  pipeline.expire(key, config.windowSeconds);

  const results = await pipeline.exec();
  const currentCount = (results?.[1]?.[1] as number) ?? 0;

  const allowed = currentCount < config.limit;
  const remaining = Math.max(0, config.limit - currentCount - (allowed ? 1 : 0));
  const resetAt = new Date(now + config.windowSeconds * 1000);

  // If not allowed, remove the entry we just added
  if (!allowed) {
    await redis.zremrangebyscore(key, now, now + 1);
  }

  return { allowed, remaining, resetAt };
}
