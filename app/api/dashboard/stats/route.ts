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

// Simple in-memory cache for dashboard stats
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

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

    // Optimized data fetching - essential queries first
    const [
      totalPlayers,
      playersThisMonth,
      playersLastMonth,
      totalRequests,
      activeRequests,
      totalTrials,
      upcomingTrials,
      completedTrials,
      trialsNext7Days,
      completedTrialsWithRating
    ] = await Promise.all([
      // Essential counts only
      prisma.player.count({ where: { tenantId } }),
      prisma.player.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      prisma.player.count({ where: { tenantId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

      // Requests data
      prisma.request.count({ where: { tenantId } }),
      prisma.request.count({ where: { tenantId, status: 'OPEN' } }),

      // Trials data
      prisma.trial.count({ where: { tenantId } }),
      prisma.trial.count({ where: { tenantId, status: 'SCHEDULED', scheduledAt: { gte: now } } }),
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
      })
    ])

    // Secondary batch for detailed data (optional for better performance)
    const [
      playersByPosition,
      recentPlayers,
      requestsByStatus,
      requestsByCountry,
      recentRequests,
      recentTrials
    ] = await Promise.all([
      prisma.player.groupBy({
        by: ['position'],
        where: { tenantId, position: { not: null } },
        _count: { position: true }
      }),
      prisma.player.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          club: true,
          rating: true,
          createdAt: true
        }
      }),
      prisma.request.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true }
      }),
      prisma.request.groupBy({
        by: ['country'],
        where: { tenantId, country: { not: '' } },
        _count: { country: true }
      }),
      prisma.request.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3, // Reduced from 5 for performance
        select: {
          id: true,
          title: true,
          club: true,
          country: true,
          status: true,
          priority: true,
          createdAt: true
        }
      }),
      prisma.trial.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3, // Reduced from 5 for performance
        include: {
          player: {
            select: {
              firstName: true,
              lastName: true,
              position: true
            }
          }
        }
      })
    ])

    // Calculate growth rate
    const growth = playersLastMonth > 0
      ? Math.round(((playersThisMonth - playersLastMonth) / playersLastMonth) * 100)
      : playersThisMonth > 0 ? 100 : 0

    // Calculate success rate
    const successRate = completedTrials > 0
      ? Math.round((completedTrialsWithRating / completedTrials) * 100)
      : 0

    // Transform grouped data to records
    const positionCounts: Record<string, number> = {}
    playersByPosition.forEach(item => {
      if (item.position) {
        positionCounts[item.position] = item._count.position
      }
    })

    const statusCounts: Record<string, number> = {}
    requestsByStatus.forEach(item => {
      statusCounts[item.status] = item._count.status
    })

    const countryCounts: Record<string, number> = {}
    requestsByCountry.forEach(item => {
      countryCounts[item.country] = item._count.country
    })

    // Generate alerts based on data
    const alerts: Array<{ type: 'info' | 'warning' | 'error', message: string }> = []

    if (activeRequests > 10) {
      alerts.push({
        type: 'warning',
        message: `High number of active requests (${activeRequests}) - consider prioritizing`
      })
    }

    if (trialsNext7Days === 0 && upcomingTrials > 0) {
      alerts.push({
        type: 'info',
        message: 'No trials scheduled for the next 7 days'
      })
    }

    if (successRate < 50 && completedTrials > 5) {
      alerts.push({
        type: 'warning',
        message: `Trial success rate is below 50% (${successRate}%)`
      })
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        message: 'All systems running smoothly - great work!'
      })
    }

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
        byPosition: positionCounts,
        recent: recentPlayers.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString()
        }))
      },
      requests: {
        total: totalRequests,
        active: activeRequests,
        byStatus: statusCounts,
        byCountry: countryCounts,
        recent: recentRequests.map(r => ({
          ...r,
          title: r.title || 'Untitled Request',
          createdAt: r.createdAt.toISOString()
        }))
      },
      trials: {
        total: totalTrials,
        upcoming: upcomingTrials,
        completed: completedTrials,
        pendingEvaluations: completedTrials - completedTrialsWithRating,
        next7Days: trialsNext7Days,
        successRate,
        recent: recentTrials.map(t => ({
          id: t.id,
          scheduledAt: t.scheduledAt.toISOString(),
          location: t.location,
          status: t.status,
          rating: t.rating,
          createdAt: t.createdAt.toISOString(),
          player: t.player
        }))
      },
      transferWindows: {
        active: 0, // TODO: Implement transfer window logic
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