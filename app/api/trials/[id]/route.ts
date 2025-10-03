import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiCache, dashboardCache, generateCacheKey } from '@/lib/api-cache'
import { trialService } from '@/modules/trials/services/trialService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    const trial = await prisma.trial.findFirst({
      where: {
        id,
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
            avatarUrl: true,
            dateOfBirth: true,
            nationality: true,
            height: true
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

    if (!trial) {
      return NextResponse.json(
        { success: false, error: 'Trial not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: trial
    })
  } catch (error) {
    console.error('Trial fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trial' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // 🎯 USE TRIAL SERVICE: This handles calendar event sync/deletion automatically
    const updateData = {
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
    }
    const trial = await trialService.updateTrial(id, tenant, updateData)

    // Invalidate trials cache
    apiCache.invalidatePattern(`trials-${tenant}`)
    dashboardCache.invalidate(generateCacheKey('dashboard', tenant))

    return NextResponse.json({
      success: true,
      data: trial
    })
  } catch (error) {
    console.error('Trial update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update trial' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    // 🎯 USE TRIAL SERVICE: This handles calendar event deletion automatically
    await trialService.deleteTrial(id, tenant)

    // Invalidate both trials cache AND dashboard cache
    apiCache.invalidatePattern(`trials-${tenant}`)
    dashboardCache.invalidate(generateCacheKey('dashboard', tenant))

    return NextResponse.json({
      success: true,
      message: 'Trial deleted successfully'
    })
  } catch (error) {
    console.error('Trial deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete trial' },
      { status: 500 }
    )
  }
}