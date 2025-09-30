import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: List all invitations
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching all invitations...')

    const invitations = await prisma.invitation.findMany({
      include: {
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Found ${invitations.length} invitations`)

    return NextResponse.json({
      success: true,
      invitations,
      count: invitations.length
    })

  } catch (error) {
    console.error('❌ Error fetching invitations:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch invitations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}