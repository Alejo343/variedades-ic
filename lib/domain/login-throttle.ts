// Brake on password guessing for the public sync login (sub-paso 5): after
// `maxFailures` failed attempts for one username inside `windowMs`, further
// attempts are refused until the oldest counted failure leaves the window.
// In memory on purpose — the app runs as a single PM2 process; a restart
// simply forgets the counters.

export type ThrottleCheck = { allowed: true } | { allowed: false; retryAfterMs: number };

export function createLoginThrottle({ maxFailures, windowMs }: { maxFailures: number; windowMs: number }) {
  const failures = new Map<string, number[]>();

  function recent(key: string, now: number): number[] {
    const kept = (failures.get(key) ?? []).filter((t) => now - t < windowMs);
    if (kept.length) failures.set(key, kept);
    else failures.delete(key);
    return kept;
  }

  return {
    check(key: string, now: number): ThrottleCheck {
      const kept = recent(key, now);
      if (kept.length < maxFailures) return { allowed: true };
      // Allowed again once enough failures expire to drop below the limit.
      return { allowed: false, retryAfterMs: kept[kept.length - maxFailures] + windowMs - now };
    },
    recordFailure(key: string, now: number) {
      failures.set(key, [...recent(key, now), now]);
    },
    reset(key: string) {
      failures.delete(key);
    },
  };
}
