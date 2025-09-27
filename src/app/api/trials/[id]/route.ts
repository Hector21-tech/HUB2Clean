import { NextRequest, NextResponse } from 'next/server'
import { trialService } from '@/modules/trials/services/trialService'
import { UpdateTrialInput } from '@/modules/trials/types/trial'
import { requireTenant } from '@/lib/server/authz'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Fetch a specific trial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      );
    }

    const tenantId = authz.tenantId;

    const trial = await trialService.getTrialById(id, tenantId)

    if (!trial) {
      return NextResponse.json(
        { success: false, error: 'Trial not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: trial
    })

  } catch (error) {
    console.error('Error fetching trial:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trial' },
      { status: 500 }
    )
  }
}

// PUT - Update a trial
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      );
    }

    const tenantId = authz.tenantId;

    const body = await request.json()
    const updateData: UpdateTrialInput = {}

    // Only include fields that are provided
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = new Date(body.scheduledAt)
    }
    if (body.location !== undefined) {
      updateData.location = body.location
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }
    if (body.rating !== undefined) {
      updateData.rating = body.rating
    }
    if (body.feedback !== undefined) {
      updateData.feedback = body.feedback
    }

    const trial = await trialService.updateTrial(id, tenantId, updateData)

    return NextResponse.json({
      success: true,
      data: trial
    })

  } catch (error) {
    console.error('Error updating trial:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update trial' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a trial
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate tenant access using consistent auth
    const authz = await requireTenant({ request });
    if (!authz.ok) {
      return NextResponse.json(
        { success: false, error: authz.message },
        { status: authz.status }
      );
    }

    const tenantId = authz.tenantId;

    await trialService.deleteTrial(id, tenantId)

    return NextResponse.json({
      success: true,
      message: 'Trial deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting trial:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete trial' },
      { status: 500 }
    )
  }
}