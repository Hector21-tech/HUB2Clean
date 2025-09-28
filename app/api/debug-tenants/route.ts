import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple test first - just return basic info
    return NextResponse.json({
      status: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      message: 'Testing if API routing works before trying database'
    })
  } catch (error) {
    console.error('Debug tenants error:', error)
    return NextResponse.json({
      error: 'API endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}