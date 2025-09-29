import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST: Bjud in användare till tenant
export async function POST(request: NextRequest) {
  try {
    const { email, tenantId, role } = await request.json()

    if (!email || !tenantId || !role) {
      return NextResponse.json({
        success: false,
        error: 'Email, tenantId and role are required'
      }, { status: 400 })
    }

    console.log('📧 Admin: Inviting user:', { email, tenantId, role })

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

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { tenantId },
          include: {
            tenant: { select: { name: true } }
          }
        }
      }
    })

    // Check if user already has membership to this tenant
    if (user && user.memberships.length > 0) {
      return NextResponse.json({
        success: false,
        error: `User already has membership to ${user.memberships[0].tenant.name}`,
        userExists: true
      }, { status: 409 })
    }

    // Create user if doesn't exist
    if (!user) {
      console.log('👤 Creating new user:', email)

      // Extract name from email for better UX
      const emailName = email.split('@')[0]
      const nameParts = emailName.split('.')
      const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : undefined
      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : undefined

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName,
          lastName
        },
        include: {
          memberships: {
            where: { tenantId },
            include: {
              tenant: { select: { name: true } }
            }
          }
        }
      })

      console.log('✅ Created user:', user.id)
    }

    // Create tenant membership
    const membership = await prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId: tenantId,
        role: role as any // TenantRole enum
      },
      include: {
        tenant: { select: { name: true, slug: true } },
        user: { select: { email: true, firstName: true, lastName: true } }
      }
    })

    console.log('✅ Created membership:', {
      userId: user.id,
      tenantName: membership.tenant.name,
      role: membership.role
    })

    // TODO: Send email invitation here
    // For now, we'll just create the membership directly
    console.log('📧 TODO: Send email invitation to:', email)

    return NextResponse.json({
      success: true,
      message: `Successfully invited ${email} to ${tenant.name}`,
      data: {
        userId: user.id,
        userEmail: user.email,
        tenantId: tenant.id,
        tenantName: tenant.name,
        role: membership.role,
        membershipId: membership.id
      },
      // For development - would include invitation link in real app
      invitationStatus: 'Created membership directly (email invitation TODO)',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin invite error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to invite user',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}