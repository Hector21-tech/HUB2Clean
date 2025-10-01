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

    // Verify tenant
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
  }
}