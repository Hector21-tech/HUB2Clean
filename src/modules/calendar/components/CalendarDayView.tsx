'use client'

import { useMemo } from 'react'
import { Plus, Clock, MapPin } from 'lucide-react'
import { CalendarEvent, EVENT_TYPE_CONFIG } from '../types/calendar'
import { dateUtils } from '../utils/calendar-utils'
import { Skeleton } from '@/components/ui/skeleton'

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
  // Filter events for this specific day
  const dayEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      return dateUtils.isSameDay(eventDate, currentDate)
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [events, currentDate])

  // Generate hour slots for the day (6 AM to 11 PM)
  const hourSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(hour)
    }
    return slots
  }, [])

  // Helper function to get events for a specific hour
  const getEventsForHour = (hour: number) => {
    return dayEvents.filter(event => {
      const eventDate = new Date(event.startTime)
      const eventHour = eventDate.getHours()

      // Include events that start in this hour or span through this hour
      if (event.isAllDay) return hour === 6 // Show all-day events at the top (6 AM slot)

      const endDate = new Date(event.endTime)
      const endHour = endDate.getHours()

      return eventHour <= hour && hour <= endHour
    })
  }

  const isToday = dateUtils.isToday(currentDate)
  const dayLabel = dateUtils.formatDate(currentDate)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {/* Header skeleton */}
        <div className="text-center mb-6">
          <Skeleton className="h-8 w-64 mx-auto mb-2 bg-white/10" />
          <Skeleton className="h-4 w-48 mx-auto bg-white/10" />
        </div>

        {/* Time slots skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-16 h-4 bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-16 w-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Day Header */}
      <div className="text-center">
        <h2 className={`text-2xl font-bold mb-1 ${isToday ? 'text-blue-300' : 'text-white'}`}>
          {dayLabel}
        </h2>
        {isToday && (
          <div className="text-sm text-blue-400 font-medium mb-2">Today</div>
        )}
        <p className="text-sm text-white/60">
          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* All-day events section */}
      {dayEvents.some(e => e.isAllDay) && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">All Day</h3>
          <div className="space-y-2">
            {dayEvents.filter(e => e.isAllDay).map(event => {
              const typeConfig = EVENT_TYPE_CONFIG[event.type]
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`
                    bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm
                    border rounded-lg p-3 cursor-pointer transition-all duration-200
                    hover:bg-white/15 hover:scale-[1.01] group
                    ${typeConfig.borderColor}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${typeConfig.bgColor}`}>
                      {typeConfig.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className={`px-2 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color} border ${typeConfig.borderColor}`}>
                          {typeConfig.label}
                        </span>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Time-based events */}
      <div className="space-y-0 border border-white/10 rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm">
        {hourSlots.map(hour => {
          const hourEvents = getEventsForHour(hour).filter(e => !e.isAllDay)
          const timeString = `${hour.toString().padStart(2, '0')}:00`
          const currentHour = new Date().getHours()
          const isCurrentHour = isToday && hour === currentHour

          return (
            <div
              key={hour}
              className={`flex border-b border-white/10 last:border-b-0 min-h-[60px] ${
                isCurrentHour ? 'bg-blue-500/10 border-blue-400/30' : ''
              }`}
            >
              {/* Time label */}
              <div className={`w-16 p-3 text-sm font-medium border-r border-white/10 ${
                isCurrentHour ? 'text-blue-300' : 'text-white/70'
              }`}>
                {timeString}
              </div>

              {/* Events and content area */}
              <div className="flex-1 p-2 space-y-2">
                {hourEvents.length > 0 ? (
                  hourEvents.map(event => {
                    const eventDate = new Date(event.startTime)
                    const endDate = new Date(event.endTime)
                    const typeConfig = EVENT_TYPE_CONFIG[event.type]
                    const duration = Math.round((endDate.getTime() - eventDate.getTime()) / (1000 * 60))

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`
                          bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm
                          border rounded-lg p-3 cursor-pointer transition-all duration-200
                          hover:bg-white/15 hover:scale-[1.01] group
                          ${typeConfig.borderColor}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-sm ${typeConfig.bgColor}`}>
                            {typeConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors mb-1">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-white/60 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {dateUtils.formatTime(eventDate)} - {dateUtils.formatTime(endDate)}
                                  <span className="ml-1">({duration}m)</span>
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color} border ${typeConfig.borderColor}`}>
                                {typeConfig.label}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 text-xs text-white/50">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.trial?.player && (
                              <div className="text-xs text-white/60 mt-1">
                                {event.trial.player.firstName} {event.trial.player.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  /* Empty time slot with quick add */
                  <button
                    onClick={() => {
                      const slotDate = new Date(currentDate)
                      slotDate.setHours(hour, 0, 0, 0)
                      onCreateEvent(slotDate)
                    }}
                    className="w-full h-12 border border-dashed border-white/20 hover:border-white/40 rounded-lg
                               text-white/40 hover:text-white/60 text-sm transition-all duration-200
                               hover:bg-white/5 flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Add event at {timeString}</span>
                    <span className="sm:hidden">Add event</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer with overall add event button */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={() => onCreateEvent(currentDate)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add Event for {dateUtils.formatDate(currentDate).split(',')[0]}
        </button>
      </div>
    </div>
  )
}