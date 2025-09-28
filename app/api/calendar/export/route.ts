import { NextResponse } from 'next/server'

// Redirect endpoint to help with URL structure
export async function GET() {
  return NextResponse.json({
    message: 'Calendar Export API',
    usage: 'Use /api/calendar/export/{tenant}.ics to export calendar for a tenant',
    example: '/api/calendar/export/elite-sports-group.ics',
    availableEndpoints: [
      '/api/calendar/export/{tenant}.ics - iCalendar export',
      '/api/debug-tenants - List available tenants'
    ]
  })
}