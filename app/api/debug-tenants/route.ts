import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        _count: {
          select: {
            calendarEvents: true
          }
        }
      }
    })

    // Get some calendar events for debugging
    const calendarEvents = await prisma.calendarEvent.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        tenantId: true,
        startTime: true,
        tenant: {
          select: {
            slug: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      tenants,
      calendarEvents,
      totalTenants: tenants.length,
      totalCalendarEvents: await prisma.calendarEvent.count(),
      availableExportUrls: tenants.map(t => `/api/calendar/export/${t.slug}.ics`)
    })
  } catch (error) {
    console.error('Debug tenants error:', error)
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}