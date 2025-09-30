import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendInvitationEmail } from '@/lib/email/send-invitation'
import { prisma } from '@/lib/prisma'

// POST: Bjud in användare till tenant via invitation token
export async function POST(request: NextRequest) {
  try {
    const { email, tenantId, role } = await request.json()

    if (!email || !tenantId || !role) {
      return NextResponse.json({
        success: false,
        error: 'Email, tenantId and role are required'
      }, { status: 400 })
    }

    console.log('📧 Admin: Creating invitation for:', { email, tenantId, role })

    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true }
    })

    if (!tenant) {
      return NextResponse.json({
        success: false,
        error: 'Tenant not found'
      }, { status: 404 })
    }

    // Check if user already has membership to this tenant
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          where: { tenantId },
          include: { tenant: { select: { name: true } } }
        }
      }
    })

    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json({
        success: false,
        error: `User ${email} already has membership to ${existingUser.memberships[0].tenant.name}`,
        userExists: true
      }, { status: 409 })
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    })

    if (existingInvite) {
      console.log('📧 Reusing existing pending invitation:', existingInvite.token)

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const inviteLink = `${siteUrl}/accept-invite/${existingInvite.token}`

      return NextResponse.json({
        success: true,
        message: `Invitation already exists for ${email}`,
        data: {
          invitationId: existingInvite.id,
          email: existingInvite.email,
          tenantName: tenant.name,
          role: existingInvite.role,
          token: existingInvite.token,
          expiresAt: existingInvite.expiresAt,
          inviteLink
        },
        invitationStatus: 'REUSED_EXISTING',
        timestamp: new Date().toISOString()
      })
    }

    // Generate unique invitation token
    const token = crypto.randomBytes(32).toString('hex')

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        tenantId,
        role: role as any,
        token,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        tenant: { select: { name: true, slug: true } }
      }
    })

    console.log('✅ Created invitation:', {
      email: invitation.email,
      tenantName: invitation.tenant.name,
      role: invitation.role,
      token: invitation.token.substring(0, 8) + '...',
      expiresAt: invitation.expiresAt
    })

    // Build invitation link (using query parameter for better compatibility)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteLink = `${siteUrl}/accept-invite?token=${token}`

    console.log('📧 Invitation link:', inviteLink)

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      to: email,
      inviteToken: token,
      organizationName: tenant.name,
      role: role,
      expiresAt: invitation.expiresAt
    })

    if (!emailResult.success) {
      console.warn('⚠️ Email sending failed:', emailResult.error)
      // Don't fail the invitation creation - admin can still manually share the link
    } else {
      console.log('✅ Invitation email sent successfully to:', email)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created invitation for ${email}`,
      data: {
        invitationId: invitation.id,
        email: invitation.email,
        tenantId: tenant.id,
        tenantName: tenant.name,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        inviteLink
      },
      invitationStatus: 'PENDING',
      // For development - show link in console/response
      devNote: `Share this link with the user: ${inviteLink}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin invite error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to create invitation',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}