import { NextRequest } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max number of unique tokens per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

// In-memory store for rate limiting
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Prefer Cloudflare's IP if available (Vercel uses Cloudflare)
  if (cfConnectingIp) return cfConnectingIp
  
  // Use first IP from forwarded header
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[0].trim()
  }
  
  // Fallback to real-ip header
  if (realIp) return realIp
  
  // Last resort: use a combination of headers to create a unique identifier
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  return `${userAgent}-${acceptLanguage}`.slice(0, 100)
}

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  }
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request)
  const now = Date.now()
  const resetTime = now + config.interval
  
  // Get or create rate limit entry
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.resetTime < now) {
    // New entry or expired
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      limit: config.uniqueTokenPerInterval,
      remaining: config.uniqueTokenPerInterval - 1,
      reset: new Date(resetTime),
    }
  }
  
  // Check if limit exceeded
  if (entry.count >= config.uniqueTokenPerInterval) {
    return {
      success: false,
      limit: config.uniqueTokenPerInterval,
      remaining: 0,
      reset: new Date(entry.resetTime),
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(identifier, entry)
  
  return {
    success: true,
    limit: config.uniqueTokenPerInterval,
    remaining: config.uniqueTokenPerInterval - entry.count,
    reset: new Date(entry.resetTime),
  }
}

// Different rate limits for different endpoints
export const rateLimits = {
  // Standard API endpoints
  api: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  },
  
  // More restrictive for expensive operations
  analyze: {
    interval: 60 * 1000, // 1 minute  
    uniqueTokenPerInterval: 15, // 15 analyses per minute
  },
  
  // Very restrictive for batch operations
  batch: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 batch operations per minute
  },
  
  // Lenient for read operations
  read: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 reads per minute
  }
}

// Helper to create rate limit headers
export function getRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.reset.toISOString())
  return headers
}

// Middleware helper for API routes
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<Response>,
  config?: RateLimitConfig
): Promise<Response> {
  const result = await rateLimit(request, config)
  
  if (!result.success) {
    return new Response(
      JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: result.reset 
      }),
      { 
        status: 429,
        headers: {
          ...Object.fromEntries(getRateLimitHeaders(result).entries()),
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  // Add rate limit headers to successful response
  const response = await handler()
  const headers = getRateLimitHeaders(result)
  
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  
  return response
}