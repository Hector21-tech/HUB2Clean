import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireTenant } from '@/lib/server/authz'
import { Logger, createLogContext, generateRequestId } from '@/lib/logger'
import { applyRateLimit, createRateLimitResponse } from '@/lib/security/rate-limiting'

const prisma = new PrismaClient()

// GET - List calendar events for a tenant
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const timer = Logger.timer()

  try {
    const { searchParams } = request.nextUrl
    const tenantSlug = searchParams.get('tenant') || searchParams.get('tenantId')
    const start = searchParams.get('start') // ISO date string
    const end = searchParams.get('end') // ISO date string
    const type = searchParams.get('type') // Optional event type filter

    const context = createLogContext(request, tenantSlug || undefined, undefined, requestId)

    Logger.info('Calendar events API request started', {
      ...context,
      status: 200,
      details: { tenantSlug, hasDateRange: !!(start && end), type }
    })

    if (!tenantSlug) {
      Logger.warn('Missing tenant parameter', {
        ...context,
        status: 400,
        duration: timer.end()
      })
      return NextResponse.json(
        { success: false, error: 'Tenant parameter is required' },
        { status: 400 }
      )
    }

    // 🛡️ SECURITY: Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      Logger.security('Calendar API: Tenant access denied', {
        ...context,
        status: authz.status,
        duration: timer.end(),
        details: { message: authz.message }
      })
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      )
    }

    const { tenantId } = authz
    const userId = authz.user?.id

    // 🛡️ SECURITY: Apply rate limiting
    const rateLimitResult = applyRateLimit(request, 'api', { tenantId, userId })
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult)
    }

    // Build secure where clause with validated tenantId
    const where: any = { tenantId }

    // Date range filtering
    if (start && end) {
      where.OR = [
        // Events that start within the range
        {
          startTime: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        // Events that end within the range
        {
          endTime: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        // Events that span the entire range
        {
          AND: [
            { startTime: { lte: new Date(start) } },
            { endTime: { gte: new Date(end) } }
          ]
        }
      ]
    }

    // Event type filtering
    if (type) {
      where.type = type
    }

    // 🛡️ SAFE QUERY: Try with trial relations first, fallback to basic query
    let events
    try {
      events = await prisma.calendarEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          tenantId: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          location: true,
          type: true,
          isAllDay: true,
          recurrence: true,
          createdAt: true,
          updatedAt: true,
          trialId: true,
          trial: {
            select: {
              id: true,
              status: true,
              rating: true,
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
        }
      })
    } catch (error) {
      Logger.warn('Trial relations not available, falling back to basic calendar events', {
        ...context,
        status: 200,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Fallback to basic calendar events without trial relations
      events = await prisma.calendarEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          tenantId: true,
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
        }
      })
    }

    Logger.success('Calendar events fetched successfully', {
      ...context,
      tenant: tenantId,
      userId,
      status: 200,
      duration: timer.end(),
      details: { eventCount: events.length, hasDateRange: !!(start && end) }
    })

    return NextResponse.json({
      success: true,
      data: events
    })

  } catch (error) {
    const context = createLogContext(request, undefined, undefined, requestId)
    Logger.error('Calendar events API error', {
      ...context,
      status: 500,
      duration: timer.end(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new calendar event
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const timer = Logger.timer()

  try {
    const { searchParams } = request.nextUrl
    const tenantSlug = searchParams.get('tenant')

    const context = createLogContext(request, tenantSlug || undefined, undefined, requestId)

    Logger.info('Create calendar event request started', {
      ...context,
      status: 200,
      details: { tenantSlug }
    })

    if (!tenantSlug) {
      Logger.warn('Missing tenant parameter', {
        ...context,
        status: 400,
        duration: timer.end()
      })
      return NextResponse.json(
        { success: false, error: 'Tenant parameter is required' },
        { status: 400 }
      )
    }

    // 🛡️ SECURITY: Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      Logger.security('Calendar create: Tenant access denied', {
        ...context,
        status: authz.status,
        duration: timer.end(),
        details: { message: authz.message }
      })
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      )
    }

    const { tenantId } = authz
    const userId = authz.user?.id

    // 🛡️ SECURITY: Apply rate limiting
    const rateLimitResult = applyRateLimit(request, 'api', { tenantId, userId })
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      type,
      isAllDay,
      recurrence
    } = body

    // Basic validation
    if (!title || !startTime || !endTime) {
      Logger.warn('Invalid calendar event data', {
        ...context,
        tenant: tenantId,
        userId,
        status: 400,
        duration: timer.end(),
        details: { hasTitle: !!title, hasStartTime: !!startTime, hasEndTime: !!endTime }
      })
      return NextResponse.json(
        { success: false, error: 'title, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // Validate date range
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Logger.warn('Invalid date format in calendar event', {
        ...context,
        tenant: tenantId,
        userId,
        status: 400,
        duration: timer.end(),
        details: { startTime, endTime }
      })
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (start >= end) {
      Logger.warn('Invalid date range in calendar event', {
        ...context,
        tenant: tenantId,
        userId,
        status: 400,
        duration: timer.end(),
        details: { startTime, endTime }
      })
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Check for conflicts (overlapping events)
    const conflictingEvents = await prisma.calendarEvent.findMany({
      where: {
        tenantId,
        OR: [
          // New event starts during existing event
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          // New event ends during existing event
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          // New event contains existing event
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      },
      select: { id: true, title: true, startTime: true, endTime: true }
    })

    const newEvent = await prisma.calendarEvent.create({
      data: {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        title,
        description: description || '',
        startTime: start,
        endTime: end,
        location: location || null,
        type: type || 'OTHER',
        isAllDay: isAllDay || false,
        recurrence: recurrence || null
      },
      select: {
        id: true,
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
      }
    })

    Logger.success('Calendar event created successfully', {
      ...context,
      tenant: tenantId,
      userId,
      status: 201,
      duration: timer.end(),
      details: {
        eventId: newEvent.id,
        hasConflicts: conflictingEvents.length > 0,
        conflictCount: conflictingEvents.length
      }
    })

    return NextResponse.json({
      success: true,
      data: newEvent,
      conflicts: conflictingEvents.length > 0 ? conflictingEvents : undefined
    }, { status: 201 })

  } catch (error) {
    const context = createLogContext(request, undefined, undefined, requestId)
    Logger.error('Create calendar event error', {
      ...context,
      status: 500,
      duration: timer.end(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}