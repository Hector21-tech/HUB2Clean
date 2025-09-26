// Scout Hub Players API - Complete CRUD operations
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/server/authz'
import { transformToDatabase, transformDatabasePlayer, validatePlayerData } from '@/lib/player-utils'
import type { DatabasePlayer, PlayerResponse } from '@/lib/types/player'

// Force Node.js runtime for better error handling
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    console.log('👤 Players GET: Starting request processing...')

    // 1. Tenant resolution and authorization
    const url = new URL(req.url)
    const tenantSlug = url.searchParams.get('tenant')
    const dryRun = url.searchParams.get('dryRun') === '1'

    console.log('🔍 Players GET: Request params:', {
      tenantSlug,
      dryRun,
      fullUrl: req.url
    })

    const authz = await requireTenant({ request: req })
    if (!authz.ok) {
      console.log('❌ Players GET: Auth failed:', {
        status: authz.status,
        message: authz.message,
        tenantSlug
      })
      return NextResponse.json(
        { success: false, error: authz.message, code: 'AUTH_FAILED' } satisfies PlayerResponse,
        { status: authz.status }
      )
    }

    console.log('✅ Players GET: Auth successful:', {
      tenantSlug,
      resolvedTenantId: authz.tenantId,
      userId: authz.user?.id
    })

    // Dry-run mode for testing
    if (dryRun) {
      const dryRunResult: PlayerResponse = {
        success: true,
        data: [],
        meta: {
          count: 0,
          tenantId: authz.tenantId
        }
      }
      console.log('🧪 Players GET: Dry run result:', dryRunResult)
      return NextResponse.json(dryRunResult)
    }

    // 2. Database query
    console.log('🗄️ Players GET: Executing database query...')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('tenant_id', authz.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('❌ Players GET: Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        tenantId: authz.tenantId
      })

      return NextResponse.json(
        { success: false, error: error.message, code: 'DATABASE_ERROR' } satisfies PlayerResponse,
        { status: 500 }
      )
    }

    console.log('✅ Players GET: Query successful:', {
      playerCount: data?.length || 0,
      tenantId: authz.tenantId
    })

    // 3. Transform database data to frontend format
    let transformedData = []
    try {
      transformedData = data?.map((player: DatabasePlayer) => {
        return transformDatabasePlayer(player)
      }) || []

      console.log('✅ Players GET: Data transformation successful:', {
        transformedCount: transformedData.length
      })
    } catch (transformError: any) {
      console.log('❌ Players GET: Data transformation failed:', {
        error: transformError?.message || 'Unknown error',
        rawDataSample: data?.[0]
      })

      return NextResponse.json(
        {
          success: false,
          error: `Data transformation failed: ${transformError?.message || 'Unknown error'}`,
          code: 'TRANSFORM_ERROR'
        } satisfies PlayerResponse,
        { status: 500 }
      )
    }

    const result: PlayerResponse = {
      success: true,
      data: transformedData,
      meta: {
        count: transformedData.length,
        tenantId: authz.tenantId
      }
    }

    console.log('🎉 Players GET: Success, returning data')
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('💥 Players GET: Unexpected error:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack?.substring(0, 500)
    })

    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Internal server error',
        code: error?.code ?? 'INTERNAL_ERROR'
      } satisfies PlayerResponse,
      { status: error?.status ?? 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    console.log('👤 Players POST: Starting request processing...')

    // 1. Tenant resolution and authorization
    const url = new URL(req.url)
    const tenantSlug = url.searchParams.get('tenant')
    const dryRun = url.searchParams.get('dryRun') === '1'

    console.log('🔍 Players POST: Request params:', {
      tenantSlug,
      dryRun,
      fullUrl: req.url
    })

    const authz = await requireTenant({ request: req })
    if (!authz.ok) {
      console.log('❌ Players POST: Auth failed:', {
        status: authz.status,
        message: authz.message,
        tenantSlug
      })
      return NextResponse.json(
        { success: false, error: authz.message, code: 'AUTH_FAILED' } satisfies PlayerResponse,
        { status: authz.status }
      )
    }

    console.log('✅ Players POST: Auth successful:', {
      tenantSlug,
      resolvedTenantId: authz.tenantId,
      userId: authz.user?.id
    })

    // 2. Parse and validate request body
    const body = await req.json()
    console.log('🔍 Players POST: Raw body received:', {
      keys: Object.keys(body),
      hasFirstName: !!body.firstName,
      hasLastName: !!body.lastName,
      bodySize: JSON.stringify(body).length
    })

    // Validate required fields
    const validation = validatePlayerData(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          code: 'VALIDATION_ERROR'
        } satisfies PlayerResponse,
        { status: 400 }
      )
    }

    // 3. Transform frontend data to database format
    const cleanData = transformToDatabase(body)
    console.log('🔍 Players POST: Data after transform:', {
      keys: Object.keys(cleanData),
      position: cleanData.position,
      tags: cleanData.tags
    })

    // 4. Final payload with server-side tenant injection
    const payload = { ...cleanData, tenant_id: authz.tenantId }

    console.log('🔍 Players POST: Final payload:', {
      keys: Object.keys(payload),
      tenantId: payload.tenant_id,
      hasId: 'id' in payload
    })

    // Dry-run mode for testing
    if (dryRun) {
      const dryRunResult: PlayerResponse = {
        success: true,
        data: undefined,
        meta: {
          tenantId: authz.tenantId
        }
      }
      console.log('🧪 Players POST: Dry run result:', dryRunResult)
      return NextResponse.json(dryRunResult)
    }

    // 5. Database insert
    console.log('🗄️ Players POST: Executing database insert...')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('players')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.log('❌ Players POST: Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })

      return NextResponse.json(
        { success: false, error: error.message, code: 'DATABASE_ERROR' } satisfies PlayerResponse,
        { status: 500 }
      )
    }

    console.log('✅ Players POST: Insert successful:', {
      playerId: data?.id,
      tenantId: authz.tenantId
    })

    // 6. Transform back to frontend format
    const transformedResult = data ? transformDatabasePlayer(data as DatabasePlayer) : undefined

    const result: PlayerResponse = {
      success: true,
      data: transformedResult,
      meta: {
        tenantId: authz.tenantId,
        playerId: data?.id
      }
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('💥 Players POST: Unexpected error:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack?.substring(0, 500)
    })

    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Internal server error',
        code: error?.code ?? 'INTERNAL_ERROR'
      } satisfies PlayerResponse,
      { status: error?.status ?? 500 }
    )
  }
}