import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Update trial
    const trial = await prisma.trial.update({
      where: {
        id
      },
      data: {
        ...body,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
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

    // Verify trial belongs to tenant before deleting
    const trial = await prisma.trial.findFirst({
      where: {
        id,
        tenantId: tenant
      }
    })

    if (!trial) {
      return NextResponse.json(
        { success: false, error: 'Trial not found' },
        { status: 404 }
      )
    }

    await prisma.trial.delete({
      where: { id }
    })

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