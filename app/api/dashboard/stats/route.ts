// Scout Hub Dashboard Statistics API
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/server/authz'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    console.log('📊 Dashboard Stats: Starting request processing...')

    // 1. Tenant resolution and authorization
    const authz = await requireTenant({ request: req })
    if (!authz.ok) {
      console.log('❌ Dashboard Stats: Auth failed:', {
        status: authz.status,
        message: authz.message
      })
      return NextResponse.json(
        { success: false, error: authz.message, code: 'AUTH_FAILED' },
        { status: authz.status }
      )
    }

    console.log('✅ Dashboard Stats: Auth successful:', {
      resolvedTenantId: authz.tenantId,
      userId: authz.user?.id
    })

    // 2. Get database statistics
    const supabase = await createClient()

    // Get player count
    const { count: playerCount, error: playerError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', authz.tenantId)

    if (playerError) {
      console.log('❌ Dashboard Stats: Player count error:', playerError)
    }

    // Get recent players (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentPlayerCount, error: recentError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', authz.tenantId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (recentError) {
      console.log('❌ Dashboard Stats: Recent players error:', recentError)
    }

    // Get top positions
    const { data: positionData, error: positionError } = await supabase
      .from('players')
      .select('position')
      .eq('tenant_id', authz.tenantId)
      .not('position', 'is', null)

    let positionStats: Record<string, number> = {}
    if (!positionError && positionData) {
      positionStats = positionData.reduce((acc: Record<string, number>, player: any) => {
        if (player.position) {
          const positions = player.position.split(', ').map((p: string) => p.trim())
          positions.forEach((pos: string) => {
            acc[pos] = (acc[pos] || 0) + 1
          })
        }
        return acc
      }, {})
    }

    // Get rating distribution
    const { data: ratingData, error: ratingError } = await supabase
      .from('players')
      .select('rating')
      .eq('tenant_id', authz.tenantId)
      .not('rating', 'is', null)

    let averageRating = 0
    if (!ratingError && ratingData && ratingData.length > 0) {
      const totalRating = ratingData.reduce((sum: number, player: any) => sum + (player.rating || 0), 0)
      averageRating = Math.round((totalRating / ratingData.length) * 10) / 10
    }

    const stats = {
      success: true,
      data: {
        overview: {
          totalPlayers: playerCount || 0,
          recentPlayers: recentPlayerCount || 0,
          averageRating: averageRating,
          lastUpdated: new Date().toISOString()
        },
        positions: positionStats,
        trends: {
          playersThisMonth: recentPlayerCount || 0,
          growthRate: playerCount && recentPlayerCount
            ? Math.round(((recentPlayerCount / playerCount) * 100) * 10) / 10
            : 0
        }
      },
      meta: {
        tenantId: authz.tenantId,
        generatedAt: new Date().toISOString()
      }
    }

    console.log('✅ Dashboard Stats: Success:', {
      totalPlayers: stats.data.overview.totalPlayers,
      recentPlayers: stats.data.overview.recentPlayers,
      tenantId: authz.tenantId
    })

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('💥 Dashboard Stats: Unexpected error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 500)
    })

    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Internal server error',
        code: error?.code ?? 'INTERNAL_ERROR'
      },
      { status: error?.status ?? 500 }
    )
  }
}