import { CalendarEvent, CalendarDay, CalendarWeek, CalendarMonth } from '../types/calendar'

// Date utility functions
export const dateUtils = {
  // Get start of month
  startOfMonth: (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  },

  // Get end of month
  endOfMonth: (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  },

  // Get start of week (Sunday)
  startOfWeek: (date: Date): Date => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return start
  },

  // Get end of week (Saturday)
  endOfWeek: (date: Date): Date => {
    const end = new Date(date)
    end.setDate(date.getDate() + (6 - date.getDay()))
    return end
  },

  // Check if two dates are the same day
  isSameDay: (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  },

  // Check if date is today
  isToday: (date: Date): boolean => {
    return dateUtils.isSameDay(date, new Date())
  },

  // Format date to display string
  formatDate: (date: Date): string => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  // Format time to display string
  formatTime: (date: Date): string => {
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // Format date for month header
  formatMonthYear: (date: Date): string => {
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long'
    })
  },

  // Add days to date
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },

  // Add months to date
  addMonths: (date: Date, months: number): Date => {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
  },

  // Get days in month
  getDaysInMonth: (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  },

  // Get calendar range for month view (includes leading/trailing days)
  getMonthViewRange: (date: Date): { start: Date; end: Date } => {
    const monthStart = dateUtils.startOfMonth(date)
    const monthEnd = dateUtils.endOfMonth(date)
    const calendarStart = dateUtils.startOfWeek(monthStart)
    const calendarEnd = dateUtils.endOfWeek(monthEnd)

    return { start: calendarStart, end: calendarEnd }
  },

  // Get week view range
  getWeekViewRange: (date: Date): { start: Date; end: Date } => {
    const start = dateUtils.startOfWeek(date)
    const end = dateUtils.endOfWeek(date)
    return { start, end }
  },

  // Get day view range
  getDayViewRange: (date: Date): { start: Date; end: Date } => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
}

// Event utility functions
export const eventUtils = {
  // Check if event is all day
  isAllDayEvent: (event: CalendarEvent): boolean => {
    return event.isAllDay
  },

  // Check if event spans multiple days
  isMultiDayEvent: (event: CalendarEvent): boolean => {
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    return !dateUtils.isSameDay(start, end)
  },

  // Check if event is on specific date
  isEventOnDate: (event: CalendarEvent, date: Date): boolean => {
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)

    // For all-day events, check if date falls within range (inclusive)
    if (event.isAllDay) {
      const eventStart = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const eventEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

      return checkDate >= eventStart && checkDate <= eventEnd
    }

    // For timed events, check if date matches start date
    return dateUtils.isSameDay(start, date)
  },

  // Get events for specific date
  getEventsForDate: (events: CalendarEvent[], date: Date): CalendarEvent[] => {
    return events.filter(event => eventUtils.isEventOnDate(event, date))
  },

  // Sort events by start time
  sortEventsByTime: (events: CalendarEvent[]): CalendarEvent[] => {
    return [...events].sort((a, b) => {
      const timeA = new Date(a.startTime).getTime()
      const timeB = new Date(b.startTime).getTime()
      return timeA - timeB
    })
  },

  // Get event duration in minutes
  getEventDuration: (event: CalendarEvent): number => {
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  },

  // Check if event conflicts with time range
  hasTimeConflict: (event: CalendarEvent, startTime: Date, endTime: Date): boolean => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)

    return (
      (startTime >= eventStart && startTime < eventEnd) ||
      (endTime > eventStart && endTime <= eventEnd) ||
      (startTime <= eventStart && endTime >= eventEnd)
    )
  },

  // Format event time range
  formatEventTimeRange: (event: CalendarEvent): string => {
    if (event.isAllDay) {
      return 'All day'
    }

    const start = new Date(event.startTime)
    const end = new Date(event.endTime)

    if (dateUtils.isSameDay(start, end)) {
      return `${dateUtils.formatTime(start)} - ${dateUtils.formatTime(end)}`
    } else {
      return `${dateUtils.formatDate(start)} ${dateUtils.formatTime(start)} - ${dateUtils.formatDate(end)} ${dateUtils.formatTime(end)}`
    }
  }
}

// Calendar grid generation
export const calendarGrid = {
  // Generate calendar month grid
  generateMonthGrid: (date: Date, events: CalendarEvent[], selectedDate?: Date): CalendarMonth => {
    const { start, end } = dateUtils.getMonthViewRange(date)
    const weeks: CalendarWeek[] = []

    let currentDate = new Date(start)

    while (currentDate <= end) {
      const days: CalendarDay[] = []

      for (let i = 0; i < 7; i++) {
        const dayEvents = eventUtils.getEventsForDate(events, currentDate)

        days.push({
          date: new Date(currentDate),
          isCurrentMonth: currentDate.getMonth() === date.getMonth(),
          isToday: dateUtils.isToday(currentDate),
          isSelected: selectedDate ? dateUtils.isSameDay(currentDate, selectedDate) : false,
          events: eventUtils.sortEventsByTime(dayEvents)
        })

        currentDate = dateUtils.addDays(currentDate, 1)
      }

      weeks.push({ days })
    }

    return {
      weeks,
      month: date.getMonth(),
      year: date.getFullYear()
    }
  },

  // Generate week grid
  generateWeekGrid: (date: Date, events: CalendarEvent[], selectedDate?: Date): CalendarWeek => {
    const { start } = dateUtils.getWeekViewRange(date)
    const days: CalendarDay[] = []

    for (let i = 0; i < 7; i++) {
      const currentDate = dateUtils.addDays(start, i)
      const dayEvents = eventUtils.getEventsForDate(events, currentDate)

      days.push({
        date: new Date(currentDate),
        isCurrentMonth: true, // All days in week view are considered "current"
        isToday: dateUtils.isToday(currentDate),
        isSelected: selectedDate ? dateUtils.isSameDay(currentDate, selectedDate) : false,
        events: eventUtils.sortEventsByTime(dayEvents)
      })
    }

    return { days }
  }
}