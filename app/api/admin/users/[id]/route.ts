import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET: Hämta detaljerad user information
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params

    console.log('🔍 Admin: Fetching user details for:', userId)

    // Fetch detailed user information
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        memberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get additional statistics for each tenant membership
    const membershipStats = await Promise.all(
      user.memberships.map(async (membership) => {
        // Count user's contributions to this tenant
        const [playerCount, requestCount, trialCount] = await Promise.all([
          // Players could be tracked by created_by field (future enhancement)
          prisma.player.count({
            where: { tenantId: membership.tenantId }
          }),
          prisma.request.count({
            where: { tenantId: membership.tenantId }
          }),
          prisma.trial.count({
            where: { tenantId: membership.tenantId }
          })
        ])

        return {
          ...membership,
          stats: {
            totalPlayers: playerCount,
            totalRequests: requestCount,
            totalTrials: trialCount
          }
        }
      })
    )

    console.log('✅ Admin: Found user with', user.memberships.length, 'memberships')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        memberships: membershipStats,
        summary: {
          totalMemberships: user.memberships.length,
          roles: [...new Set(user.memberships.map(m => m.role))],
          tenants: user.memberships.map(m => m.tenant.name),
          joinedDate: user.createdAt,
          lastUpdated: user.updatedAt
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin get user details error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user details',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// DELETE: Radera användare helt från systemet (både Prisma och Supabase Auth)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params

    console.log('🗑️ Admin: Deleting user from both Prisma and Supabase Auth:', userId)

    // Verify user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            tenant: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database'
      }, { status: 404 })
    }

    // Initialize Supabase Admin client for user deletion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Step 1: Delete from Supabase Auth (requires service role key)
    console.log('🔐 Admin: Deleting user from Supabase Auth...')
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      // Log warning but continue - user might not exist in Auth anymore
      console.warn('⚠️ Admin: Supabase Auth deletion warning:', authDeleteError.message)
      // Don't fail the entire operation if user doesn't exist in Auth
      if (!authDeleteError.message.includes('not found') && !authDeleteError.message.includes('User not found')) {
        throw new Error(`Supabase Auth deletion failed: ${authDeleteError.message}`)
      }
    } else {
      console.log('✅ Admin: Successfully deleted user from Supabase Auth')
    }

    // Step 2: Delete from Prisma database (cascades to memberships)
    console.log('💾 Admin: Deleting user from Prisma database...')
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log('✅ Admin: Successfully deleted user from both systems:', {
      userId,
      email: user.email,
      membershipCount: user.memberships.length
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully from both Prisma and Supabase Auth',
      deleted: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        membershipCount: user.memberships.length,
        tenants: user.memberships.map(m => m.tenant.name),
        deletedFromAuth: !authDeleteError,
        deletedFromDatabase: true
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin delete user error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check that SUPABASE_SERVICE_ROLE_KEY is set in environment variables',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}