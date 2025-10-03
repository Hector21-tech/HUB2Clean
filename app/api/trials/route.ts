import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiCache, dashboardCache, generateCacheKey } from '@/lib/api-cache'
import { trialService } from '@/modules/trials/services/trialService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    // Parse filter parameters
    const statusParam = searchParams.get('status')
    const search = searchParams.get('search')
    const playerId = searchParams.get('playerId')
    const requestId = searchParams.get('requestId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const statusFilter = statusParam ? statusParam.split(',') : undefined

    // Try cache first
    const cacheFilters = { status: statusParam, search, playerId, requestId, dateFrom, dateTo }
    const cacheKey = generateCacheKey('trials', tenant, cacheFilters)
    const cachedData = apiCache.get(cacheKey)

    if (cachedData) {
      const response = NextResponse.json({
        success: true,
        data: cachedData
      })
      response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30')
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    // Build where clause with filters
    const trials = await prisma.trial.findMany({
      where: {
        tenantId: tenant,

        // Status filter
        ...(statusFilter && statusFilter.length > 0 && {
          status: { in: statusFilter as any }
        }),

        // Player filter
        ...(playerId && { playerId }),

        // Request filter
        ...(requestId && { requestId }),

        // Date range filter
        ...(dateFrom && {
          scheduledAt: { gte: new Date(dateFrom) }
        }),
        ...(dateTo && {
          scheduledAt: { lte: new Date(dateTo) }
        }),

        // Search filter (player name, location, notes)
        ...(search && {
          OR: [
            { player: { firstName: { contains: search, mode: 'insensitive' } } },
            { player: { lastName: { contains: search, mode: 'insensitive' } } },
            { location: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            club: true,
            avatarPath: true,
            avatarUrl: true
          }
        },
        request: {
          select: {
            id: true,
            title: true,
            club: true,
            position: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    })

    // Cache the result
    apiCache.set(cacheKey, trials)

    const response = NextResponse.json({
      success: true,
      data: trials
    })
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30')
    response.headers.set('X-Cache', 'MISS')
    return response
  } catch (error) {
    console.error('Trials API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.scheduledAt || (!body.playerId && !body.requestId)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: scheduledAt and (playerId or requestId)' },
        { status: 400 }
      )
    }

    // 🎯 USE TRIAL SERVICE: This handles calendar event creation automatically
    const trialData = {
      ...body,
      scheduledAt: new Date(body.scheduledAt),
      status: body.status || 'SCHEDULED'
    }
    const trial = await trialService.createTrial(tenant, trialData)

    // Invalidate trials, events, AND dashboard cache (trial created calendar event)
    apiCache.invalidatePattern(`trials-${tenant}`)
    apiCache.invalidatePattern(`events-${tenant}`)
    dashboardCache.invalidate(generateCacheKey('dashboard', tenant))

    return NextResponse.json({
      success: true,
      data: trial
    })
  } catch (error) {
    console.error('Trial creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create trial' },
      { status: 500 }
    )
  }
}