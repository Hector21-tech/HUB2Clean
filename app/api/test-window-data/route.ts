import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Creating comprehensive test data with window scenarios...')

    const body = await request.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID is required'
      }, { status: 400 })
    }

    console.log('🎯 Creating test data for tenant:', tenantId)

    const now = new Date()
    const userId = '7d092ae6-be50-4d74-ba12-991bb120330e' // From production logs

    // Clear existing test data
    await prisma.request.deleteMany({
      where: {
        tenantId,
        title: {
          startsWith: 'TEST:'
        }
      }
    })

    await prisma.player.deleteMany({
      where: {
        tenantId,
        firstName: {
          startsWith: 'TEST'
        }
      }
    })

    await prisma.trial.deleteMany({
      where: {
        tenantId,
        location: {
          startsWith: 'TEST:'
        }
      }
    })

    console.log('✅ Cleared existing test data')

    // Test scenarios with different window statuses
    const testRequests = [
      {
        id: `test-open-${Date.now()}`,
        tenantId,
        title: 'TEST: Premier League Summer Window (OPEN)',
        description: 'Transfer window currently open with plenty of time',
        club: 'Arsenal FC',
        position: 'ST',
        country: 'England',
        ownerId: userId,
        priority: 'HIGH',
        status: 'OPEN',
        windowOpenAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        windowCloseAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        graceDays: 3
      },
      {
        id: `test-closes-soon-${Date.now()}`,
        tenantId,
        title: 'TEST: Bundesliga Window (CLOSES SOON)',
        description: 'Window closing in 5 days - act fast!',
        club: 'Bayern Munich',
        position: 'CAM',
        country: 'Germany',
        ownerId: userId,
        priority: 'URGENT',
        status: 'OPEN',
        windowOpenAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        windowCloseAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        graceDays: 3
      },
      {
        id: `test-paperwork-${Date.now()}`,
        tenantId,
        title: 'TEST: Serie A Window (PAPERWORK DEADLINE)',
        description: 'Paperwork deadline approaching - critical!',
        club: 'AC Milan',
        position: 'CB',
        country: 'Italy',
        ownerId: userId,
        priority: 'URGENT',
        status: 'OPEN',
        windowOpenAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        windowCloseAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        graceDays: 3
      },
      {
        id: `test-grace-${Date.now()}`,
        tenantId,
        title: 'TEST: La Liga Window (GRACE PERIOD)',
        description: 'In grace period - very limited time!',
        club: 'Real Madrid',
        position: 'LW',
        country: 'Spain',
        ownerId: userId,
        priority: 'URGENT',
        status: 'OPEN',
        windowOpenAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        windowCloseAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        graceDays: 3
      },
      {
        id: `test-opens-soon-${Date.now()}`,
        tenantId,
        title: 'TEST: Allsvenskan Winter Window (OPENS SOON)',
        description: 'Winter window opens in 2 weeks',
        club: 'AIK Stockholm',
        position: 'RB',
        country: 'Sweden',
        ownerId: userId,
        priority: 'MEDIUM',
        status: 'OPEN',
        windowOpenAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        windowCloseAt: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
        graceDays: 3
      },
      {
        id: `test-expired-${Date.now()}`,
        tenantId,
        title: 'TEST: Saudi Pro League (EXPIRED)',
        description: 'Transfer window closed and expired',
        club: 'Al Hilal',
        position: 'CDM',
        country: 'Saudi Arabia',
        ownerId: userId,
        priority: 'LOW',
        status: 'EXPIRED',
        windowOpenAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        windowCloseAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        graceDays: 3
      },
      {
        id: `test-no-window-${Date.now()}`,
        tenantId,
        title: 'TEST: Free Agent Signing (NO WINDOW)',
        description: 'Free agent - no transfer window restrictions',
        club: 'Inter Miami',
        position: 'GK',
        country: 'USA',
        ownerId: userId,
        priority: 'MEDIUM',
        status: 'OPEN',
        windowOpenAt: null,
        windowCloseAt: null,
        graceDays: 0
      }
    ]

    // Create all test requests
    for (const requestData of testRequests) {
      await prisma.request.create({
        data: requestData
      })
      console.log(`✅ Created: ${requestData.title}`)
    }

    // Create test players
    const testPlayers = [
      {
        id: `test-player-1-${Date.now()}`,
        tenantId,
        firstName: 'TEST Marcus',
        lastName: 'Rashford',
        dateOfBirth: new Date('1997-10-31'),
        nationality: 'England',
        position: 'LW, ST',
        club: 'Manchester United',
        height: 180,
        rating: 8.5,
        notes: 'TEST: Fast winger with great finishing ability',
        tags: ['pace', 'finishing', 'young talent']
      },
      {
        id: `test-player-2-${Date.now()}`,
        tenantId,
        firstName: 'TEST Erling',
        lastName: 'Haaland',
        dateOfBirth: new Date('2000-07-21'),
        nationality: 'Norway',
        position: 'ST',
        club: 'Manchester City',
        height: 194,
        rating: 9.2,
        notes: 'TEST: Elite goalscorer with physical presence',
        tags: ['goalscorer', 'physical', 'elite']
      },
      {
        id: `test-player-3-${Date.now()}`,
        tenantId,
        firstName: 'TEST Pedri',
        lastName: 'González',
        dateOfBirth: new Date('2002-11-25'),
        nationality: 'Spain',
        position: 'CAM, CM',
        club: 'FC Barcelona',
        height: 174,
        rating: 8.0,
        notes: 'TEST: Technical midfielder with excellent vision',
        tags: ['technical', 'vision', 'young']
      },
      {
        id: `test-player-4-${Date.now()}`,
        tenantId,
        firstName: 'TEST Virgil',
        lastName: 'van Dijk',
        dateOfBirth: new Date('1991-07-08'),
        nationality: 'Netherlands',
        position: 'CB',
        club: 'Liverpool FC',
        height: 193,
        rating: 8.8,
        notes: 'TEST: World-class defender with leadership qualities',
        tags: ['defender', 'leader', 'aerial']
      },
      {
        id: `test-player-5-${Date.now()}`,
        tenantId,
        firstName: 'TEST Gianluigi',
        lastName: 'Donnarumma',
        dateOfBirth: new Date('1999-02-25'),
        nationality: 'Italy',
        position: 'GK',
        club: 'Paris Saint-Germain',
        height: 196,
        rating: 8.3,
        notes: 'TEST: Elite goalkeeper with excellent reflexes',
        tags: ['goalkeeper', 'reflexes', 'experienced']
      }
    ]

    for (const player of testPlayers) {
      await prisma.player.create({
        data: player
      })
      console.log(`✅ Created player: ${player.firstName} ${player.lastName}`)
    }

    // Create test trials
    const testTrials = [
      {
        id: `test-trial-1-${Date.now()}`,
        tenantId,
        playerId: testPlayers[0].id,
        requestId: testRequests[0].id,
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        location: 'TEST: Arsenal Training Ground',
        status: 'SCHEDULED' as const,
        notes: 'Initial assessment for Premier League position'
      },
      {
        id: `test-trial-2-${Date.now()}`,
        tenantId,
        playerId: testPlayers[1].id,
        requestId: testRequests[1].id,
        scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        location: 'TEST: Bayern Munich Training Facility',
        status: 'COMPLETED' as const,
        notes: 'Excellent performance in trial',
        rating: 9.0,
        feedback: 'Outstanding goalscoring ability demonstrated'
      },
      {
        id: `test-trial-3-${Date.now()}`,
        tenantId,
        playerId: testPlayers[2].id,
        requestId: testRequests[2].id,
        scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        location: 'TEST: AC Milan Milanello',
        status: 'SCHEDULED' as const,
        notes: 'Technical evaluation for midfield role'
      },
      {
        id: `test-trial-4-${Date.now()}`,
        tenantId,
        playerId: testPlayers[3].id,
        requestId: testRequests[3].id,
        scheduledAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        location: 'TEST: Real Madrid Valdebebas',
        status: 'COMPLETED' as const,
        notes: 'Solid defensive display',
        rating: 8.5,
        feedback: 'Strong aerial presence and leadership'
      }
    ]

    for (const trial of testTrials) {
      await prisma.trial.create({
        data: trial
      })
      console.log(`✅ Created trial: ${trial.location}`)
    }

    console.log('🎉 All test data created successfully!')

    return NextResponse.json({
      success: true,
      message: 'Comprehensive test data created successfully',
      data: {
        tenantId,
        requestsCreated: testRequests.length,
        playersCreated: testPlayers.length,
        trialsCreated: testTrials.length,
        scenarios: [
          'OPEN - Window with plenty of time',
          'CLOSES_SOON - Window closing in 5 days',
          'PAPERWORK_DEADLINE - Critical timing',
          'GRACE_PERIOD - Limited time after close',
          'OPENS_SOON - Future window opening',
          'EXPIRED - Closed and past grace period',
          'NO_WINDOW - Free agent signing'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Failed to create test data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create test window data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}