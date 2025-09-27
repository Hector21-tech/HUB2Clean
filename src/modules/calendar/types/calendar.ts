export type EventType = 'TRIAL' | 'MEETING' | 'MATCH' | 'TRAINING' | 'SCOUTING' | 'OTHER'

export type CalendarView = 'month' | 'week' | 'day' | 'list'

export interface CalendarEvent {
  id: string
  tenantId: string
  title: string
  description?: string
  startTime: string // ISO string
  endTime: string // ISO string
  location?: string
  type: EventType
  isAllDay: boolean
  recurrence?: string // RRULE format
  createdAt: string
  updatedAt: string
  trialId?: string
  trial?: {
    id: string
    status: string
    rating?: number | null
    player?: {
      id: string
      firstName: string
      lastName: string
      position?: string | null
      club?: string | null
      avatarPath?: string | null
      avatarUrl?: string | null
    } | null
    request?: {
      id: string
      title?: string | null
      club: string
      position?: string | null
    } | null
  } | null
}

export interface CreateEventInput {
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  type: EventType
  isAllDay?: boolean
  recurrence?: string
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string
}

export interface CalendarFilters {
  type?: EventType
  search?: string
}

export interface CalendarEventConflict {
  id: string
  title: string
  startTime: string
  endTime: string
}

// Calendar navigation state
export interface CalendarState {
  view: CalendarView
  currentDate: Date
  selectedDate?: Date
  selectedEvent?: CalendarEvent
}

// Event type configurations
export const EVENT_TYPE_CONFIG: Record<EventType, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}> = {
  TRIAL: {
    label: 'Trial',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-400/30',
    icon: '🎯'
  },
  MEETING: {
    label: 'Meeting',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-400/30',
    icon: '👥'
  },
  MATCH: {
    label: 'Match',
    color: 'text-green-300',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-400/30',
    icon: '⚽'
  },
  TRAINING: {
    label: 'Training',
    color: 'text-orange-300',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-400/30',
    icon: '🏃'
  },
  SCOUTING: {
    label: 'Scouting',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-400/30',
    icon: '🔍'
  },
  OTHER: {
    label: 'Other',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-400/30',
    icon: '📅'
  }
}

// Calendar utility types
export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: CalendarEvent[]
}

export interface CalendarWeek {
  days: CalendarDay[]
}

export interface CalendarMonth {
  weeks: CalendarWeek[]
  month: number
  year: number
}