import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    // Mock players data for development
    const mockPlayers = [
      {
        id: 'player-1',
        firstName: 'Marcus',
        lastName: 'Lindberg',
        dateOfBirth: '1995-03-15',
        nationality: 'Sweden',
        positions: ['CAM', 'LW'],
        club: 'IFK Göteborg',
        height: 178,
        rating: 8.2,
        notes: 'Mycket teknisk spelare med exceptionella avslut.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        tenantId: tenant || 'test-tenant'
      },
      {
        id: 'player-2',
        firstName: 'Erik',
        lastName: 'Johansson',
        dateOfBirth: '1998-08-22',
        nationality: 'Sweden',
        positions: ['CB', 'DMF'],
        club: 'Free Agent',
        height: 185,
        rating: 7.8,
        notes: 'Stark i luften och bra med bollen vid fötterna.',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        tenantId: tenant || 'test-tenant'
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockPlayers
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

    // Mock player creation
    const newPlayer = {
      id: `player-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

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