import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: Lista alla users med deras memberships
export async function GET() {
  try {
    console.log('🔍 Admin: Fetching all users with memberships...')

    const users = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Admin: Found ${users.length} users`)

    return NextResponse.json({
      success: true,
      users: users,
      totalUsers: users.length,
      totalMemberships: users.reduce((acc, user) => acc + user.memberships.length, 0),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin users API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}