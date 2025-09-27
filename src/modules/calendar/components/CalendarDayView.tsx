'use client'

import { CalendarEvent } from '../types/calendar'

interface CalendarDayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  isLoading: boolean
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: (date: Date) => void
}

export function CalendarDayView({
  currentDate,
  events,
  isLoading,
  onEventClick,
  onCreateEvent
}: CalendarDayViewProps) {
  return (
    <div className="p-6">
      <div className="text-center text-white/60">
        <p>Day view - Coming soon</p>
        <p className="text-sm mt-2">Showing {events.length} events for this day</p>
      </div>
    </div>
  )
}