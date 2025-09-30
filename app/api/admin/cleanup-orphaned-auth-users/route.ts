import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST: Bulk delete orphaned users from Supabase Auth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds, confirmCleanup } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'userIds array is required'
      }, { status: 400 })
    }

    if (!confirmCleanup) {
      return NextResponse.json({
        success: false,
        error: 'confirmCleanup must be true to proceed with deletion',
        hint: 'This is a safety check. Set confirmCleanup: true in request body.'
      }, { status: 400 })
    }

    console.log(`🧹 Admin: Starting cleanup of ${userIds.length} orphaned Auth users...`)

    // Initialize Supabase Admin client
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

    // Delete users one by one and track results
    const results = {
      successful: [] as string[],
      failed: [] as { userId: string, error: string }[],
      total: userIds.length
    }

    for (const userId of userIds) {
      try {
        console.log(`🗑️ Deleting user from Auth: ${userId}`)

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
          console.error(`❌ Failed to delete ${userId}:`, error.message)
          results.failed.push({
            userId,
            error: error.message
          })
        } else {
          console.log(`✅ Successfully deleted ${userId} from Auth`)
          results.successful.push(userId)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`❌ Exception deleting ${userId}:`, errorMsg)
        results.failed.push({
          userId,
          error: errorMsg
        })
      }
    }

    console.log('✅ Cleanup complete:', {
      total: results.total,
      successful: results.successful.length,
      failed: results.failed.length
    })

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${results.successful.length}/${results.total} users deleted`,
      results: {
        totalRequested: results.total,
        successfulDeletions: results.successful.length,
        failedDeletions: results.failed.length,
        successful: results.successful,
        failed: results.failed
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin cleanup error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup orphaned users',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check that SUPABASE_SERVICE_ROLE_KEY is set in environment variables',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET: Get list of orphaned Auth users (dry-run, no deletion)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin: Fetching orphaned Auth users (dry-run)...')

    // This would need to be integrated with the compare-users endpoint
    // For now, return instructions
    return NextResponse.json({
      success: true,
      message: 'Use POST with userIds array to delete orphaned users',
      instructions: {
        step1: 'Call GET /api/admin/compare-users to get orphaned users',
        step2: 'Extract user IDs from comparison.orphanedInAuth',
        step3: 'POST to this endpoint with: { userIds: [...], confirmCleanup: true }',
        example: {
          method: 'POST',
          body: {
            userIds: ['user-id-1', 'user-id-2'],
            confirmCleanup: true
          }
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch instructions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}