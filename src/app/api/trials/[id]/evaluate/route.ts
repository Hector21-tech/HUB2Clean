import { NextRequest, NextResponse } from 'next/server'
import { trialService } from '@/modules/trials/services/trialService'
import { TrialEvaluationInput } from '@/modules/trials/types/trial'
import { requireTenant } from '@/lib/server/authz'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST - Evaluate a trial
export async function POST(
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
    const evaluation: TrialEvaluationInput = {
      rating: body.rating,
      feedback: body.feedback,
      notes: body.notes || null
    }

    // Validate required fields
    if (!evaluation.rating || !evaluation.feedback) {
      return NextResponse.json(
        { success: false, error: 'Rating and feedback are required for evaluation' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (evaluation.rating < 1 || evaluation.rating > 10) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 10' },
        { status: 400 }
      )
    }

    const trial = await trialService.evaluateTrial(id, tenantId, evaluation)

    return NextResponse.json({
      success: true,
      data: trial,
      message: 'Trial evaluated successfully'
    })

  } catch (error) {
    console.error('Error evaluating trial:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate trial' },
      { status: 500 }
    )
  }
}