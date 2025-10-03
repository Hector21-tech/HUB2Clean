import { NextRequest, NextResponse } from 'next/server'
import { apiCache, dashboardCache, generateCacheKey } from '@/lib/api-cache'
import { trialService } from '@/modules/trials/services/trialService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // 🎯 USE TRIAL SERVICE: This handles calendar event deletion automatically
    const evaluatedTrial = await trialService.evaluateTrial(id, tenant, body)

    // Invalidate trials, events, AND dashboard cache (evaluation deletes calendar event)
    apiCache.invalidatePattern(`trials-${tenant}`)
    apiCache.invalidatePattern(`events-${tenant}`)
    dashboardCache.invalidate(generateCacheKey('dashboard', tenant))

    return NextResponse.json({
      success: true,
      data: evaluatedTrial
    })
  } catch (error) {
    console.error('Trial evaluation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate trial' },
      { status: 500 }
    )
  }
}