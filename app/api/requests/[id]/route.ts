import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/server/authz'
import { getCountryByClub, getLeagueByClub } from '@/lib/club-country-mapping'

// Cache for requests (same as in main route)
const cache = new Map<string, { data: any, timestamp: number, etag: string }>()

// PATCH - Update a specific request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantSlug = request.nextUrl.searchParams.get('tenant')
    const body = await request.json()

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenant parameter is required' },
        { status: 400 }
      )
    }

    // Validate tenant access
    const authz = await requireTenant({ request })
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.message },
        { status: authz.status }
      )
    }

    const tenantId = authz.tenantId

    // Map EUR fields to Prisma schema fields (same as POST)
    const { transferFeeMinEUR, transferFeeMaxEUR, loanSalaryEUR, freeAgentSalaryEUR, signOnBonusEUR, dealType: dealTypeStr, windowOpenAt, windowCloseAt, ...restBody } = body

    // Auto-populate country and league if not provided
    const autoCountry = body.country || getCountryByClub(body.club) || ''
    const autoLeague = body.league || getLeagueByClub(body.club) || ''

    // Update the request
    const updatedRequest = await prisma.request.update({
      where: { id, tenantId }, // Ensure tenant isolation
      data: {
        ...restBody,
        country: autoCountry,
        league: autoLeague,
        dealType: dealTypeStr,
        windowOpenAt: windowOpenAt ? new Date(windowOpenAt) : null,
        windowCloseAt: windowCloseAt ? new Date(windowCloseAt) : null,
        // Map EUR fields to schema
        feeMin: transferFeeMinEUR || null,
        feeMax: transferFeeMaxEUR || null,
        salaryEur: loanSalaryEUR || freeAgentSalaryEUR || null,
        amountEur: signOnBonusEUR || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        description: true,
        club: true,
        country: true,
        league: true,
        position: true,
        status: true,
        priority: true,
        windowOpenAt: true,
        windowCloseAt: true,
        deadline: true,
        graceDays: true,
        dealType: true,
        feeMin: true,
        feeMax: true,
        salaryEur: true,
        amountEur: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache for this tenant
    const cacheKey = `requests-${tenantId}`
    cache.delete(cacheKey)
    console.log('🗑️ Requests: Invalidated cache for tenant', tenantId)

    // Map to frontend field names
    const mappedRequest = {
      ...updatedRequest,
      transferFeeMinEUR: updatedRequest.feeMin,
      transferFeeMaxEUR: updatedRequest.feeMax,
      loanSalaryEUR: updatedRequest.salaryEur,
      freeAgentSalaryEUR: updatedRequest.salaryEur,
      signOnBonusEUR: updatedRequest.amountEur
    }

    return NextResponse.json({
      success: true,
      data: mappedRequest
    })
  } catch (error) {
    console.error('Failed to update request:', error)
    return NextResponse.json(
      { error: 'Failed to update request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantSlug = request.nextUrl.searchParams.get('tenant')

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenant parameter is required' },
        { status: 400 }
      )
    }

    // Validate tenant access
    const authz = await requireTenant({ request })
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.message },
        { status: authz.status }
      )
    }

    const tenantId = authz.tenantId

    // Delete with tenant isolation
    await prisma.request.delete({
      where: { id, tenantId }
    })

    // Invalidate cache for this tenant
    const cacheKey = `requests-${tenantId}`
    cache.delete(cacheKey)
    console.log('🗑️ Requests: Invalidated cache for tenant after delete', tenantId)

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}