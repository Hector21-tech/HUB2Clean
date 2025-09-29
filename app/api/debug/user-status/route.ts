import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Debug endpoint to check user status and memberships (NO AUTH REQUIRED)
export async function GET(request: NextRequest) {
  try {
    // Skip auth for this debug endpoint in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Debug endpoint only available in development' },
        { status: 403 }
      )
    }

    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    console.log('🔍 Debug: Checking user status for:', email)

    // Check if user exists in our database (Prisma search by email)
    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: {
        tenantMemberships: {
          include: {
            tenant: true
          }
        }
      }
    })

    console.log('🔍 Debug: DB user lookup:', {
      email,
      foundInDB: !!dbUser,
      userId: dbUser?.id,
      membershipCount: dbUser?.tenantMemberships?.length || 0
    })

    if (!dbUser) {
      return NextResponse.json({
        email,
        status: 'NOT_FOUND_IN_DB',
        dbUser: null,
        memberships: [],
        message: 'User not found in database. They need to log in first to create user record.'
      })
    }

    // Format memberships for response
    const memberships = dbUser.tenantMemberships.map(membership => ({
      tenantId: membership.tenantId,
      role: membership.role,
      createdAt: membership.createdAt,
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug
      }
    }))

    console.log('🔍 Debug: Final result:', {
      email,
      userId: dbUser.id,
      membershipCount: memberships.length,
      tenantSlugs: memberships.map(m => m.tenant.slug)
    })

    return NextResponse.json({
      email,
      status: 'FOUND',
      dbUser: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        createdAt: dbUser.createdAt
      },
      memberships,
      message: memberships.length > 0
        ? `User has ${memberships.length} tenant membership(s)`
        : 'User exists but has no tenant memberships'
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}