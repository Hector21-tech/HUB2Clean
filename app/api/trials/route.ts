import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiCache, dashboardCache, generateCacheKey } from '@/lib/api-cache'

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

    // Create trial and calendar event in a transaction
    const trial = await prisma.$transaction(async (tx) => {
      // Create the trial first
      const newTrial = await tx.trial.create({
        data: {
          ...body,
          tenantId: tenant,
          scheduledAt: new Date(body.scheduledAt),
          status: body.status || 'SCHEDULED'
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
        }
      })

      // Create calendar event for the trial
      const playerName = newTrial.player
        ? `${newTrial.player.firstName} ${newTrial.player.lastName}`
        : 'Unknown Player'

      const eventTitle = `Trial: ${playerName}`
      const eventDescription = newTrial.request
        ? `Trial for ${newTrial.request.title || 'player request'} from ${newTrial.request.club}`
        : `Trial for ${playerName}`

      await tx.calendarEvent.create({
        data: {
          tenantId: tenant,
          trialId: newTrial.id,
          title: eventTitle,
          description: eventDescription,
          startTime: new Date(body.scheduledAt),
          endTime: new Date(new Date(body.scheduledAt).getTime() + 2 * 60 * 60 * 1000), // 2 hours duration
          type: 'TRIAL',
          location: body.location || 'Training Ground',
          isAllDay: false
        }
      })

      return newTrial
    })

    // Invalidate both trials cache AND dashboard cache
    apiCache.invalidatePattern(`trials-${tenant}`)
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