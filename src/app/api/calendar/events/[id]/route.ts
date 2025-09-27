import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireTenant } from '@/lib/server/authz'
import { Logger, createLogContext, generateRequestId } from '@/lib/logger'
import { applyRateLimit, createRateLimitResponse } from '@/lib/security/rate-limiting'

const prisma = new PrismaClient()


// GET - Get a specific calendar event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const timer = Logger.timer()

  try {
    const { id } = await params
    const tenantSlug = request.nextUrl.searchParams.get('tenant')

    const context = createLogContext(request, tenantSlug || undefined, undefined, requestId)

    // 🛡️ SECURITY: Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      Logger.security('Calendar get: Auth failed', {
        ...context,
        status: authz.status,
        duration: timer.end(),
        details: { error: authz.message, eventId: id }
      })
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      )
    }

    const { tenantId } = authz
    const userId = authz.user?.id

    // 🛡️ SECURITY: Check event exists and belongs to tenant
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id,
        tenantId // Ensure tenant isolation
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
        updatedAt: true,
        tenantId: true
      }
    })

    if (!event) {
      Logger.info('Calendar event not found or access denied', {
        ...context,
        tenant: tenantId,
        userId,
        status: 404,
        duration: timer.end(),
        details: { eventId: id }
      })
      return NextResponse.json(
        { success: false, error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    Logger.success('Calendar event fetched successfully', {
      ...context,
      tenant: tenantId,
      userId,
      status: 200,
      duration: timer.end(),
      details: { eventId: id }
    })

    return NextResponse.json({
      success: true,
      data: event
    })

  } catch (error) {
    const context = createLogContext(request, undefined, undefined, requestId)
    Logger.error('Calendar event fetch error', {
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

// PUT - Update a calendar event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const timer = Logger.timer()

  try {
    const { id } = await params
    const context = createLogContext(request, undefined, undefined, requestId)

    Logger.info('Update calendar event request started', {
      ...context,
      status: 200,
      details: { eventId: id }
    })

    // 🛡️ SECURITY: Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      Logger.security('Calendar update: Auth failed', {
        ...context,
        status: authz.status,
        duration: timer.end(),
        details: { error: authz.message, eventId: id }
      })
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      )
    }

    const { tenantId } = authz
    const userId = authz.user?.id

    // 🛡️ SECURITY: Apply rate limiting with error handling
    try {
      const rateLimitResult = applyRateLimit(request, 'api', { tenantId, userId })
      if (rateLimitResult && !rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult)
      }
    } catch (rateLimitError) {
      Logger.error('Rate limiting error in calendar event operation', {
        ...context,
        tenant: tenantId,
        userId,
        status: 500,
        duration: timer.end(),
        error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown rate limit error',
        details: { eventId: id }
      })
      // Continue without rate limiting if it fails
    }

    // 🛡️ SECURITY: Check event exists and belongs to tenant
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        tenantId // Ensure tenant isolation
      },
      select: { id: true, tenantId: true }
    })

    if (!existingEvent) {
      Logger.info('Calendar event not found or access denied for update', {
        ...context,
        tenant: tenantId,
        userId,
        status: 404,
        duration: timer.end(),
        details: { eventId: id }
      })
      return NextResponse.json(
        { success: false, error: 'Calendar event not found' },
        { status: 404 }
      )
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

    // Validate date range if provided
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)

      if (start >= end) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      // Check for conflicts (excluding this event) - Fixed overlap logic
      const conflictingEvents = await prisma.calendarEvent.findMany({
        where: {
          tenantId, // Use validated tenantId from authz
          id: { not: id },
          AND: [
            { startTime: { lt: end } },   // Event starts before this event ends
            { endTime: { gt: start } }    // Event ends after this event starts
          ]
        },
        select: { id: true, title: true, startTime: true, endTime: true }
      })

      if (conflictingEvents.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Event conflicts with existing events',
          conflicts: conflictingEvents
        }, { status: 409 })
      }
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(location !== undefined && { location }),
        ...(type && { type }),
        ...(isAllDay !== undefined && { isAllDay }),
        ...(recurrence !== undefined && { recurrence })
      },
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

    Logger.success('Calendar event updated successfully', {
      ...context,
      tenant: tenantId,
      userId,
      status: 200,
      duration: timer.end(),
      details: { eventId: id }
    })

    return NextResponse.json({
      success: true,
      data: updatedEvent
    })

  } catch (error) {
    try {
      const context = createLogContext(request, undefined, undefined, requestId)
      Logger.error('Update calendar event error', {
        ...context,
        status: 500,
        duration: timer.end(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      if (error instanceof Error && error.stack) {
        console.error('PUT error stack:', error.stack)
      }
    } catch (logError) {
      console.error('Failed to log PUT error:', logError)
      console.error('Original PUT error:', error)
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  const timer = Logger.timer()

  try {
    const { id } = await params
    const context = createLogContext(request, undefined, undefined, requestId)

    Logger.info('Delete calendar event request started', {
      ...context,
      status: 200,
      details: { eventId: id }
    })

    // 🛡️ SECURITY: Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      Logger.security('Calendar delete: Auth failed', {
        ...context,
        status: authz.status,
        duration: timer.end(),
        details: { error: authz.message, eventId: id }
      })
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      )
    }

    const { tenantId } = authz
    const userId = authz.user?.id

    // 🛡️ SECURITY: Apply rate limiting with error handling
    try {
      const rateLimitResult = applyRateLimit(request, 'api', { tenantId, userId })
      if (rateLimitResult && !rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult)
      }
    } catch (rateLimitError) {
      Logger.error('Rate limiting error in calendar event operation', {
        ...context,
        tenant: tenantId,
        userId,
        status: 500,
        duration: timer.end(),
        error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown rate limit error',
        details: { eventId: id }
      })
      // Continue without rate limiting if it fails
    }

    // 🛡️ SECURITY: Check event exists and belongs to tenant
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        tenantId // Ensure tenant isolation
      },
      select: { id: true, title: true, tenantId: true }
    })

    if (!existingEvent) {
      Logger.info('Calendar event not found or access denied for deletion', {
        ...context,
        tenant: tenantId,
        userId,
        status: 404,
        duration: timer.end(),
        details: { eventId: id }
      })
      return NextResponse.json(
        { success: false, error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    // Enhanced DELETE with comprehensive error handling
    try {
      // Check if event has trial relations (with fallback for schema compatibility)
      let eventWithTrial = null
      try {
        eventWithTrial = await prisma.calendarEvent.findFirst({
          where: { id },
          include: { trial: true }
        })

        if (eventWithTrial?.trial) {
          Logger.info('Deleting calendar event with trial relation', {
            ...context,
            tenant: tenantId,
            userId,
            status: 200,
            details: { eventId: id, trialId: eventWithTrial.trial.id }
          })
        }
      } catch (schemaError) {
        Logger.warn('Trial relations not available during delete, continuing with basic delete', {
          ...context,
          tenant: tenantId,
          userId,
          status: 200,
          error: schemaError instanceof Error ? schemaError.message : 'Schema error',
          details: { eventId: id }
        })
      }

      // Perform the delete operation
      await prisma.calendarEvent.delete({
        where: { id }
      })

      Logger.success('Calendar event deletion executed successfully', {
        ...context,
        tenant: tenantId,
        userId,
        status: 200,
        duration: timer.end(),
        details: { eventId: id, eventTitle: existingEvent.title }
      })
    } catch (deleteError) {
      // Enhanced error classification
      let errorMessage = 'Failed to delete calendar event'
      let statusCode = 500

      if (deleteError instanceof Error) {
        Logger.error('Calendar event deletion failed at database level', {
          ...context,
          tenant: tenantId,
          userId,
          status: 500,
          duration: timer.end(),
          error: deleteError.message,
          details: { eventId: id, eventTitle: existingEvent.title, stack: deleteError.stack }
        })

        // Check for specific error types
        if (deleteError.message.includes('Record to delete does not exist')) {
          errorMessage = 'Calendar event no longer exists'
          statusCode = 404
        } else if (deleteError.message.includes('Foreign key constraint')) {
          errorMessage = 'Cannot delete event due to related data'
          statusCode = 409
        }
      } else {
        Logger.error('Calendar event deletion failed with unknown error', {
          ...context,
          tenant: tenantId,
          userId,
          status: 500,
          duration: timer.end(),
          error: 'Unknown delete error',
          details: { eventId: id, eventTitle: existingEvent.title, errorType: typeof deleteError }
        })
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
      )
    }

    Logger.success('Calendar event deleted successfully', {
      ...context,
      tenant: tenantId,
      userId,
      status: 200,
      duration: timer.end(),
      details: { eventId: id, eventTitle: existingEvent.title }
    })

    return NextResponse.json({
      success: true,
      message: `Event "${existingEvent.title}" deleted successfully`
    })

  } catch (error) {
    try {
      const context = createLogContext(request, undefined, undefined, requestId)
      Logger.error('Delete calendar event error', {
        ...context,
        status: 500,
        duration: timer.end(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      if (error instanceof Error && error.stack) {
        console.error('DELETE error stack:', error.stack)
      }
    } catch (logError) {
      console.error('Failed to log DELETE error:', logError)
      console.error('Original DELETE error:', error)
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}