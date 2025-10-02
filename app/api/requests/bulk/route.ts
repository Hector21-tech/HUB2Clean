import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/server/authz'
import { apiCache, dashboardCache, generateCacheKey } from '@/lib/api-cache'

/**
 * Bulk operations for requests
 * Handles multiple requests in a single API call for performance
 */
export async function POST(request: NextRequest) {
  try {
    const tenantSlug = request.nextUrl.searchParams.get('tenant')
    const body = await request.json()

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenant parameter is required' },
        { status: 400 }
      )
    }

    // Validate tenant access (only once for all requests)
    const authz = await requireTenant({ request })
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.message },
        { status: authz.status }
      )
    }

    const tenantId = authz.tenantId
    const { action, requestIds, status: newStatus } = body

    if (!action || !requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: 'action and requestIds array are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Bulk ${action}:`, { count: requestIds.length, tenantId })

    let result: any

    switch (action) {
      case 'update_status':
        if (!newStatus) {
          return NextResponse.json(
            { error: 'status is required for update_status action' },
            { status: 400 }
          )
        }

        // Single database transaction for all updates
        await prisma.request.updateMany({
          where: {
            id: { in: requestIds },
            tenantId // Ensure tenant isolation
          },
          data: {
            status: newStatus,
            updatedAt: new Date()
          }
        })

        // Fetch updated requests to return
        const updatedRequests = await prisma.request.findMany({
          where: {
            id: { in: requestIds },
            tenantId
          }
        })

        console.log(`✅ Bulk updated ${updatedRequests.length} requests to ${newStatus}`)
        result = {
          action: 'update_status',
          updated: updatedRequests.length,
          requests: updatedRequests
        }
        break

      case 'delete':
        // Single database transaction for all deletes
        const deleteResult = await prisma.request.deleteMany({
          where: {
            id: { in: requestIds },
            tenantId // Ensure tenant isolation
          }
        })

        console.log(`✅ Bulk deleted ${deleteResult.count} requests`)
        result = {
          action: 'delete',
          deleted: deleteResult.count
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Invalidate both requests cache AND dashboard cache
    apiCache.invalidatePattern(`requests-${tenantId}`)
    dashboardCache.invalidate(generateCacheKey('dashboard', tenantId))

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Bulk operation failed:', error)
    return NextResponse.json(
      { error: 'Bulk operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
