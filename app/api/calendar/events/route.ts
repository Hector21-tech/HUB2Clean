import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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

// Aggressive caching for calendar events
const cache = new Map<string, { data: any, timestamp: number, etag: string }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes - shorter than dashboard for real-time updates

// Generate ETag from data content for conditional caching
function generateETag(data: any): string {
  const hash = crypto.createHash('md5')
  hash.update(JSON.stringify(data))
  return `"${hash.digest('hex')}"`
}

// GET /api/calendar/events - Fetch calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const type = searchParams.get('type')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    // Create cache key including all query params for accurate caching
    const cacheKey = `events-${tenant}-${start}-${end}-${type || 'all'}`
    const cached = cache.get(cacheKey)

    // Check conditional caching headers (ETag)
    const ifNoneMatch = request.headers.get('if-none-match')

    // IMMEDIATE RETURN for cached data (skip tenant check)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      // Check if client has same ETag (304 Not Modified)
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        console.log('⚡ Calendar events: 304 Not Modified (ETag match)')
        const response = new NextResponse(null, { status: 304 })
        response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600, stale-if-error=600')
        response.headers.set('ETag', cached.etag)
        response.headers.set('Last-Modified', new Date(cached.timestamp).toUTCString())
        return response
      }

      console.log('📦 Calendar events: Returning cached data (age:', Math.round((Date.now() - cached.timestamp) / 1000), 's)')
      const response = NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
      })

      // HTTP caching headers for browser cache (5 min cache, 10 min stale-while-revalidate)
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600, stale-if-error=600')
      response.headers.set('ETag', cached.etag)
      response.headers.set('Last-Modified', new Date(cached.timestamp).toUTCString())
      return response
    }

    // Only verify tenant on cache miss - optimized with minimal select
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
    console.log('⚡ Calendar events: Cache miss, fetching fresh data for tenant:', tenantId)

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

    // Fetch events with related trial data
    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      include: {
        trial: {
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
        }
      },
      orderBy: { startTime: 'asc' }
    })

    // Transform events to match frontend interface
    const transformedEvents = events.map(event => ({
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
      trial: event.trial ? {
        id: event.trial.id,
        status: event.trial.status,
        rating: event.trial.rating,
        player: event.trial.player,
        request: event.trial.request
      } : null
    }))

    // Generate ETag from events data
    const etag = generateETag(transformedEvents)
    const timestamp = Date.now()

    // Cache the result for subsequent requests with ETag
    cache.set(cacheKey, { data: transformedEvents, timestamp, etag })
    console.log('✅ Calendar events: Cached', transformedEvents.length, 'events for', CACHE_DURATION / 1000, 'seconds')

    const response = NextResponse.json({
      success: true,
      data: transformedEvents
    })

    // HTTP caching headers for browser cache (5 min cache, 10 min stale-while-revalidate)
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600, stale-if-error=600')
    response.headers.set('ETag', etag)
    response.headers.set('Last-Modified', new Date(timestamp).toUTCString())

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

    // Invalidate all caches for this tenant (new event created)
    const keysToDelete: string[] = []
    cache.forEach((_, key) => {
      if (key.startsWith(`events-${tenant}-`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => cache.delete(key))
    console.log('🗑️ Calendar events: Invalidated', keysToDelete.length, 'cache entries after event creation')

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