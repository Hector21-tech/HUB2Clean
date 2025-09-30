import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

// GET: Accept invitation and create user + membership
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Invitation token is required'
      }, { status: 400 })
    }

    console.log('🎫 Processing invitation token:', token.substring(0, 8) + '...')

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invitation token',
        errorCode: 'INVALID_TOKEN'
      }, { status: 404 })
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json({
        success: false,
        error: 'This invitation has expired',
        errorCode: 'EXPIRED',
        expiresAt: invitation.expiresAt
      }, { status: 410 })
    }

    // Check if invitation has already been accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({
        success: false,
        error: 'This invitation has already been used',
        errorCode: 'ALREADY_ACCEPTED',
        acceptedAt: invitation.acceptedAt
      }, { status: 410 })
    }

    // Check if invitation was cancelled
    if (invitation.status === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        error: 'This invitation has been cancelled',
        errorCode: 'CANCELLED'
      }, { status: 410 })
    }

    // Return invitation details for user acceptance page
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        tenant: {
          id: invitation.tenant.id,
          name: invitation.tenant.name,
          slug: invitation.tenant.slug
        },
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Invitation validation error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to validate invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST: Accept invitation - create user account and membership
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { firstName, lastName, password, joinExisting } = body

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Invitation token is required'
      }, { status: 400 })
    }

    // For logged-in users joining with joinExisting flag, skip password check
    if (!joinExisting) {
      if (!firstName || !lastName || !password) {
        return NextResponse.json({
          success: false,
          error: 'First name, last name, and password are required'
        }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({
          success: false,
          error: 'Password must be at least 6 characters'
        }, { status: 400 })
      }
    }

    console.log('✅ Accepting invitation:', token.substring(0, 8) + '...')

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true }
    })

    if (!invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invitation token'
      }, { status: 404 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'This invitation has expired'
      }, { status: 410 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: 'This invitation is no longer valid'
      }, { status: 410 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
      include: {
        memberships: {
          where: { tenantId: invitation.tenantId }
        }
      }
    })

    // If user already has membership to this tenant
    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'You already have access to this organization',
        errorCode: 'ALREADY_MEMBER'
      }, { status: 409 })
    }

    // Create Supabase admin client for server-side auth operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let userId: string
    let userFirstName: string
    let userLastName: string

    if (!existingUser) {
      // Only create Supabase auth user if NOT using joinExisting (meaning user needs to create account)
      if (joinExisting) {
        return NextResponse.json({
          success: false,
          error: 'User account not found. Please sign up first or use a different email.'
        }, { status: 404 })
      }

      // Create new Supabase auth user using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true, // Auto-confirm email for invited users
        user_metadata: {
          firstName,
          lastName
        }
      })

      if (authError || !authData.user) {
        console.error('❌ Supabase auth error:', authError)
        return NextResponse.json({
          success: false,
          error: authError?.message || 'Failed to create user account'
        }, { status: 500 })
      }

      userId = authData.user.id

      // Create user in Prisma database
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: invitation.email,
          firstName,
          lastName
        }
      })

      userFirstName = newUser.firstName || firstName
      userLastName = newUser.lastName || lastName

      console.log('👤 Created new user:', newUser.id)
    } else {
      userId = existingUser.id

      // For existing users joining another organization, optionally update name if provided
      if (firstName && lastName) {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { firstName, lastName }
        })

        userFirstName = updatedUser.firstName || firstName
        userLastName = updatedUser.lastName || lastName
      } else {
        userFirstName = existingUser.firstName || 'User'
        userLastName = existingUser.lastName || 'Member'
      }

      console.log('👤 Using existing user:', existingUser.id)
    }

    // Create tenant membership
    const membership = await prisma.tenantMembership.create({
      data: {
        userId,
        tenantId: invitation.tenantId,
        role: invitation.role as any
      },
      include: {
        tenant: true
      }
    })

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    })

    console.log('✅ Invitation accepted successfully:', {
      userId,
      email: invitation.email,
      tenantName: membership.tenant.name,
      role: membership.role
    })

    return NextResponse.json({
      success: true,
      message: `Welcome to ${membership.tenant.name}!`,
      data: {
        userId,
        email: invitation.email,
        firstName: userFirstName,
        lastName: userLastName,
        tenant: {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug
        },
        role: membership.role,
        redirectUrl: `/${membership.tenant.slug}/dashboard`
      }
    })

  } catch (error) {
    console.error('❌ Accept invitation error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to accept invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}