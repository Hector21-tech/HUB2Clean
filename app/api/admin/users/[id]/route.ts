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
    // IMPORTANT: This will invalidate all active sessions for this user
    // However, cached JWT tokens in browsers will remain valid until they expire (typically 1 hour)
    // The AuthContext auto-logout for orphaned users will handle these cached sessions
    console.log('🔐 Admin: Deleting user from Supabase Auth...')
    console.log('🔐 Admin: Note - Active JWT tokens will remain valid until expiry, but AuthContext will auto-logout orphaned users')
    let authDeleted = false
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.warn('⚠️ Admin: Primary deletion failed via userId:', authDeleteError.message)
      console.log('🔄 Admin: Attempting email fallback for orphaned user cleanup...')

      // Fallback: Search for user by email and delete (handles orphaned users)
      try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
          console.error('❌ Admin: Failed to list users for fallback:', listError.message)
        } else {
          const orphanedUser = users.find(u => u.email === user.email)

          if (orphanedUser) {
            console.log('🎯 Admin: Found orphaned user via email:', orphanedUser.email, '| ID:', orphanedUser.id)
            const { error: emailDeleteError } = await supabaseAdmin.auth.admin.deleteUser(orphanedUser.id)

            if (!emailDeleteError) {
              console.log('✅ Admin: Successfully deleted orphaned user via email fallback')
              authDeleted = true
            } else {
              console.error('❌ Admin: Email fallback deletion failed:', emailDeleteError.message)
            }
          } else {
            console.log('ℹ️ Admin: User not found in Supabase Auth (already deleted or never existed)')
            authDeleted = true // Consider this success - user doesn't exist
          }
        }
      } catch (fallbackError) {
        console.error('❌ Admin: Email fallback error:', fallbackError)
      }
    } else {
      console.log('✅ Admin: Successfully deleted user from Supabase Auth via userId')
      authDeleted = true
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
      message: authDeleted
        ? 'User deleted successfully from both Prisma and Supabase Auth. Active sessions will be auto-logged out by AuthContext.'
        : 'User deleted from Prisma database (Supabase Auth cleanup may have failed - check logs)',
      deleted: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        membershipCount: user.memberships.length,
        tenants: user.memberships.map(m => m.tenant.name),
        deletedFromAuth: authDeleted,
        deletedFromDatabase: true
      },
      note: 'Cached JWT tokens in browsers will remain valid until expiry (typically 1 hour), but AuthContext will auto-logout orphaned users after 3 seconds.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin delete user error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)

    // Check if it's a Prisma error
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    if (error && typeof error === 'object' && 'code' in error) {
      errorDetails += ` (Prisma error code: ${(error as any).code})`
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      details: errorDetails,
      hint: 'Check server logs for full error details. Ensure SUPABASE_SERVICE_ROLE_KEY is set in environment variables.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}