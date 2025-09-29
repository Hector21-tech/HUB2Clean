import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: Lista alla tenants med stats
export async function GET() {
  try {
    console.log('🔍 Admin: Fetching all tenants with stats...')

    // Fetch tenants with aggregated data
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            players: true,
            requests: true,
            trials: true,
            events: true
          }
        },
        memberships: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Admin: Found ${tenants.length} tenants`)

    // Transform data for admin UI
    const tenantStats = tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      stats: {
        users: tenant._count.memberships,
        players: tenant._count.players,
        requests: tenant._count.requests,
        trials: tenant._count.trials,
        events: tenant._count.events
      },
      members: tenant.memberships.map(membership => ({
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: membership.user
      }))
    }))

    return NextResponse.json({
      success: true,
      tenants: tenantStats,
      totalTenants: tenants.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin tenants API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tenants',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE: Ta bort tenant (för Test1)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('id')
    const tenantSlug = searchParams.get('slug')

    if (!tenantId && !tenantSlug) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID or slug required'
      }, { status: 400 })
    }

    console.log('🗑️ Admin: Deleting tenant:', { tenantId, tenantSlug })

    // Find tenant first
    const whereClause = tenantId ? { id: tenantId } : { slug: tenantSlug! }
    const tenant = await prisma.tenant.findFirst({
      where: whereClause,
      include: {
        _count: {
          select: {
            memberships: true,
            players: true,
            requests: true,
            trials: true,
            events: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({
        success: false,
        error: 'Tenant not found'
      }, { status: 404 })
    }

    // Safety check: Don't delete if has significant data
    const hasSignificantData =
      tenant._count.players > 0 ||
      tenant._count.requests > 0 ||
      tenant._count.trials > 0

    console.log('📊 Tenant deletion check:', {
      tenantName: tenant.name,
      players: tenant._count.players,
      requests: tenant._count.requests,
      trials: tenant._count.trials,
      hasSignificantData
    })

    // Delete tenant (CASCADE will handle related records)
    await prisma.tenant.delete({
      where: { id: tenant.id }
    })

    console.log('✅ Admin: Successfully deleted tenant:', tenant.name)

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenant.name}" deleted successfully`,
      deletedTenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      },
      hadData: hasSignificantData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin delete tenant error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to delete tenant',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}