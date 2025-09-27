import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCountryByClub, getLeagueByClub } from '@/lib/club-country-mapping'
import { requireTenant } from '@/lib/server/authz'
import { Logger, createLogContext } from '@/lib/logger'

const prisma = new PrismaClient()

// GET - List all requests for a tenant
export async function GET(request: NextRequest) {
  const timer = Logger.timer()
  const baseContext = createLogContext(request)
  let tenantSlug: string | null = null
  let userId: string | undefined

  try {
    tenantSlug = request.nextUrl.searchParams.get('tenant')

    Logger.info('Requests API request started', {
      ...baseContext,
      status: 200,
      details: { tenantSlug }
    })

    if (!tenantSlug) {
      const duration = timer.end()
      Logger.warn('Missing tenant parameter', {
        ...baseContext,
        status: 400,
        duration
      })
      return NextResponse.json(
        { error: 'tenant parameter is required' },
        { status: 400 }
      )
    }

    // Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    userId = authz.ok ? authz.user?.id : 'anonymous'

    if (!authz.ok) {
      const duration = timer.end()
      Logger.warn('Tenant access denied', {
        ...baseContext,
        tenant: tenantSlug,
        userId,
        status: authz.status,
        duration,
        details: { message: authz.message }
      })
      return NextResponse.json(
        { error: authz.message },
        { status: authz.status }
      )
    }

    const tenantId = authz.tenantId

    const requests = await prisma.request.findMany({
      where: { tenantId },
      select: {
        id: true,
        title: true,
        description: true,
        club: true,
        country: true,
        league: true,
        position: true,
        status: true,
        priority: true,
        windowOpenAt: true,
        windowCloseAt: true,
        deadline: true,
        graceDays: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const duration = timer.end()
    Logger.success('Requests fetched successfully', {
      ...baseContext,
      tenant: tenantSlug,
      userId,
      status: 200,
      duration,
      details: { requestCount: requests.length }
    })

    return NextResponse.json({
      success: true,
      data: requests
    })
  } catch (error) {
    const duration = timer.end()
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    Logger.error('Failed to fetch requests', {
      ...baseContext,
      tenant: tenantSlug || 'unknown',
      userId: userId || 'anonymous',
      status: 500,
      duration,
      error: errorMessage
    })

    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// POST - Create a new request
export async function POST(request: NextRequest) {
  try {
    // Get tenant from query parameter
    const tenantSlug = request.nextUrl.searchParams.get('tenant')
    const body = await request.json()
    const { title, description, club, position, country, league } = body

    // Basic validation
    if (!tenantSlug || !title || !club) {
      return NextResponse.json(
        { error: 'tenant parameter, title, and club are required' },
        { status: 400 }
      )
    }

    // Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.message },
        { status: authz.status }
      )
    }

    const tenantId = authz.tenantId

    // Auto-populate country and league if not provided
    const autoCountry = country || getCountryByClub(club) || ''
    const autoLeague = league || getLeagueByClub(club) || ''

    console.log('Creating request with auto-populated data:', {
      club,
      autoCountry,
      autoLeague,
      providedCountry: country,
      providedLeague: league
    })

    const newRequest = await prisma.request.create({
      data: {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        title,
        description: description || '',
        club,
        country: autoCountry,
        league: autoLeague,
        position: position || null,
        // Set owner to authenticated user - using authz result
        ownerId: authz.user?.id || 'anonymous',
        priority: 'MEDIUM',
        status: 'OPEN'
      },
      select: {
        id: true,
        title: true,
        description: true,
        club: true,
        country: true,
        league: true,
        position: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: newRequest
    })
  } catch (error) {
    console.error('Failed to create request:', error)
    return NextResponse.json(
      { error: 'Failed to create request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}