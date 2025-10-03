import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiCache, generateCacheKey } from '@/lib/api-cache'

interface CalendarEventConflict {
  id: string
  title: string
  startTime: string
  endTime: string
}

interface CreateEventInput {
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  type: 'TRIAL' | 'MEETING' | 'MATCH' | 'TRAINING' | 'SCOUTING' | 'OTHER'
  isAllDay?: boolean
  recurrence?: string
}

// GET /api/calendar/events - Fetch calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const type = searchParams.get('type')
    const fastMode = searchParams.get('fast') === '1'

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    // FAST MODE: Use tenant ID directly for cache check
    let tenantId = tenant

    // Try cache FIRST (before tenant verification for speed)
    const cacheFilters = { start, end, type }
    const cacheKey = generateCacheKey('events', tenantId, cacheFilters)
    const cachedData = apiCache.get(cacheKey)

    if (cachedData) {
      const response = NextResponse.json({
        success: true,
        data: cachedData
      })
      // ⚡ SHORT CACHE: 30s for instant trial/event sync
      response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=10')
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    // ONLY verify tenant if cache miss and not fast mode with ID
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

    // Build where clause
    const whereClause: any = { tenantId }

    // Add date range filter if provided
    if (start && end) {
      whereClause.OR = [
        {
          // Events that start within the range
          startTime: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        {
          // Events that end within the range
          endTime: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        {
          // Events that span the entire range
          AND: [
            { startTime: { lte: new Date(start) } },
            { endTime: { gte: new Date(end) } }
          ]
        }
      ]
    }

    // Add type filter if provided
    if (type) {
      whereClause.type = type
    }

    // HYPER-OPTIMIZED: Fetch events with minimal data, avoid deep JOINs
    const startTime = Date.now()

    // Query 1: Get events WITHOUT trial details (fast)
    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      select: {
        id: true,
        tenantId: true,
        trialId: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        location: true,
        type: true,
        isAllDay: true,
        recurrence: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { startTime: 'asc' }
    })

    // Query 2: ONLY fetch trial details if events have trials (conditional)
    const eventTrialIds = events.filter(e => e.trialId).map(e => e.trialId as string)
    let trialsMap = new Map()

    if (eventTrialIds.length > 0) {
      const trials = await prisma.trial.findMany({
        where: { id: { in: eventTrialIds } },
        select: {
          id: true,
          status: true,
          rating: true,
          playerId: true,
          requestId: true,
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
      trialsMap = new Map(trials.map(t => [t.id, t]))
    }

    const queryDuration = Date.now() - startTime
    console.log(`⚡ Calendar events: ${events.length} events (${eventTrialIds.length} with trials) fetched in ${queryDuration}ms`)

    // Transform events to match frontend interface
    const transformedEvents = events.map(event => {
      const trial = event.trialId ? trialsMap.get(event.trialId) : null

      return {
        id: event.id,
        tenantId: event.tenantId,
        title: event.title,
        description: event.description,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        location: event.location,
        type: event.type,
        isAllDay: event.isAllDay,
        recurrence: event.recurrence,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        trialId: event.trialId,
        trial: trial ? {
          id: trial.id,
          status: trial.status,
          rating: trial.rating,
          player: trial.player,
          request: trial.request
        } : null
      }
    })

    // Cache the result
    apiCache.set(cacheKey, transformedEvents)

    const response = NextResponse.json({
      success: true,
      data: transformedEvents
    })
    // ⚡ SHORT CACHE: 30s for instant trial/event sync
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=10')
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('X-Query-Duration', `${queryDuration}ms`)
    return response

  } catch (error) {
    console.error('Calendar events GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

// POST /api/calendar/events - Create calendar event
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

    // Optimized tenant verification with minimal select
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
    const body: CreateEventInput = await request.json()

    // Validate required fields
    if (!body.title || !body.startTime || !body.endTime || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, startTime, endTime, type' },
        { status: 400 }
      )
    }

    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    // Validate dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Check for conflicts (events overlapping in time)
    const conflicts = await prisma.calendarEvent.findMany({
      where: {
        tenantId,
        OR: [
          {
            // Events that start during this event
            startTime: {
              gte: startTime,
              lt: endTime
            }
          },
          {
            // Events that end during this event
            endTime: {
              gt: startTime,
              lte: endTime
            }
          },
          {
            // Events that completely span this event
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true
      }
    })

    // Create the event
    const newEvent = await prisma.calendarEvent.create({
      data: {
        tenantId,
        title: body.title,
        description: body.description,
        startTime,
        endTime,
        location: body.location,
        type: body.type,
        isAllDay: body.isAllDay || false,
        recurrence: body.recurrence
      }
    })

    // Transform conflicts to match interface
    const eventConflicts: CalendarEventConflict[] = conflicts.map(conflict => ({
      id: conflict.id,
      title: conflict.title,
      startTime: conflict.startTime.toISOString(),
      endTime: conflict.endTime.toISOString()
    }))

    const transformedEvent = {
      id: newEvent.id,
      tenantId: newEvent.tenantId,
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime.toISOString(),
      endTime: newEvent.endTime.toISOString(),
      location: newEvent.location,
      type: newEvent.type,
      isAllDay: newEvent.isAllDay,
      recurrence: newEvent.recurrence,
      createdAt: newEvent.createdAt.toISOString(),
      updatedAt: newEvent.updatedAt.toISOString(),
      trialId: newEvent.trialId,
      trial: null
    }

    // Invalidate all event caches for this tenant
    apiCache.invalidatePattern(`events-${tenant}`)

    return NextResponse.json({
      success: true,
      data: transformedEvent,
      conflicts: eventConflicts.length > 0 ? eventConflicts : undefined
    })

  } catch (error) {
    console.error('Calendar events POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}