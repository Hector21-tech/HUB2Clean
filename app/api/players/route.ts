import { NextRequest, NextResponse } from 'next/server'
import { playerService } from '../../../src/modules/players/services/playerService'
import { PlayerFilters } from '../../../src/modules/players/types/player'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenant = searchParams.get('tenant')

  console.log('🚀 Players API GET called:', {
    tenant,
    environment: process.env.NODE_ENV,
    url: request.url,
    timestamp: new Date().toISOString()
  })

  try {
    if (!tenant) {
      console.error('❌ No tenant provided in request')
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    console.log('🔧 Environment check:', {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })

    // Parse filters from query params
    const filters: PlayerFilters = {}
    const search = searchParams.get('search')
    const position = searchParams.get('position')
    const nationality = searchParams.get('nationality')
    const club = searchParams.get('club')
    const ageMin = searchParams.get('ageMin')
    const ageMax = searchParams.get('ageMax')
    const ratingMin = searchParams.get('ratingMin')
    const ratingMax = searchParams.get('ratingMax')

    if (search) filters.search = search
    if (position) filters.position = position
    if (nationality) filters.nationality = nationality
    if (club) filters.club = club
    if (ageMin) filters.ageMin = parseInt(ageMin)
    if (ageMax) filters.ageMax = parseInt(ageMax)
    if (ratingMin) filters.ratingMin = parseFloat(ratingMin)
    if (ratingMax) filters.ratingMax = parseFloat(ratingMax)

    console.log('📋 Filters parsed:', { filters, tenant })

    console.log('🔄 Calling playerService.getPlayers...')
    // Use PlayerService to get real data from database
    const players = await playerService.getPlayers(tenant, filters)

    console.log('✅ Players fetched successfully:', {
      count: players.length,
      tenant,
      samplePlayerIds: players.slice(0, 3).map(p => p.id)
    })

    return NextResponse.json({
      success: true,
      data: players
    })
  } catch (error) {
    console.error('❌ Players API CRITICAL ERROR:', error)
    console.error('❌ Complete error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined,
      tenant: tenant,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV
    })

    // Log additional context that might help identify the issue
    console.error('❌ Additional context:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      searchParams: Object.fromEntries(searchParams.entries())
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch players',
        debug: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        tenant: tenant
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: firstName, lastName, tenantId' },
        { status: 400 }
      )
    }

    // Use PlayerService to create real player in database
    const newPlayer = await playerService.createPlayer(body)

    return NextResponse.json({
      success: true,
      data: newPlayer
    })
  } catch (error) {
    console.error('Player creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create player' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('id')

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Use PlayerService to update player in database
    const updatedPlayer = await playerService.updatePlayer(playerId, body)

    return NextResponse.json({
      success: true,
      data: updatedPlayer
    })
  } catch (error) {
    console.error('Player update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update player' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('id')

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Use PlayerService to update player in database
    const updatedPlayer = await playerService.updatePlayer(playerId, body)

    return NextResponse.json({
      success: true,
      data: updatedPlayer
    })
  } catch (error) {
    console.error('Player update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update player' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('id')
    const tenantId = searchParams.get('tenantId')

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      )
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify player belongs to tenant before deleting for security
    const player = await playerService.getPlayerById(playerId)
    if (!player || player.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Player not found or access denied' },
        { status: 404 }
      )
    }

    // Use PlayerService to delete player from database
    await playerService.deletePlayer(playerId)

    return NextResponse.json({
      success: true,
      message: 'Player deleted successfully'
    })
  } catch (error) {
    console.error('Player deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete player' },
      { status: 500 }
    )
  }
}