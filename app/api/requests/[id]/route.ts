import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/server/authz'
import { getCountryByClub, getLeagueByClub } from '@/lib/club-country-mapping'
import { apiCache } from '@/lib/api-cache'

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

    // Auto-populate country and league ONLY if provided in body
    const updateData: any = {
      ...restBody,
      updatedAt: new Date()
    }

    // Only update country/league if provided
    if (body.country !== undefined) {
      updateData.country = body.country || getCountryByClub(body.club) || ''
    }
    if (body.league !== undefined) {
      updateData.league = body.league || getLeagueByClub(body.club) || ''
    }

    // Only update dealType if provided
    if (dealTypeStr !== undefined) {
      updateData.dealType = dealTypeStr
    }

    // Only update window dates if provided (prevent NULL overwrite)
    if (windowOpenAt !== undefined) {
      updateData.windowOpenAt = windowOpenAt ? new Date(windowOpenAt) : null
    }
    if (windowCloseAt !== undefined) {
      updateData.windowCloseAt = windowCloseAt ? new Date(windowCloseAt) : null
    }

    // Only update EUR fields if provided
    if (transferFeeMinEUR !== undefined) {
      updateData.feeMin = transferFeeMinEUR || null
    }
    if (transferFeeMaxEUR !== undefined) {
      updateData.feeMax = transferFeeMaxEUR || null
    }
    if (loanSalaryEUR !== undefined || freeAgentSalaryEUR !== undefined) {
      updateData.salaryEur = loanSalaryEUR || freeAgentSalaryEUR || null
    }
    if (signOnBonusEUR !== undefined) {
      updateData.amountEur = signOnBonusEUR || null
    }

    // Update the request
    const updatedRequest = await prisma.request.update({
      where: { id, tenantId }, // Ensure tenant isolation
      data: updateData,
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
    apiCache.invalidatePattern(`requests-${tenantId}`)

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

    try {
      // Delete with tenant isolation
      await prisma.request.delete({
        where: { id, tenantId }
      })

      console.log('✅ Request deleted:', id)
    } catch (error: any) {
      // If record not found (P2025), treat as already deleted (idempotent)
      if (error?.code === 'P2025') {
        console.log('⚠️ Request already deleted or not found:', id)
      } else {
        throw error // Re-throw other errors
      }
    }

    // Invalidate cache for this tenant
    apiCache.invalidatePattern(`requests-${tenantId}`)

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