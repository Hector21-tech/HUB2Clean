import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update a specific request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Update the request
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        description: true,
        club: true,
        position: true,
        status: true,
        priority: true,
        windowOpenAt: true,
        windowCloseAt: true,
        deadline: true,
        graceDays: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRequest
    })
  } catch (error) {
    console.error('Failed to update request:', error)
    return NextResponse.json(
      { error: 'Failed to update request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.request.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}