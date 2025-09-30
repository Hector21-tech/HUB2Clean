import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email/send-invitation'

// POST: Resend invitation email
export async function POST(
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

    console.log('📧 Resending invitation:', id)

    // Find invitation
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

    // Check if invitation is pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: `Cannot resend ${invitation.status.toLowerCase()} invitation`
      }, { status: 400 })
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Cannot resend expired invitation'
      }, { status: 400 })
    }

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      to: invitation.email,
      inviteToken: invitation.token,
      organizationName: invitation.tenant.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    })

    if (!emailResult.success) {
      console.warn('⚠️ Email sending failed:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send email'
      }, { status: 500 })
    }

    console.log('✅ Invitation resent to:', invitation.email)

    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${invitation.email}`,
      data: {
        email: invitation.email,
        tenantName: invitation.tenant.name,
        expiresAt: invitation.expiresAt
      }
    })

  } catch (error) {
    console.error('❌ Resend invitation error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to resend invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}