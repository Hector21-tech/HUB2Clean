import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, firstName, lastName, avatarUrl } = body

    if (!id || !email) {
      return NextResponse.json(
        { success: false, error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    console.log('🔄 User sync: Syncing user to database', {
      userId: id,
      email,
      firstName,
      lastName
    })

    // Upsert user in Prisma database
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        avatarUrl: avatarUrl || null
      },
      create: {
        id,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        avatarUrl: avatarUrl || null
      }
    })

    console.log('✅ User sync: Successfully synced user', {
      userId: user.id,
      email: user.email
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  } catch (error) {
    console.error('❌ User sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'User sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}