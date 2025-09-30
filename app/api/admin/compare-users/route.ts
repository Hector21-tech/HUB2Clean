import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

// GET: Compare users between Prisma and Supabase Auth
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin: Comparing users between Prisma and Supabase Auth...')

    // Step 1: Get all users from Prisma
    const prismaUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        memberships: {
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Prisma: Found ${prismaUsers.length} users`)

    // Step 2: Get all users from Supabase Auth
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch all auth users (paginated)
    let allAuthUsers: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000
      })

      if (error) {
        throw new Error(`Supabase Auth error: ${error.message}`)
      }

      if (data.users.length > 0) {
        allAuthUsers = [...allAuthUsers, ...data.users]
        page++
      } else {
        hasMore = false
      }
    }

    console.log(`🔐 Supabase Auth: Found ${allAuthUsers.length} users`)

    // Step 3: Compare and find mismatches
    const prismaUserIds = new Set(prismaUsers.map(u => u.id))
    const authUserIds = new Set(allAuthUsers.map(u => u.id))

    // Users in Auth but NOT in Prisma (orphaned in Auth)
    const orphanedInAuth = allAuthUsers.filter(u => !prismaUserIds.has(u.id))

    // Users in Prisma but NOT in Auth (orphaned in Prisma)
    const orphanedInPrisma = prismaUsers.filter(u => !authUserIds.has(u.id))

    // Users in BOTH systems (synced correctly)
    const syncedUsers = prismaUsers.filter(u => authUserIds.has(u.id))

    // Step 4: Build detailed comparison report
    const comparison = {
      summary: {
        totalInPrisma: prismaUsers.length,
        totalInAuth: allAuthUsers.length,
        synced: syncedUsers.length,
        orphanedInAuth: orphanedInAuth.length,
        orphanedInPrisma: orphanedInPrisma.length,
        isInSync: orphanedInAuth.length === 0 && orphanedInPrisma.length === 0
      },
      orphanedInAuth: orphanedInAuth.map(u => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        emailConfirmed: u.email_confirmed_at ? true : false,
        lastSignIn: u.last_sign_in_at,
        metadata: u.user_metadata
      })),
      orphanedInPrisma: orphanedInPrisma.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        createdAt: u.createdAt,
        membershipCount: u.memberships.length,
        memberships: u.memberships.map(m => ({
          tenant: m.tenant.name,
          role: m.role
        }))
      })),
      syncedUsers: syncedUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null,
        membershipCount: u.memberships.length
      }))
    }

    console.log('✅ Comparison complete:', {
      prisma: prismaUsers.length,
      auth: allAuthUsers.length,
      synced: syncedUsers.length,
      orphanedAuth: orphanedInAuth.length,
      orphanedPrisma: orphanedInPrisma.length
    })

    return NextResponse.json({
      success: true,
      comparison,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin compare users error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to compare users',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check that SUPABASE_SERVICE_ROLE_KEY is set in environment variables',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}