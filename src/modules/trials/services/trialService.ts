import { PrismaClient } from '@prisma/client'
import { Trial, TrialFilters, CreateTrialInput, UpdateTrialInput, TrialEvaluationInput, TrialStats } from '../types/trial'
// TODO: Re-enable calendar integration when calendar module is migrated
// import { calendarService } from '../../calendar/services/calendarService'

const prisma = new PrismaClient()

export class TrialService {
  async getTrials(tenantId: string, filters?: TrialFilters): Promise<Trial[]> {
    const where: any = {
      tenantId
    }

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters?.playerId) {
      where.playerId = filters.playerId
    }

    if (filters?.requestId) {
      where.requestId = filters.requestId
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.scheduledAt = {}
      if (filters.dateFrom) {
        where.scheduledAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.scheduledAt.lte = filters.dateTo
      }
    }

    if (filters?.search) {
      where.OR = [
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { feedback: { contains: filters.search, mode: 'insensitive' } },
        { player: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } }
          ]
        }},
        { request: {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { club: { contains: filters.search, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    const trials = await prisma.trial.findMany({
      where,
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
      orderBy: [
        { scheduledAt: 'asc' }
      ]
    })

    return trials as Trial[]
  }

  async getTrialById(id: string, tenantId: string): Promise<Trial | null> {
    const trial = await prisma.trial.findFirst({
      where: { id, tenantId },
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

    return trial as Trial | null
  }

  async createTrial(tenantId: string, data: CreateTrialInput): Promise<Trial> {
    const trial = await prisma.trial.create({
      data: {
        tenantId,
        ...data
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

    // 🗓️ AUTO-CREATE CALENDAR EVENT: Create corresponding calendar event for the trial
    // TODO: Re-enable calendar integration when calendar module is migrated
    /*
    try {
      const eventData = calendarService.createTrialEvent(tenantId, {
        id: trial.id,
        scheduledAt: trial.scheduledAt,
        location: trial.location,
        player: trial.player
      })

      await calendarService.createEvent(tenantId, eventData, trial.id)
    } catch (error) {
      // Log error but don't fail trial creation if calendar event fails
      console.warn(`Failed to create calendar event for trial ${trial.id}:`, error)
    }
    */

    return trial as Trial
  }

  async updateTrial(id: string, tenantId: string, data: UpdateTrialInput): Promise<Trial> {
    const trial = await prisma.trial.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
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

    // 🔄 SYNC CALENDAR EVENT: Update corresponding calendar event if trial details changed
    // TODO: Re-enable calendar integration when calendar module is migrated
    /*
    try {
      const existingEvent = await calendarService.getEventByTrialId(trial.id, tenantId)

      if (existingEvent) {
        // Check if we need to update the calendar event (time, location, or player changed)
        const shouldUpdate = data.scheduledAt || data.location || data.playerId

        if (shouldUpdate) {
          const eventData = calendarService.createTrialEvent(tenantId, {
            id: trial.id,
            scheduledAt: trial.scheduledAt,
            location: trial.location,
            player: trial.player
          })

          await calendarService.updateEvent(existingEvent.id, tenantId, {
            id: existingEvent.id,
            title: eventData.title,
            description: eventData.description,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            location: eventData.location
          })
        }
      }
    } catch (error) {
      // Log error but don't fail trial update if calendar sync fails
      console.warn(`Failed to sync calendar event for trial ${trial.id}:`, error)
    }
    */

    return trial as Trial
  }

  async evaluateTrial(id: string, tenantId: string, evaluation: TrialEvaluationInput): Promise<Trial> {
    const trial = await prisma.trial.update({
      where: { id },
      data: {
        rating: evaluation.rating,
        feedback: evaluation.feedback,
        notes: evaluation.notes || undefined,
        status: 'COMPLETED',
        updatedAt: new Date()
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

    return trial as Trial
  }

  async deleteTrial(id: string, tenantId: string): Promise<void> {
    // First verify the trial exists and belongs to the tenant
    const trial = await prisma.trial.findFirst({
      where: { id, tenantId }
    })

    if (!trial) {
      throw new Error('Trial not found or access denied')
    }

    // 🗑️ DELETE CALENDAR EVENT: Remove associated calendar event first
    // TODO: Re-enable calendar integration when calendar module is migrated
    /*
    try {
      await calendarService.deleteEventByTrialId(id, tenantId)
    } catch (error) {
      // Log error but continue with trial deletion
      console.warn(`Failed to delete calendar event for trial ${id}:`, error)
    }
    */

    await prisma.trial.delete({
      where: { id }
    })
  }

  async getTrialStats(tenantId: string): Promise<TrialStats> {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      noShow,
      upcomingThisWeek,
      pendingEvaluation
    ] = await Promise.all([
      prisma.trial.count({ where: { tenantId } }),
      prisma.trial.count({ where: { tenantId, status: 'SCHEDULED' } }),
      prisma.trial.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      prisma.trial.count({ where: { tenantId, status: 'COMPLETED' } }),
      prisma.trial.count({ where: { tenantId, status: 'CANCELLED' } }),
      prisma.trial.count({ where: { tenantId, status: 'NO_SHOW' } }),
      prisma.trial.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
          scheduledAt: {
            gte: now,
            lte: weekFromNow
          }
        }
      }),
      prisma.trial.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          rating: null
        }
      })
    ])

    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      noShow,
      upcomingThisWeek,
      pendingEvaluation
    }
  }

  async getTrialsByPlayer(playerId: string, tenantId: string): Promise<Trial[]> {
    const trials = await prisma.trial.findMany({
      where: { playerId, tenantId },
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
      orderBy: [
        { scheduledAt: 'desc' }
      ]
    })

    return trials as Trial[]
  }
}

export const trialService = new TrialService()