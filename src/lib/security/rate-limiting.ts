/**
 * 🛡️ Enterprise Rate Limiting
 *
 * Advanced rate limiting per tenant+user for DoS protection
 * Prevents abuse while allowing legitimate usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { Logger, createLogContext } from '@/lib/logger'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Different rate limits for different endpoint types
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // API endpoints - general
  'api': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    skipSuccessfulRequests: false
  },

  // Authentication endpoints - stricter
  'auth': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    skipSuccessfulRequests: true
  },

  // PDF generation - very strict
  'pdf': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 PDFs per minute per tenant+user
    skipSuccessfulRequests: false
  },

  // File uploads - moderate
  'upload': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 uploads per minute
    skipSuccessfulRequests: false
  },

  // Calendar operations - moderate
  'calendar': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 calendar operations per minute
    skipSuccessfulRequests: false
  },

  // Media proxy - high volume allowed
  'media': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 media requests per minute
    skipSuccessfulRequests: true // Don't count successful media loads
  },

  // Admin/security endpoints - very strict
  'admin': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    skipSuccessfulRequests: false
  }
}

// In-memory rate limiting store (would use Redis in production)
const rateLimitStore = new Map<string, {
  count: number
  resetTime: number
  firstRequest: number
}>()

/**
 * Generate rate limit key based on endpoint type, tenant, and user
 */
export function generateRateLimitKey(
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIGS,
  tenantId?: string,
  userId?: string
): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent')?.substring(0, 50) || 'unknown'

  // Include tenant and user for multi-tenant isolation
  const tenant = tenantId || 'global'
  const user = userId || ip

  // Create composite key for tenant+user isolation
  return `${type}:${tenant}:${user}:${ip}`
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  let record = rateLimitStore.get(key)

  // Clean up expired record or create new one
  if (!record || record.resetTime <= now) {
    record = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now
    }
    rateLimitStore.set(key, record)

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: record.resetTime
    }
  }

  // Increment count
  record.count++

  const remaining = Math.max(0, config.maxRequests - record.count)
  const allowed = record.count <= config.maxRequests

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: record.resetTime,
    retryAfter: allowed ? undefined : Math.ceil((record.resetTime - now) / 1000)
  }
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIGS,
  options: {
    tenantId?: string
    userId?: string
    skipOnSuccess?: boolean
  } = {}
): RateLimitResult | null {
  const config = RATE_LIMIT_CONFIGS[type]
  if (!config) {
    return null
  }

  const key = generateRateLimitKey(request, type, options.tenantId, options.userId)
  const result = checkRateLimit(key, config)

  // Log rate limit violations
  if (!result.allowed) {
    const context = createLogContext(request, options.tenantId, options.userId)

    Logger.security('Rate limit exceeded', {
      ...context,
      status: 429,
      details: {
        type,
        limit: result.limit,
        resetTime: new Date(result.resetTime).toISOString(),
        retryAfter: result.retryAfter
      }
    })
  }

  return result
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message?: string
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: message || 'Rate limit exceeded. Please try again later.',
      details: {
        limit: result.limit,
        remaining: result.remaining,
        resetTime: new Date(result.resetTime).toISOString(),
        retryAfter: result.retryAfter
      }
    },
    { status: 429 }
  )

  // Add standard rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString())

  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }

  // Prevent caching of rate limit responses
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

  return response
}

/**
 * Clean up expired rate limit records
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  const expired: string[] = []

  Array.from(rateLimitStore.entries()).forEach(([key, record]) => {
    if (record.resetTime <= now) {
      expired.push(key)
    }
  })

  for (const key of expired) {
    rateLimitStore.delete(key)
  }

  Logger.info('Rate limit store cleanup completed', {
    path: '/internal/cleanup',
    method: 'INTERNAL',
    status: 200,
    details: {
      expiredRecords: expired.length,
      activeRecords: rateLimitStore.size
    }
  })
}

/**
 * Get rate limit status for monitoring
 */
export function getRateLimitStats(): {
  totalKeys: number
  activeWindows: number
  topEndpoints: Array<{ pattern: string; count: number }>
} {
  const now = Date.now()
  const patterns = new Map<string, number>()
  let activeWindows = 0

  Array.from(rateLimitStore.entries()).forEach(([key, record]) => {
    if (record.resetTime > now) {
      activeWindows++

      // Extract pattern from key (type:tenant:user:ip)
      const pattern = key.split(':')[0]
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1)
    }
  })

  const topEndpoints = Array.from(patterns.entries())
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalKeys: rateLimitStore.size,
    activeWindows,
    topEndpoints
  }
}

/**
 * Determine rate limit type based on request path
 */
export function getRateLimitType(pathname: string): keyof typeof RATE_LIMIT_CONFIGS {
  if (pathname.includes('/api/generate-player-pdf')) {
    return 'pdf'
  }

  if (pathname.includes('/api/media/upload') || pathname.includes('/upload')) {
    return 'upload'
  }

  if (pathname.includes('/api/media/avatar-proxy') || pathname.includes('/api/media/')) {
    return 'media'
  }

  if (pathname.includes('/api/calendar/')) {
    return 'calendar'
  }

  if (pathname.includes('/api/security/') || pathname.includes('/api/db-monitor')) {
    return 'admin'
  }

  if (pathname.includes('/auth') || pathname.includes('/login') || pathname.includes('/signup')) {
    return 'auth'
  }

  if (pathname.startsWith('/api/')) {
    return 'api'
  }

  return 'api' // Default
}