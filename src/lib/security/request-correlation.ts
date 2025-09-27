import { NextRequest, NextResponse } from 'next/server'
import { generateRequestId } from '@/lib/logger'

/**
 * 🛡️ Enterprise Request Correlation
 *
 * Adds unique request IDs for tracing requests across the system
 * Essential for debugging in multi-tenant environments
 */

export const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Extract or generate request ID from request
 * Checks for existing header first, generates new one if not found
 */
export function getRequestId(request: NextRequest): string {
  const existingId = request.headers.get(REQUEST_ID_HEADER)
  return existingId || generateRequestId()
}

/**
 * Add request ID to response headers
 * Allows clients to correlate requests with server logs
 */
export function addRequestIdToResponse(response: NextResponse, requestId: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId)
  return response
}

/**
 * Middleware function to ensure all requests have correlation IDs
 * Should be called early in middleware chain
 */
export function enhanceRequestCorrelation(request: NextRequest, response: NextResponse): { requestId: string; enhancedResponse: NextResponse } {
  const requestId = getRequestId(request)
  const enhancedResponse = addRequestIdToResponse(response, requestId)

  return { requestId, enhancedResponse }
}

/**
 * Create a new NextResponse with request correlation
 * Utility for API routes to maintain correlation
 */
export function createCorrelatedResponse(data: any, options: { status?: number; requestId?: string } = {}) {
  const response = NextResponse.json(data, { status: options.status || 200 })

  if (options.requestId) {
    response.headers.set(REQUEST_ID_HEADER, options.requestId)
  }

  return response
}