'use client'

import { Plus } from 'lucide-react'
import { CalendarEvent } from '../types/calendar'
import { calendarGrid, dateUtils, eventUtils } from '../utils/calendar-utils'
import { EVENT_TYPE_CONFIG } from '../types/calendar'
import { Skeleton } from '@/components/ui/skeleton'

interface CalendarMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  isLoading: boolean
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onCreateEvent: (date: Date) => void
  selectedDate: Date | null
}

export function CalendarMonthView({
  currentDate,
  events,
  isLoading,
  onEventClick,
  onDateClick,
  onCreateEvent,
  selectedDate
}: CalendarMonthViewProps) {
  const monthGrid = calendarGrid.generateMonthGrid(currentDate, events, selectedDate || undefined)

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return (
      <div className="p-6">
        {/* Header skeleton */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center">
              <Skeleton className="h-4 w-8 mx-auto bg-white/10" />
            </div>
          ))}
        </div>

        {/* Calendar grid skeleton */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }, (_, i) => (
            <div key={i} className="aspect-square p-2">
              <Skeleton className="h-full w-full bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-white/70 border-b border-white/10"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {monthGrid.weeks.map((week, weekIndex) =>
          week.days.map((day, dayIndex) => (
            <CalendarDayCell
              key={`${weekIndex}-${dayIndex}`}
              day={day}
              onEventClick={onEventClick}
              onDateClick={onDateClick}
              onCreateEvent={onCreateEvent}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CalendarDayCellProps {
  day: {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    events: CalendarEvent[]
  }
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onCreateEvent: (date: Date) => void
}

function CalendarDayCell({
  day,
  onEventClick,
  onDateClick,
  onCreateEvent
}: CalendarDayCellProps) {
  const { date, isCurrentMonth, isToday, isSelected, events } = day

  // Show max 3 events, then show "X more" indicator
  const maxVisibleEvents = 3
  const visibleEvents = events.slice(0, maxVisibleEvents)
  const hiddenEventsCount = events.length - maxVisibleEvents

  return (
    <div
      className={`aspect-square relative border border-white/10 rounded-lg p-2 cursor-pointer transition-all duration-200 group hover:bg-white/5 ${
        isCurrentMonth ? 'bg-white/5' : 'bg-white/2'
      } ${isToday ? 'ring-2 ring-blue-400/50 bg-blue-500/10' : ''} ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''
      }`}
      onClick={() => onDateClick(date)}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-medium ${
            isCurrentMonth ? 'text-white' : 'text-white/40'
          } ${isToday ? 'text-blue-300 font-bold' : ''}`}
        >
          {date.getDate()}
        </span>

        {/* Quick add button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCreateEvent(date)
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all duration-200"
        >
          <Plus className="w-3 h-3 text-white/60" />
        </button>
      </div>

      {/* Events */}
      <div className="space-y-1 overflow-hidden">
        {visibleEvents.map((event) => {
          const config = EVENT_TYPE_CONFIG[event.type]
          return (
            <div
              key={event.id}
              onClick={(e) => {
                e.stopPropagation()
                onEventClick(event)
              }}
              className={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors hover:opacity-80 ${
                config.bgColor
              } ${config.borderColor} ${config.color} truncate`}
              title={`${config.icon} ${event.title}${
                event.location ? ` • ${event.location}` : ''
              }`}
            >
              <span className="inline-block w-2 mr-1">{config.icon}</span>
              {event.title}
            </div>
          )
        })}

        {/* More events indicator */}
        {hiddenEventsCount > 0 && (
          <div className="text-xs text-white/50 font-medium px-2 py-1">
            +{hiddenEventsCount} more
          </div>
        )}
      </div>
    </div>
  )
}