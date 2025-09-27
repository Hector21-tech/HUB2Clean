import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UpdateEventInput {
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  location?: string
  type?: 'TRIAL' | 'MEETING' | 'MATCH' | 'TRAINING' | 'SCOUTING' | 'OTHER'
  isAllDay?: boolean
  recurrence?: string
}

// PUT /api/calendar/events/[id] - Update calendar event
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')
    const params = await context.params
    const eventId = params.id

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
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
    const body: UpdateEventInput = await request.json()

    // Verify event exists and belongs to tenant
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        tenantId
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.location !== undefined) updateData.location = body.location
    if (body.type !== undefined) updateData.type = body.type
    if (body.isAllDay !== undefined) updateData.isAllDay = body.isAllDay
    if (body.recurrence !== undefined) updateData.recurrence = body.recurrence

    // Handle date updates with validation
    if (body.startTime || body.endTime) {
      const startTime = body.startTime ? new Date(body.startTime) : existingEvent.startTime
      const endTime = body.endTime ? new Date(body.endTime) : existingEvent.endTime

      // Validate dates
      if (body.startTime && isNaN(startTime.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid startTime format' },
          { status: 400 }
        )
      }

      if (body.endTime && isNaN(endTime.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid endTime format' },
          { status: 400 }
        )
      }

      if (startTime >= endTime) {
        return NextResponse.json(
          { success: false, error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      updateData.startTime = startTime
      updateData.endTime = endTime
    }

    // Update the event
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
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
      }
    })

    // Transform event to match frontend interface
    const transformedEvent = {
      id: updatedEvent.id,
      tenantId: updatedEvent.tenantId,
      title: updatedEvent.title,
      description: updatedEvent.description,
      startTime: updatedEvent.startTime.toISOString(),
      endTime: updatedEvent.endTime.toISOString(),
      location: updatedEvent.location,
      type: updatedEvent.type,
      isAllDay: updatedEvent.isAllDay,
      recurrence: updatedEvent.recurrence,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString(),
      trialId: updatedEvent.trialId,
      trial: updatedEvent.trial ? {
        id: updatedEvent.trial.id,
        status: updatedEvent.trial.status,
        rating: updatedEvent.trial.rating,
        player: updatedEvent.trial.player,
        request: updatedEvent.trial.request
      } : null
    }

    return NextResponse.json({
      success: true,
      data: transformedEvent
    })

  } catch (error) {
    console.error('Calendar event PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update calendar event' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/calendar/events/[id] - Delete calendar event
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')
    const params = await context.params
    const eventId = params.id

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
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

    // Verify event exists and belongs to tenant
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        tenantId
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Delete the event
    await prisma.calendarEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('Calendar event DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}