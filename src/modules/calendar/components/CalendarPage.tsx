'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronLeft, ChevronRight, Plus, List, Grid, Clock, Search, X } from 'lucide-react'
import { CalendarView, CalendarEvent, EventType } from '../types/calendar'
import { dateUtils } from '../utils/calendar-utils'
import { useCalendarEvents, useCalendarEventsInRange, useDeleteEvent } from '../hooks/useCalendarEvents'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarWeekView } from './CalendarWeekView'
import { CalendarDayView } from './CalendarDayView'
import { CalendarListView } from './CalendarListView'
import { CreateEventModal } from './CreateEventModal'
import { EditEventModal } from './EditEventModal'
import { EventDetailModal } from './EventDetailModal'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'

export function CalendarPage() {
  const { tenantId, tenantSlug } = useTenantSlug()
  const router = useRouter()

  // UI State - MUST be declared before any early returns to follow Rules of Hooks
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [previousView, setPreviousView] = useState<CalendarView>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Search mode logic
  const isInSearchMode = searchTerm.trim().length > 0
  const actualView = isInSearchMode ? 'list' : view


  // Get date range based on current view (moved up before hooks)
  const getDateRange = () => {
    switch (actualView) {
      case 'month':
        return dateUtils.getMonthViewRange(currentDate)
      case 'week':
        return dateUtils.getWeekViewRange(currentDate)
      case 'day':
        return dateUtils.getDayViewRange(currentDate)
      case 'list':
        // For list view, show next 30 days
        return {
          start: new Date(),
          end: dateUtils.addDays(new Date(), 30)
        }
      default:
        return dateUtils.getMonthViewRange(currentDate)
    }
  }

  // Use different hooks based on view
  // For list view, get ALL events. For other views, get events in range
  const { start: rangeStart, end: rangeEnd } = getDateRange()
  const rangeQuery = useCalendarEventsInRange(
    tenantId || '',
    rangeStart,
    rangeEnd
  )
  const allEventsQuery = useCalendarEvents({
    tenantId: tenantId || ''
  })

  // Use the appropriate query based on actual view (including search mode)
  const { data: rawEvents = [], isLoading, error } = actualView === 'list' ? allEventsQuery : rangeQuery
  const deleteEvent = useDeleteEvent(tenantId || '')

  // Filter events based on search term
  const events = useMemo(() => {
    if (!searchTerm.trim()) {
      return rawEvents
    }

    const searchLower = searchTerm.toLowerCase()
    return rawEvents.filter(event => {
      // Search in event title
      const titleMatch = event.title?.toLowerCase().includes(searchLower)

      // Search in event description
      const descriptionMatch = event.description?.toLowerCase().includes(searchLower)

      // Search in event location
      const locationMatch = event.location?.toLowerCase().includes(searchLower)

      // Search in event type
      const typeMatch = event.type?.toLowerCase().includes(searchLower)

      // Search in trial player names (if it's a trial event)
      const playerMatch = event.trial?.player ?
        `${event.trial.player.firstName} ${event.trial.player.lastName}`.toLowerCase().includes(searchLower) : false

      // Search in trial club (if it's a trial event)
      const clubMatch = event.trial?.request?.club?.toLowerCase().includes(searchLower)

      return titleMatch || descriptionMatch || locationMatch || typeMatch || playerMatch || clubMatch
    })
  }, [rawEvents, searchTerm])

  // Navigation functions
  const navigateToPrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(dateUtils.addMonths(currentDate, -1))
        break
      case 'week':
        setCurrentDate(dateUtils.addDays(currentDate, -7))
        break
      case 'day':
        setCurrentDate(dateUtils.addDays(currentDate, -1))
        break
    }
  }

  const navigateToNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(dateUtils.addMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(dateUtils.addDays(currentDate, 7))
        break
      case 'day':
        setCurrentDate(dateUtils.addDays(currentDate, 1))
        break
    }
  }

  const navigateToToday = () => {
    setCurrentDate(new Date())
  }

  // Search handler with auto-switch logic
  const handleSearchChange = (newSearchTerm: string) => {
    const wasInSearchMode = isInSearchMode
    const willBeInSearchMode = newSearchTerm.trim().length > 0

    if (willBeInSearchMode && !wasInSearchMode) {
      // Starting search - save current view and switch to list
      setPreviousView(view)
    } else if (!willBeInSearchMode && wasInSearchMode) {
      // Clearing search - restore previous view
      setView(previousView)
    }

    setSearchTerm(newSearchTerm)
  }

  // Event handlers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (view !== 'day') {
      setCurrentDate(date)
      setView('day')
    }
  }

  const handleCreateEvent = (date?: Date) => {
    setSelectedDate(date || currentDate)
    setShowCreateModal(true)
  }

  const handleNavigateToTrial = (trialId: string) => {
    if (tenantSlug) {
      router.push(`/${tenantSlug}/trials?highlightTrial=${trialId}`)
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEditModal(true)
  }

  const handleDeleteEvent = async (event: CalendarEvent) => {
    // Create a confirmation dialog
    if (window.confirm(`Are you sure you want to delete "${event.title}"?\n\nThis action cannot be undone.`)) {
      try {
        await deleteEvent.mutateAsync(event.id)
        setSelectedEvent(null)

        // Optional: Show success message
        console.log(`Event "${event.title}" deleted successfully`)
      } catch (error) {
        console.error('Failed to delete event:', error)

        // Show user-friendly error message
        let errorMessage = 'Failed to delete event. Please try again.'
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            errorMessage = 'Event not found. It may have already been deleted.'
          } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
            errorMessage = 'Authentication error. Please refresh the page and try again.'
          }
        }

        alert(errorMessage)
      }
    }
  }

  // Get current view title
  const getViewTitle = () => {
    if (isInSearchMode) {
      return `Search Results (${events.length} found)`
    }

    switch (view) {
      case 'month':
        return dateUtils.formatMonthYear(currentDate)
      case 'week':
        const weekStart = dateUtils.startOfWeek(currentDate)
        const weekEnd = dateUtils.endOfWeek(currentDate)
        return `${weekStart.getDate()} - ${weekEnd.getDate()} ${dateUtils.formatMonthYear(weekStart)}`
      case 'day':
        return dateUtils.formatDate(currentDate)
      case 'list':
        return 'Upcoming Events'
      default:
        return ''
    }
  }

  // Handle loading and error states AFTER all hooks
  if (!tenantId) {
    return (
      <div className="flex-1 relative">
        <div className="relative p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/10 rounded w-1/4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-white/60">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-400/20 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-lg font-medium mb-2 text-white">Failed to load calendar</p>
          <p className="text-sm text-white/40">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <div className="relative p-6 space-y-6">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Calendar</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={navigateToPrevious}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                disabled={actualView === 'list'}
              >
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>

              <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 min-w-48 text-center">
                <span className="text-white font-medium">{getViewTitle()}</span>
              </div>

              <button
                onClick={navigateToNext}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                disabled={actualView === 'list'}
              >
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>

              <button
                onClick={navigateToToday}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg transition-colors text-sm font-medium"
                disabled={actualView === 'list'}
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1">
              {isInSearchMode && (
                <div className="text-xs text-blue-400 px-2 mr-2 bg-blue-500/20 rounded border border-blue-400/30">
                  Search Mode
                </div>
              )}
              <button
                onClick={() => setView('month')}
                disabled={isInSearchMode}
                className={`p-2 rounded-md transition-colors flex items-center gap-2 ${
                  view === 'month' && !isInSearchMode
                    ? 'bg-blue-500/20 text-blue-300'
                    : isInSearchMode
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm">Month</span>
              </button>
              <button
                onClick={() => setView('week')}
                disabled={isInSearchMode}
                className={`p-2 rounded-md transition-colors flex items-center gap-2 ${
                  view === 'week' && !isInSearchMode
                    ? 'bg-blue-500/20 text-blue-300'
                    : isInSearchMode
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Week</span>
              </button>
              <button
                onClick={() => setView('day')}
                disabled={isInSearchMode}
                className={`p-2 rounded-md transition-colors flex items-center gap-2 ${
                  view === 'day' && !isInSearchMode
                    ? 'bg-blue-500/20 text-blue-300'
                    : isInSearchMode
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm">Day</span>
              </button>
              <button
                onClick={() => setView('list')}
                disabled={isInSearchMode}
                className={`p-2 rounded-md transition-colors flex items-center gap-2 ${
                  isInSearchMode
                    ? 'bg-blue-500/20 text-blue-300'
                    : view === 'list'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm">{isInSearchMode ? 'Search Results' : 'List'}</span>
              </button>
            </div>

            {/* Create Event Button */}
            <button
              onClick={() => handleCreateEvent()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Event
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/40" />
            </div>
            <input
              type="text"
              placeholder="Search events by title, location, player name, or event type..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="
                w-full pl-10 pr-10 py-2.5
                bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg
                text-white placeholder-white/40
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/30
                transition-all duration-200
                text-sm
              "
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results Summary */}
          {searchTerm && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-white/60">
                Found {events.length} event{events.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
              </span>
              {events.length > 0 && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
        {actualView === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            events={events}
            isLoading={isLoading}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onCreateEvent={handleCreateEvent}
            selectedDate={selectedDate}
          />
        )}

        {actualView === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            events={events}
            isLoading={isLoading}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onCreateEvent={handleCreateEvent}
            selectedDate={selectedDate}
          />
        )}

        {actualView === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            events={events}
            isLoading={isLoading}
            onEventClick={handleEventClick}
            onCreateEvent={handleCreateEvent}
          />
        )}

        {actualView === 'list' && (
          <CalendarListView
            events={events}
            isLoading={isLoading}
            onEventClick={handleEventClick}
            onCreateEvent={handleCreateEvent}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEventModal
          tenantId={tenantId}
          initialDate={selectedDate}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedDate(null)
          }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onNavigateToTrial={handleNavigateToTrial}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false)
            // Keep selectedEvent for a brief moment to avoid null during transition
            setTimeout(() => setSelectedEvent(null), 100)
          }}
        />
      )}
      </div>
    </div>
  )
}