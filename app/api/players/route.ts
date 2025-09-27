import { NextRequest, NextResponse } from 'next/server'
import { playerService } from '../../../src/modules/players/services/playerService'
import { PlayerFilters } from '../../../src/modules/players/types/player'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

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

    // Use PlayerService to get real data from database
    const players = await playerService.getPlayers(tenant, filters)

    return NextResponse.json({
      success: true,
      data: players
    })
  } catch (error) {
    console.error('Players API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch players' },
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