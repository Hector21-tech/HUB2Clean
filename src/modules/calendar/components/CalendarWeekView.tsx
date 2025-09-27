'use client'

import { CalendarEvent } from '../types/calendar'

interface CalendarWeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  isLoading: boolean
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onCreateEvent: (date: Date) => void
}

export function CalendarWeekView({
  currentDate,
  events,
  isLoading,
  onEventClick,
  onDateClick,
  onCreateEvent
}: CalendarWeekViewProps) {
  return (
    <div className="p-6">
      <div className="text-center text-white/60">
        <p>Week view - Coming soon</p>
        <p className="text-sm mt-2">Showing {events.length} events for this week</p>
      </div>
    </div>
  )
}