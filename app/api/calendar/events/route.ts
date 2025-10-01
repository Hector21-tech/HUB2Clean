import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({
      success: true,
      data: transformedEvents
    })

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