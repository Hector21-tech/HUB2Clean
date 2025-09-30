import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate the ID
    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    // Filter to only allow specific fields that are safe to update
    const allowedFields: string[] = ['notes'] // Allow notes updates for scout functionality
    const updateData: Record<string, any> = {}

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the player
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        tenant: true,
        trials: true
      }
    })

    return NextResponse.json({
      success: true,
      player: updatedPlayer
    })

  } catch (error) {
    console.error('Error updating player:', error)

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        tenant: true,
        trials: true
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json({ player })

  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    )
  }
}