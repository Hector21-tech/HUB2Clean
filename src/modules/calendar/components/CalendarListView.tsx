'use client'

import { CalendarEvent } from '../types/calendar'

interface CalendarListViewProps {
  events: CalendarEvent[]
  isLoading: boolean
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: () => void
}

export function CalendarListView({
  events,
  isLoading,
  onEventClick,
  onCreateEvent
}: CalendarListViewProps) {
  return (
    <div className="p-6">
      <div className="text-center text-white/60">
        <p>List view - Coming soon</p>
        <p className="text-sm mt-2">Showing {events.length} upcoming events</p>
      </div>
    </div>
  )
}