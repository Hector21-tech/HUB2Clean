import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE: Remove an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Invitation ID is required'
      }, { status: 400 })
    }

    console.log('🗑️ Deleting invitation:', id)

    // Check if invitation exists
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true } }
      }
    })

    if (!invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invitation not found'
      }, { status: 404 })
    }

    // Delete invitation
    await prisma.invitation.delete({
      where: { id }
    })

    console.log('✅ Invitation deleted:', {
      email: invitation.email,
      tenant: invitation.tenant.name,
      status: invitation.status
    })

    return NextResponse.json({
      success: true,
      message: `Invitation for ${invitation.email} deleted successfully`,
      deleted: {
        email: invitation.email,
        tenantName: invitation.tenant.name,
        status: invitation.status
      }
    })

  } catch (error) {
    console.error('❌ Delete invitation error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to delete invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}