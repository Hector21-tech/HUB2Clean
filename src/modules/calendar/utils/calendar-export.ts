import { createEvents, EventAttributes, DateArray } from 'ics'
import { CalendarEvent, EVENT_TYPE_CONFIG } from '../types/calendar'

/**
 * Convert CalendarEvent to iCalendar format (.ics)
 * Supports export to iPhone, Google Calendar, Outlook, etc.
 */

interface ExportOptions {
  includeAlarms?: boolean
  organizerName?: string
  organizerEmail?: string
  calendarName?: string
  description?: string
}

/**
 * Convert Date string to DateArray format for ics library
 */
function dateToDateArray(dateString: string): DateArray {
  const date = new Date(dateString)
  return [
    date.getFullYear(),
    date.getMonth() + 1, // ics expects 1-based months
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ]
}

/**
 * Generate rich description for calendar event
 */
function generateEventDescription(event: CalendarEvent): string {
  const typeConfig = EVENT_TYPE_CONFIG[event.type]
  let description = event.description || ''

  // Add event type info
  description += `\n\n📅 Event Type: ${typeConfig.icon} ${typeConfig.label}`

  // Add trial specific information
  if (event.trial && event.trial.player) {
    const player = event.trial.player
    description += `\n\n👤 Player Information:`
    description += `\n• Name: ${player.firstName} ${player.lastName}`

    if (player.position) {
      description += `\n• Position: ${player.position}`
    }

    if (player.club) {
      description += `\n• Current Club: ${player.club}`
    }

    if (event.trial.request?.club) {
      description += `\n• Requesting Club: ${event.trial.request.club}`
    }

    if (event.trial.status) {
      description += `\n• Trial Status: ${event.trial.status}`
    }

    if (event.trial.rating) {
      description += `\n• Rating: ${event.trial.rating}/10`
    }
  }

  // Add location
  if (event.location) {
    description += `\n\n📍 Location: ${event.location}`
  }

  // Add Scout Hub signature
  description += `\n\n🚀 Created with Scout Hub 2`
  description += `\nManage this event: https://scouthub.com/calendar`

  return description.trim()
}

/**
 * Convert Scout Hub CalendarEvent to ics EventAttributes
 */
function convertEventToIcs(event: CalendarEvent, options: ExportOptions = {}): EventAttributes {
  const typeConfig = EVENT_TYPE_CONFIG[event.type]

  // Create base event object with required fields
  const icsEvent: EventAttributes = {
    uid: `scouthub-${event.id}@scouthub.com`,
    title: `${typeConfig.icon} ${event.title}`,
    description: generateEventDescription(event),
    location: event.location || undefined,
    categories: [typeConfig.label, 'Scout Hub'],
    status: 'CONFIRMED',
    created: dateToDateArray(event.createdAt),
    lastModified: dateToDateArray(event.updatedAt),
    // Required start/end fields
    start: dateToDateArray(event.startTime),
    end: dateToDateArray(event.endTime)
  }

  // Handle all-day events
  if (event.isAllDay) {
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)

    icsEvent.start = [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate()
    ]

    icsEvent.end = [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate()
    ]
  }

  // Add recurrence rule if exists
  if (event.recurrence) {
    icsEvent.recurrenceRule = event.recurrence
  }

  // Add alarms for notifications
  if (options.includeAlarms !== false) {
    icsEvent.alarms = [
      {
        action: 'display',
        description: `Reminder: ${event.title}`,
        trigger: { minutes: 15, before: true } // 15 minutes before
      },
      {
        action: 'display',
        description: `Reminder: ${event.title}`,
        trigger: { hours: 1, before: true } // 1 hour before
      }
    ]
  }

  // Add organizer info if provided
  if (options.organizerName && options.organizerEmail) {
    icsEvent.organizer = {
      name: options.organizerName,
      email: options.organizerEmail
    }
  }

  return icsEvent
}

/**
 * Export Scout Hub events to iCalendar (.ics) format
 */
export async function exportEventsToIcs(
  events: CalendarEvent[],
  options: ExportOptions = {}
): Promise<{ error?: string; value?: string }> {
  try {
    // Convert all events to ics format
    const icsEvents = events.map(event => convertEventToIcs(event, options))

    // Generate calendar with metadata
    const result = createEvents(icsEvents)

    // Handle ics library result format
    if (result.error) {
      return {
        error: result.error instanceof Error ? result.error.message : String(result.error)
      }
    }

    return {
      value: result.value
    }
  } catch (error) {
    console.error('Error generating iCalendar:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to generate calendar'
    }
  }
}

/**
 * Generate calendar subscription URL for tenant
 */
export function generateCalendarSubscriptionUrl(
  tenantId: string,
  baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3007'
): string {
  return `${baseUrl}/api/calendar/export/${tenantId}.ics`
}

/**
 * Generate webcal:// URL for easy subscription
 */
export function generateWebcalUrl(tenantId: string, baseUrl?: string): string {
  const httpUrl = generateCalendarSubscriptionUrl(tenantId, baseUrl)
  return httpUrl.replace(/^https?:\/\//, 'webcal://')
}

/**
 * Get platform-specific subscription instructions
 */
export function getSubscriptionInstructions() {
  return {
    iPhone: {
      title: 'Add to iPhone Calendar',
      steps: [
        'Copy the webcal:// URL below',
        'Open Settings → Calendar → Accounts',
        'Tap "Add Account" → Other → Add Subscribed Calendar',
        'Paste the URL and tap Next',
        'Your Scout Hub events will sync automatically!'
      ]
    },
    Android: {
      title: 'Add to Google Calendar',
      steps: [
        'Copy the calendar URL below',
        'Open Google Calendar on web',
        'Click "+" next to "Other calendars"',
        'Select "From URL"',
        'Paste the URL and click "Add calendar"',
        'Events will appear in your Google Calendar app!'
      ]
    },
    Desktop: {
      title: 'Add to Desktop Calendar',
      steps: [
        'Copy the webcal:// URL below',
        'Outlook: File → Account Settings → Internet Calendars → New',
        'Apple Calendar: File → New Calendar Subscription',
        'Thunderbird: File → Subscribe to Remote Calendar',
        'Paste URL and follow prompts'
      ]
    }
  }
}