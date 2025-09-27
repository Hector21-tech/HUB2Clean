import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Get trials for the tenant
    const trials = await prisma.trial.findMany({
      where: {
        tenantId: tenant
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

    return NextResponse.json({
      success: true,
      data: trials
    })
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