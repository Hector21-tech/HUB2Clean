import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { exportEventsToIcs } from '@/modules/calendar/utils/calendar-export'
import { CalendarEvent } from '@/modules/calendar/types/calendar'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar/export/[tenant] or /api/calendar/export/[tenant].ics
 *
 * Export tenant calendar events as iCalendar (.ics) format
 * Supports subscription in iPhone, Google Calendar, Outlook, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant } = await params
    // Handle both /tenant and /tenant.ics formats
    const tenantSlug = tenant.replace(/\.ics$/, '') // Remove .ics extension if present

    console.log(`[Calendar Export] Exporting calendar for tenant: ${tenantSlug}`)

    // Find tenant by slug
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (!tenantRecord) {
      console.log(`[Calendar Export] Tenant not found: ${tenantSlug}`)
      // Return empty calendar instead of 404 to help with debugging
      const emptyCalendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Scout Hub//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Scout Hub - ${tenantSlug}
X-WR-CALDESC:No tenant found for slug: ${tenantSlug}
END:VCALENDAR`

      return new NextResponse(emptyCalendar, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${tenantSlug}-not-found.ics"`,
          'Access-Control-Allow-Origin': '*',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
          'X-Debug-Error': 'Tenant not found'
        }
      })
    }

    // Get date range for events (default: 30 days back, 365 days forward)
    const now = new Date()
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year forward

    // Fetch calendar events for tenant
    const events = await prisma.calendarEvent.findMany({
      where: {
        tenantId: tenantRecord.id,
        startTime: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString()
        }
      },
      include: {
        trial: {
          include: {
            player: true,
            request: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    console.log(`[Calendar Export] Found ${events.length} events for tenant ${tenantSlug}`)

    // If no events, return empty calendar
    if (events.length === 0) {
      const emptyCalendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Scout Hub//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Scout Hub - ${tenantRecord.name}
X-WR-CALDESC:Scout Hub calendar for ${tenantRecord.name} (No events yet)
END:VCALENDAR`

      return new NextResponse(emptyCalendar, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${tenantSlug}-empty.ics"`,
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'Access-Control-Allow-Origin': '*',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
          'X-Event-Count': '0',
          'X-Debug-Info': 'No events found'
        }
      })
    }

    // Convert Prisma events to CalendarEvent format
    const calendarEvents: CalendarEvent[] = events.map(event => ({
      id: event.id,
      tenantId: event.tenantId,
      title: event.title,
      description: event.description || undefined,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      location: event.location || undefined,
      type: event.type as CalendarEvent['type'],
      isAllDay: event.isAllDay,
      recurrence: event.recurrence || undefined,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      trialId: event.trialId || undefined,
      trial: event.trial ? {
        id: event.trial.id,
        status: event.trial.status,
        rating: event.trial.rating,
        player: event.trial.player ? {
          id: event.trial.player.id,
          firstName: event.trial.player.firstName,
          lastName: event.trial.player.lastName,
          position: event.trial.player.position,
          club: event.trial.player.club,
          avatarPath: event.trial.player.avatarPath,
          avatarUrl: null // We don't need avatar URLs in calendar export
        } : null,
        request: event.trial.request ? {
          id: event.trial.request.id,
          title: event.trial.request.title,
          club: event.trial.request.club,
          position: event.trial.request.position
        } : null
      } : null
    }))

    // Generate iCalendar content
    const exportResult = await exportEventsToIcs(calendarEvents, {
      includeAlarms: true,
      organizerName: 'Scout Hub',
      organizerEmail: 'noreply@scouthub.com',
      calendarName: `Scout Hub - ${tenantRecord.name}`,
      description: `Scout Hub calendar for ${tenantRecord.name} - Professional football scouting events`
    })

    if (exportResult.error) {
      console.error(`[Calendar Export] Error generating iCalendar:`, exportResult.error)
      return new NextResponse('Error generating calendar', { status: 500 })
    }

    if (!exportResult.value) {
      return new NextResponse('No calendar data generated', { status: 500 })
    }

    console.log(`[Calendar Export] Successfully generated iCalendar for ${tenantSlug}`)

    // Return iCalendar with proper headers (enhanced for mobile compatibility)
    return new NextResponse(exportResult.value, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${tenantSlug}-calendar.ics"`,
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Calendar-Name': `Scout Hub - ${tenantRecord.name}`,
        'X-Event-Count': events.length.toString(),
        // Enhanced headers for mobile calendar compatibility
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    })

  } catch (error) {
    console.error('[Calendar Export] Error:', error)

    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new NextResponse(`Calendar export failed: ${errorMessage}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
}

/**
 * HEAD /api/calendar/export/[tenant].ics
 *
 * Check calendar availability without downloading content
 * Used by calendar applications to check for updates
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant } = await params
    const tenantSlug = tenant.replace('.ics', '')

    // Find tenant by slug
    const tenantRecord = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (!tenantRecord) {
      return new NextResponse(null, { status: 404 })
    }

    // Get latest event update time for ETag
    const latestEvent = await prisma.calendarEvent.findFirst({
      where: { tenantId: tenantRecord.id },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    })

    const etag = latestEvent
      ? `"${latestEvent.updatedAt.getTime()}"`
      : `"${Date.now()}"`

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'ETag': etag,
        'Last-Modified': latestEvent?.updatedAt.toUTCString() || new Date().toUTCString()
      }
    })

  } catch (error) {
    console.error('[Calendar Export HEAD] Error:', error)
    return new NextResponse(null, { status: 500 })
  }
}