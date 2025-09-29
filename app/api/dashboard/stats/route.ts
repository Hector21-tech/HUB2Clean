import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes - much longer cache

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

    // Check cache first
    const cacheKey = `dashboard-${tenant}`
    const cached = cache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      })
    }

    // Verify tenant exists
    const tenantExists = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenant },
          { slug: tenant }
        ]
      }
    })

    if (!tenantExists) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const tenantId = tenantExists.id

    // Get date boundaries for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // ULTRA-FAST: Only essential counts first - detailed data loaded separately
    const [
      totalPlayers,
      totalRequests,
      activeRequests,
      totalTrials,
      upcomingTrials
    ] = await Promise.all([
      // Essential counts only - fastest possible queries
      prisma.player.count({ where: { tenantId } }),
      prisma.request.count({ where: { tenantId } }),
      prisma.request.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.trial.count({ where: { tenantId } }),
      prisma.trial.count({ where: { tenantId, status: 'SCHEDULED', scheduledAt: { gte: now } } })
    ])

    // Return immediate basic stats for instant UI
    const basicStats = {
      overview: {
        totalPlayers,
        totalRequests,
        totalTrials,
        successRate: 0 // Calculate later
      },
      players: {
        total: totalPlayers,
        thisMonth: 0, // Calculate later
        growth: 0, // Calculate later
        byPosition: {},
        recent: []
      },
      requests: {
        total: totalRequests,
        active: activeRequests,
        byStatus: {},
        byCountry: {},
        recent: []
      },
      trials: {
        total: totalTrials,
        upcoming: upcomingTrials,
        completed: 0, // Calculate later
        pendingEvaluations: 0,
        next7Days: 0,
        successRate: 0,
        recent: []
      },
      transferWindows: {
        active: 0,
        upcoming: 0,
        expiring: 0
      },
      alerts: [{
        type: 'info' as const,
        message: 'Dashboard loaded! Detailed analytics loading...'
      }],
      lastUpdated: now.toISOString(),
      loading: true // Flag to indicate more data is coming
    }

    // For immediate response, return basic stats and load detailed data in background
    if (request.url.includes('fast=1')) {
      cache.set(cacheKey, { data: basicStats, timestamp: Date.now() })
      return NextResponse.json({
        success: true,
        data: basicStats,
        message: 'Fast mode - basic stats only'
      })
    }

    // Load detailed data only when needed
    const [
      playersThisMonth,
      playersLastMonth,
      completedTrials,
      trialsNext7Days,
      completedTrialsWithRating,
      recentPlayers
    ] = await Promise.all([
      prisma.player.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      prisma.player.count({ where: { tenantId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.trial.count({ where: { tenantId, status: 'COMPLETED' } }),
      prisma.trial.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
          scheduledAt: { gte: now, lte: next7Days }
        }
      }),
      prisma.trial.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          rating: { not: null }
        }
      }),
      // Only get recent players, skip other heavy queries for now
      prisma.player.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3, // Reduced from 5
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          club: true,
          rating: true,
          createdAt: true
        }
      })
    ])

    // Calculate growth rate and success rate
    const growth = playersLastMonth > 0
      ? Math.round(((playersThisMonth - playersLastMonth) / playersLastMonth) * 100)
      : playersThisMonth > 0 ? 100 : 0

    const successRate = completedTrials > 0
      ? Math.round((completedTrialsWithRating / completedTrials) * 100)
      : 0

    // Generate smart alerts based on data
    const alerts: Array<{ type: 'info' | 'warning' | 'error', message: string }> = []

    if (activeRequests > 10) {
      alerts.push({
        type: 'warning',
        message: `High workload: ${activeRequests} active requests`
      })
    }

    if (trialsNext7Days === 0 && upcomingTrials > 0) {
      alerts.push({
        type: 'info',
        message: 'No trials scheduled for next 7 days'
      })
    }

    if (successRate < 50 && completedTrials > 5) {
      alerts.push({
        type: 'warning',
        message: `Trial success rate: ${successRate}% (needs improvement)`
      })
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        message: '✅ Dashboard loaded - all systems running smoothly!'
      })
    }

    // Streamlined data structure - minimal for speed
    const stats: DashboardStats = {
      overview: {
        totalPlayers,
        totalRequests,
        totalTrials,
        successRate
      },
      players: {
        total: totalPlayers,
        thisMonth: playersThisMonth,
        growth,
        byPosition: {}, // Skip for now
        recent: recentPlayers.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString()
        }))
      },
      requests: {
        total: totalRequests,
        active: activeRequests,
        byStatus: {}, // Skip for now
        byCountry: {}, // Skip for now
        recent: [] // Skip for now
      },
      trials: {
        total: totalTrials,
        upcoming: upcomingTrials,
        completed: completedTrials,
        pendingEvaluations: Math.max(0, completedTrials - completedTrialsWithRating),
        next7Days: trialsNext7Days,
        successRate,
        recent: [] // Skip for now
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

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}