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

    // Create trial
    const trial = await prisma.trial.create({
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