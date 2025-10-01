'use client'

import { useMemo } from 'react'
import { CalendarEvent, EVENT_TYPE_CONFIG } from '../types/calendar'
import { dateUtils } from '../utils/calendar-utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, MapPin, Plus, User, Building2 } from 'lucide-react'

interface CalendarListViewProps {
  events: CalendarEvent[]
  isLoading: boolean
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: () => void
}

interface GroupedEvents {
  [monthKey: string]: {
    monthLabel: string
    events: CalendarEvent[]
  }
}

export function CalendarListView({
  events,
  isLoading,
  onEventClick,
  onCreateEvent
}: CalendarListViewProps) {
  // Group events by month
  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    const grouped: GroupedEvents = {}

    sorted.forEach(event => {
      const eventDate = new Date(event.startTime)
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
      const monthLabel = dateUtils.formatMonthYear(eventDate)

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          monthLabel,
          events: []
        }
      }

      grouped[monthKey].events.push(event)
    })

    return grouped
  }, [events])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Loading skeletons */}
        {Array.from({ length: 3 }, (_, monthIndex) => (
          <div key={monthIndex} className="space-y-4">
            {/* Month header skeleton */}
            <Skeleton className="h-8 w-48 bg-white/10" />

            {/* Event cards skeleton */}
            {Array.from({ length: 4 }, (_, eventIndex) => (
              <div key={eventIndex} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 bg-white/10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10" />
                    <Skeleton className="h-4 w-1/3 bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No events found</h3>
          <p className="text-white/60 mb-6">Start by creating your first event</p>
          <button
            onClick={onCreateEvent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
      {Object.entries(groupedEvents).map(([monthKey, { monthLabel, events: monthEvents }]) => (
        <div key={monthKey} className="space-y-3 sm:space-y-4">
          {/* Month Header - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-white/10">
            <div className="w-1 h-5 sm:h-6 bg-blue-400 rounded-full flex-shrink-0"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">{monthLabel}</h2>
            <span className="text-xs sm:text-sm text-white/60 bg-white/10 px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
              {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Events for this month - Mobile Optimized */}
          <div className="space-y-2 sm:space-y-3">
            {monthEvents.map(event => {
              const eventDate = new Date(event.startTime)
              const endDate = new Date(event.endTime)
              const typeConfig = EVENT_TYPE_CONFIG[event.type]
              const isToday = dateUtils.isToday(eventDate)
              const isPast = eventDate < new Date()

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`
                    bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl border rounded-xl p-3 sm:p-4
                    hover:bg-white/15 transition-all duration-200 cursor-pointer group
                    ${typeConfig.borderColor}
                    ${isToday ? 'ring-2 ring-blue-400/50' : ''}
                    ${isPast ? 'opacity-75' : ''}
                  `}
                >
                  {/* Mobile: Stack vertically, Desktop: Horizontal */}
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    {/* Event Type Icon & Type Badge (Mobile: Row, Desktop: Icon left) */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 w-full sm:w-auto">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${typeConfig.bgColor}`}>
                        {typeConfig.icon}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color} border ${typeConfig.borderColor} whitespace-nowrap sm:hidden`}>
                        {typeConfig.label}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0 w-full">
                      {/* Title and type (Desktop only badge) */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-sm sm:text-base text-white group-hover:text-blue-300 transition-colors">
                          {event.title}
                        </h3>
                        <span className={`hidden sm:inline-block text-xs px-2 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color} border ${typeConfig.borderColor} whitespace-nowrap flex-shrink-0`}>
                          {typeConfig.label}
                        </span>
                      </div>

                      {/* Date and time - Wrap on mobile */}
                      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-white/70 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{dateUtils.formatDate(eventDate)}</span>
                          {isToday && <span className="text-blue-400 font-medium">(Today)</span>}
                        </div>
                        {!event.isAllDay && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{dateUtils.formatTime(eventDate)} - {dateUtils.formatTime(endDate)}</span>
                          </div>
                        )}
                        {event.isAllDay && (
                          <span className="text-blue-400 text-xs">All day</span>
                        )}
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-white/60 mb-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {/* Description */}
                      {event.description && (
                        <p className="text-xs sm:text-sm text-white/60 mb-2 sm:mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Trial specific info - Wrap on mobile */}
                      {event.trial && (
                        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm">
                          {event.trial.player && (
                            <div className="flex items-center gap-1 text-white/70">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">
                                {event.trial.player.firstName} {event.trial.player.lastName}
                                {event.trial.player.position && (
                                  <span className="text-white/50"> ({event.trial.player.position})</span>
                                )}
                              </span>
                            </div>
                          )}
                          {event.trial.request && (
                            <div className="flex items-center gap-1 text-white/70">
                              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{event.trial.request.club}</span>
                            </div>
                          )}
                          {event.trial.rating && (
                            <div className="text-yellow-400 text-xs whitespace-nowrap">
                              Rating: {event.trial.rating}/10
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Create Event Button */}
      <div className="pt-6 border-t border-white/10">
        <button
          onClick={onCreateEvent}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Create New Event
        </button>
      </div>
    </div>
  )
}