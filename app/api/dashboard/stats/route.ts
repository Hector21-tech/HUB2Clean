import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface DashboardStats {
  overview: {
    totalPlayers: number
    totalRequests: number
    totalTrials: number
    successRate: number
  }
  players: {
    total: number
    thisMonth: number
    growth: number
    byPosition: Record<string, number>
    recent: Array<{
      id: string
      firstName: string
      lastName: string
      position: string | null
      club: string | null
      rating: number | null
      createdAt: string
    }>
  }
  requests: {
    total: number
    active: number
    byStatus: Record<string, number>
    byCountry: Record<string, number>
    recent: Array<{
      id: string
      title: string
      club: string
      country: string | null
      status: string
      priority: string
      createdAt: string
    }>
  }
  trials: {
    total: number
    upcoming: number
    completed: number
    pendingEvaluations: number
    next7Days: number
    successRate: number
    recent: Array<{
      id: string
      scheduledAt: string
      location: string | null
      status: string
      rating: number | null
      createdAt: string
      player: {
        firstName: string
        lastName: string
        position: string | null
      } | null
    }>
  }
  transferWindows: {
    active: number
    upcoming: number
    expiring: number
  }
  alerts: Array<{
    type: 'info' | 'warning' | 'error'
    message: string
  }>
  lastUpdated: string
}

// Aggressive caching for dashboard stats
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes - extended for better performance

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    // Check cache first - IMMEDIATE RETURN for cached data (skip tenant check)
    const cacheKey = `dashboard-${tenant}`
    const cached = cache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Dashboard stats: Returning cached data (age:', Math.round((Date.now() - cached.timestamp) / 1000), 's)')
      const response = NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
      })

      // HTTP caching headers for browser cache (works in serverless!)
      response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600')
      return response
    }

    // Only verify tenant on cache miss
    const tenantExists = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenant },
          { slug: tenant }
        ]
      },
      select: { id: true } // Minimal select for speed
    })

    if (!tenantExists) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const tenantId = tenantExists.id
    console.log('⚡ Dashboard stats: Cache miss, fetching fresh data for tenant:', tenantId)

    // ULTRA-OPTIMIZED: Only 6 essential counts - no aggregations or heavy queries
    const now = new Date()
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const startTime = Date.now()

    const [
      totalPlayers,
      totalRequests,
      activeRequests,
      totalTrials,
      upcomingTrials,
      completedTrials
    ] = await Promise.all([
      // ONLY ESSENTIAL COUNTS - fastest possible queries
      prisma.player.count({ where: { tenantId } }),
      prisma.request.count({ where: { tenantId } }),
      prisma.request.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.trial.count({ where: { tenantId } }),
      prisma.trial.count({ where: { tenantId, status: 'SCHEDULED', scheduledAt: { gte: now, lte: next7Days } } }),
      prisma.trial.count({ where: { tenantId, status: 'COMPLETED' } })
    ])

    const queryDuration = Date.now() - startTime
    console.log('⚡ Dashboard stats: Queries completed in', queryDuration, 'ms')

    // Simple success rate calculation (no additional queries needed)
    const successRate = completedTrials > 0 ? Math.round((completedTrials / totalTrials) * 100) : 0

    // Generate minimal alerts
    const alerts: Array<{ type: 'info' | 'warning' | 'error', message: string }> = []

    if (activeRequests > 10) {
      alerts.push({
        type: 'warning',
        message: `High workload: ${activeRequests} active requests`
      })
    }

    if (upcomingTrials === 0 && totalTrials > 0) {
      alerts.push({
        type: 'info',
        message: 'No upcoming trials scheduled'
      })
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        message: '✅ All systems running smoothly!'
      })
    }

    // STREAMLINED response - ONLY essential data for fast loading
    const stats: DashboardStats = {
      overview: {
        totalPlayers,
        totalRequests,
        totalTrials,
        successRate
      },
      players: {
        total: totalPlayers,
        thisMonth: 0, // Removed for performance
        growth: 0, // Removed for performance
        byPosition: {}, // Removed for performance
        recent: [] // Removed for performance
      },
      requests: {
        total: totalRequests,
        active: activeRequests,
        byStatus: {}, // Removed for performance
        byCountry: {}, // Removed for performance
        recent: [] // Removed for performance
      },
      trials: {
        total: totalTrials,
        upcoming: upcomingTrials,
        completed: completedTrials,
        pendingEvaluations: 0, // Removed for performance
        next7Days: upcomingTrials, // Simplified
        successRate,
        recent: [] // Removed for performance
      },
      transferWindows: {
        active: 0,
        upcoming: 0,
        expiring: 0
      },
      alerts,
      lastUpdated: now.toISOString()
    }

    // Cache the result
    cache.set(cacheKey, { data: stats, timestamp: Date.now() })

    const response = NextResponse.json({
      success: true,
      data: stats
    })

    // HTTP caching headers for browser cache (30 min cache, 1 hour stale-while-revalidate)
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600')

    return response

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}