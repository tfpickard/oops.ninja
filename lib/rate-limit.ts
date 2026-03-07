const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identity: string, max = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(identity);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(identity, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: max - bucket.count };
}
