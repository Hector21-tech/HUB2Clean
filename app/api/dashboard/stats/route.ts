import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dashboardCache, generateCacheKey } from '@/lib/api-cache'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')
    const fastMode = searchParams.get('fast') === '1'

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    // FAST MODE: Skip tenant verification, use ID directly for cache check
    let tenantId = tenant

    // Try cache first (BEFORE tenant verification for speed)
    const cacheKey = generateCacheKey('dashboard', tenantId)
    const cachedData = dashboardCache.get(cacheKey)

    if (cachedData) {
      const response = NextResponse.json({
        success: true,
        data: cachedData
      })
      // Extended cache headers: 5min browser cache, 5min edge cache
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600')
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Cache-Time', cachedData.lastUpdated)
      return response
    }

    // ONLY verify tenant if cache miss and not already an ID
    if (!fastMode || !tenant.startsWith('cmf')) {
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

      tenantId = tenantExists.id
    }

    // HYPER-OPTIMIZED: Only 2 parallel queries using $transaction for atomicity
    const now = new Date()
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const startTime = Date.now()

    // Execute all queries in a single transaction for better connection reuse
    const [
      countsData,
      upcomingTrialsCount
    ] = await prisma.$transaction([
      // Query 1: Get all counts in parallel using aggregate (FASTEST method)
      prisma.$queryRaw<Array<{ entity: string; total: number }>>`
        SELECT 'players' as entity, COUNT(*)::int as total FROM players WHERE "tenantId" = ${tenantId}
        UNION ALL
        SELECT 'requests' as entity, COUNT(*)::int as total FROM requests WHERE "tenantId" = ${tenantId}
        UNION ALL
        SELECT 'requests_active' as entity, COUNT(*)::int as total FROM requests
        WHERE "tenantId" = ${tenantId}
        AND status NOT IN ('COMPLETED', 'CANCELLED')
        UNION ALL
        SELECT 'trials' as entity, COUNT(*)::int as total FROM trials WHERE "tenantId" = ${tenantId}
        UNION ALL
        SELECT 'trials_completed' as entity, COUNT(*)::int as total FROM trials WHERE "tenantId" = ${tenantId} AND status = 'COMPLETED'
      `,

      // Query 2: Upcoming trials with optimized index usage
      prisma.trial.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
          scheduledAt: { gte: now, lte: next7Days }
        }
      })
    ])

    // Extract counts from raw query results
    const countsMap = new Map(countsData.map(row => [row.entity, row.total]))
    const totalPlayers = countsMap.get('players') || 0
    const totalRequests = countsMap.get('requests') || 0
    const activeRequests = countsMap.get('requests_active') || 0
    const totalTrials = countsMap.get('trials') || 0
    const completedTrials = countsMap.get('trials_completed') || 0
    const upcomingTrials = upcomingTrialsCount

    const queryDuration = Date.now() - startTime
    console.log('⚡ Dashboard stats: 2 queries completed in', queryDuration, 'ms (HYPER-OPTIMIZED with raw SQL)')

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

    // Cache the result for 5 minutes
    dashboardCache.set(cacheKey, stats)

    const response = NextResponse.json({
      success: true,
      data: stats
    })
    // Extended cache headers: 5min browser cache, 5min edge cache, 10min stale-while-revalidate
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600')
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('X-Query-Duration', `${queryDuration}ms`)
    return response

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}