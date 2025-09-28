'use client'

import { Plus } from 'lucide-react'
import { CalendarEvent, EVENT_TYPE_CONFIG } from '../types/calendar'
import { calendarGrid, dateUtils } from '../utils/calendar-utils'
import { Skeleton } from '@/components/ui/skeleton'

interface CalendarWeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  isLoading: boolean
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onCreateEvent: (date: Date) => void
  selectedDate?: Date | null
}

export function CalendarWeekView({
  currentDate,
  events,
  isLoading,
  onEventClick,
  onDateClick,
  onCreateEvent,
  selectedDate
}: CalendarWeekViewProps) {
  const weekGrid = calendarGrid.generateWeekGrid(currentDate, events, selectedDate || undefined)
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const weekDaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get week range for display
  const { start: weekStart, end: weekEnd } = dateUtils.getWeekViewRange(currentDate)
  const weekDateRange = `${dateUtils.formatDate(weekStart).split(',')[0]} - ${dateUtils.formatDate(weekEnd).split(',')[0]}`

  if (isLoading) {
    return (
      <div className="p-6">
        {/* Week header skeleton */}
        <div className="mb-6 text-center">
          <Skeleton className="h-6 w-64 mx-auto mb-2 bg-white/10" />
          <Skeleton className="h-4 w-48 mx-auto bg-white/10" />
        </div>

        {/* Week grid skeleton */}
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="space-y-2">
              {/* Day header skeleton */}
              <div className="text-center pb-3 border-b border-white/10">
                <Skeleton className="h-4 w-12 mx-auto mb-1 bg-white/10" />
                <Skeleton className="h-6 w-8 mx-auto bg-white/10" />
              </div>

              {/* Events skeleton */}
              <div className="space-y-2 min-h-[200px]">
                {Array.from({ length: 2 }, (_, j) => (
                  <Skeleton key={j} className="h-16 w-full bg-white/5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Week Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-white mb-1">
          {weekDateRange}
        </h2>
        <p className="text-sm text-white/60">
          {events.length} event{events.length !== 1 ? 's' : ''} this week
        </p>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekGrid.days.map((day, index) => (
          <WeekDayColumn
            key={index}
            day={day}
            dayName={weekDays[index]}
            dayNameShort={weekDaysShort[index]}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            onCreateEvent={onCreateEvent}
          />
        ))}
      </div>
    </div>
  )
}

interface WeekDayColumnProps {
  day: {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    events: CalendarEvent[]
  }
  dayName: string
  dayNameShort: string
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onCreateEvent: (date: Date) => void
}

function WeekDayColumn({
  day,
  dayName,
  dayNameShort,
  onEventClick,
  onDateClick,
  onCreateEvent
}: WeekDayColumnProps) {
  const { date, isToday, isSelected, events } = day

  return (
    <div className="space-y-2">
      {/* Day Header */}
      <div
        className={`text-center pb-3 border-b border-white/10 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors ${
          isToday ? 'bg-blue-500/10 border-blue-400/30' : ''
        } ${isSelected ? 'bg-blue-500/20 border-blue-500/50' : ''}`}
        onClick={() => onDateClick(date)}
      >
        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-300' : 'text-white/70'}`}>
          <span className="hidden sm:inline">{dayName}</span>
          <span className="sm:hidden">{dayNameShort}</span>
        </div>
        <div className={`text-lg font-bold ${isToday ? 'text-blue-300' : 'text-white'}`}>
          {date.getDate()}
        </div>
        {isToday && (
          <div className="text-xs text-blue-400 font-medium mt-1">Today</div>
        )}
      </div>

      {/* Events Column */}
      <div className="space-y-2 min-h-[200px]">
        {events.map((event) => {
          const eventDate = new Date(event.startTime)
          const endDate = new Date(event.endTime)
          const typeConfig = EVENT_TYPE_CONFIG[event.type]
          const isPast = eventDate < new Date()

          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`
                bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm
                border rounded-lg p-3 cursor-pointer transition-all duration-200
                hover:bg-white/15 hover:scale-[1.02] group
                ${typeConfig.borderColor}
                ${isPast ? 'opacity-75' : ''}
              `}
            >
              {/* Event Type Icon & Time */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-sm ${typeConfig.bgColor}`}>
                  {typeConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {!event.isAllDay ? (
                    <div className="text-xs text-white/60">
                      {dateUtils.formatTime(eventDate)}
                      {!dateUtils.isSameDay(eventDate, endDate) && (
                        <span> - {dateUtils.formatTime(endDate)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-blue-400">All day</div>
                  )}
                </div>
              </div>

              {/* Event Title */}
              <h4 className="font-medium text-white text-sm mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">
                {event.title}
              </h4>

              {/* Event Type Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color} border ${typeConfig.borderColor}`}>
                  {typeConfig.label}
                </span>

                {/* Trial specific info */}
                {event.trial?.player && (
                  <div className="text-xs text-white/60 truncate ml-2">
                    {event.trial.player.firstName} {event.trial.player.lastName}
                  </div>
                )}
              </div>

              {/* Location */}
              {event.location && (
                <div className="text-xs text-white/50 mt-2 truncate">
                  📍 {event.location}
                </div>
              )}
            </div>
          )
        })}

        {/* Quick Add Event Button */}
        <button
          onClick={() => onCreateEvent(date)}
          className="w-full py-3 border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg
                     text-white/60 hover:text-white/80 text-sm transition-all duration-200
                     hover:bg-white/5 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>
    </div>
  )
}