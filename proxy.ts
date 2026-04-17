import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isAiRoute = createRouteMatcher([
  '/api/research(.*)',
  '/api/clarify(.*)',
  '/api/classify(.*)',
])

// Lazy-init: app still boots if Upstash env vars aren't configured yet
let ratelimit: Ratelimit | null = null
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'deepinsight:rl',
  })
  return ratelimit
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  if (isAiRoute(req)) {
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 50_000) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rl = getRatelimit()
    if (rl) {
      const { userId } = await auth()
      if (userId) {
        const { success, limit, remaining } = await rl.limit(userId)
        if (!success) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Try again in a moment.' }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
              },
            },
          )
        }
      }
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
