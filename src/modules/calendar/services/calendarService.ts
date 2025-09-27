import { PrismaClient } from '@prisma/client'
import { CalendarEvent, CreateEventInput, UpdateEventInput, CalendarFilters } from '../types/calendar'

const prisma = new PrismaClient()

export class CalendarService {
  async createEvent(tenantId: string, data: CreateEventInput, trialId?: string): Promise<CalendarEvent> {
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)

    const eventData: any = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      title: data.title,
      description: data.description || '',
      startTime,
      endTime,
      location: data.location || null,
      type: data.type || 'OTHER',
      isAllDay: data.isAllDay || false,
      recurrence: data.recurrence || null
    }

    // 🛡️ SAFE TRIAL LINKING: Only add trialId if schema supports it
    if (trialId) {
      try {
        eventData.trialId = trialId
      } catch (error) {
        console.warn('Trial linking not available, creating event without trial relation', error)
      }
    }

    // 🛡️ SAFE CREATE: Try with trial fields first, fallback to basic
    let event
    try {
      event = await prisma.calendarEvent.create({
        data: eventData,
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
          trialId: true
        }
      })
    } catch (error) {
      // Remove trialId if schema doesn't support it
      const { trialId: _, ...basicEventData } = eventData
      event = await prisma.calendarEvent.create({
        data: basicEventData,
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
    }

    return {
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    } as CalendarEvent
  }

  async updateEvent(id: string, tenantId: string, data: UpdateEventInput): Promise<CalendarEvent> {
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    }

    // Convert date strings to Date objects if provided
    if (data.startTime) {
      updateData.startTime = new Date(data.startTime)
    }
    if (data.endTime) {
      updateData.endTime = new Date(data.endTime)
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
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
        trialId: true
      }
    })

    return {
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    } as CalendarEvent
  }

  async deleteEvent(id: string, tenantId: string): Promise<void> {
    // First verify the event exists and belongs to the tenant
    const event = await prisma.calendarEvent.findFirst({
      where: { id, tenantId }
    })

    if (!event) {
      throw new Error('Calendar event not found or access denied')
    }

    await prisma.calendarEvent.delete({
      where: { id }
    })
  }

  async deleteEventByTrialId(trialId: string, tenantId: string): Promise<void> {
    // Delete calendar event associated with a trial
    const event = await prisma.calendarEvent.findFirst({
      where: { trialId, tenantId }
    })

    if (event) {
      await prisma.calendarEvent.delete({
        where: { id: event.id }
      })
    }
  }

  async getEventByTrialId(trialId: string, tenantId: string): Promise<CalendarEvent | null> {
    const event = await prisma.calendarEvent.findFirst({
      where: { trialId, tenantId },
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
        trialId: true
      }
    })

    if (!event) return null

    return {
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    } as CalendarEvent
  }

  // Helper method to create a calendar event from trial data
  createTrialEvent(
    tenantId: string,
    trial: {
      id: string
      scheduledAt: Date
      location?: string | null
      player?: { firstName: string; lastName: string } | null
    }
  ): CreateEventInput {
    const playerName = trial.player
      ? `${trial.player.firstName} ${trial.player.lastName}`
      : 'Unknown Player'

    // Create event title with smart formatting
    const title = `Trial: ${playerName}${trial.location ? ` at ${trial.location}` : ''}`

    // Set event duration (default 2 hours for trials)
    const startTime = new Date(trial.scheduledAt)
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours later

    return {
      title,
      description: `Trial session for ${playerName}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: trial.location || undefined,
      type: 'TRIAL',
      isAllDay: false
    }
  }
}

export const calendarService = new CalendarService()