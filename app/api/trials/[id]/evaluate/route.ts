import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
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

    // Verify trial belongs to tenant before evaluating
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

    // Update trial with evaluation data
    const evaluatedTrial = await prisma.trial.update({
      where: { id },
      data: {
        ...body,
        status: 'EVALUATED',
        evaluatedAt: new Date(),
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
      data: evaluatedTrial
    })
  } catch (error) {
    console.error('Trial evaluation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate trial' },
      { status: 500 }
    )
  }
}