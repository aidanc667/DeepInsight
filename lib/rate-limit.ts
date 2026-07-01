// Persistent rate limiter backed by Upstash Redis.
// Falls back to a permissive stub when env vars aren't set (local dev / CI).

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

let limiter: Ratelimit | null = null

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter

  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  limiter = new Ratelimit({
    redis:   new Redis({ url, token }),
    // 40 research runs per user per 24-hour sliding window — cross-instance, persistent
    limiter: Ratelimit.slidingWindow(40, '24 h'),
    prefix:  'di:rl',
  })
  return limiter
}

export async function checkRateLimit(key: string): Promise<boolean> {
  const rl = getLimiter()
  if (!rl) return true  // env vars not set — allow (local dev)
  const { success } = await rl.limit(key)
  return success
}
