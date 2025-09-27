import { NextRequest, NextResponse } from 'next/server'
import { trialService } from '@/modules/trials/services/trialService'
import { TrialFilters, CreateTrialInput } from '@/modules/trials/types/trial'
import { requireTenant } from '@/lib/server/authz'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Fetch trials for a tenant
export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Trials GET: Starting request processing...');

    // Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      console.log('❌ Trials GET: Auth failed:', {
        status: authz.status,
        message: authz.message
      });
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      );
    }

    const tenantId = authz.tenantId;
    console.log('✅ Trials GET: Auth success for tenant:', tenantId);

    // Parse filters from query params
    const { searchParams } = new URL(request.url)
    const filters: TrialFilters = {}

    const status = searchParams.get('status')
    if (status) {
      filters.status = status.split(',') as any[]
    }

    const playerId = searchParams.get('playerId')
    if (playerId) {
      filters.playerId = playerId
    }

    const requestId = searchParams.get('requestId')
    if (requestId) {
      filters.requestId = requestId
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    const trials = await trialService.getTrials(tenantId, filters)

    return NextResponse.json({
      success: true,
      data: trials
    })

  } catch (error) {
    console.error('Error fetching trials:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trials' },
      { status: 500 }
    )
  }
}

// POST - Create a new trial
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Trials POST: Starting trial creation...');

    // Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      console.log('❌ Trials POST: Auth failed:', {
        status: authz.status,
        message: authz.message
      });
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      );
    }

    const tenantId = authz.tenantId;
    console.log('✅ Trials POST: Auth success for tenant:', tenantId);

    const body = await request.json()
    console.log('📋 Trials POST: Request body:', body);

    const trialData: CreateTrialInput = {
      playerId: body.playerId,
      requestId: body.requestId || null,
      scheduledAt: new Date(body.scheduledAt),
      location: body.location || null,
      notes: body.notes || null
    }

    console.log('📋 Trials POST: Processed trial data:', trialData);

    // Validate required fields
    if (!trialData.playerId || !trialData.scheduledAt) {
      console.log('❌ Trials POST: Missing required fields:', {
        hasPlayerId: !!trialData.playerId,
        hasScheduledAt: !!trialData.scheduledAt
      });
      return NextResponse.json(
        { success: false, error: 'Player ID and scheduled date are required' },
        { status: 400 }
      )
    }

    console.log('🔄 Trials POST: Calling trialService.createTrial...');
    const trial = await trialService.createTrial(tenantId, trialData)
    console.log('✅ Trials POST: Trial created successfully:', trial.id);

    return NextResponse.json({
      success: true,
      data: trial
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Trials POST: Error creating trial:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create trial' },
      { status: 500 }
    )
  }
}