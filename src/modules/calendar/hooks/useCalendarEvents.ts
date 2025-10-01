'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarEvent, CreateEventInput, UpdateEventInput, CalendarEventConflict } from '../types/calendar'
import { apiFetch } from '@/lib/api-config'

interface FetchEventsParams {
  tenantId: string
  start?: string
  end?: string
  type?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  conflicts?: CalendarEventConflict[]
  error?: string
}

// Fetch calendar events
async function fetchCalendarEvents({ tenantId, start, end, type }: FetchEventsParams): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ tenant: tenantId })
  if (start) params.append('start', start)
  if (end) params.append('end', end)
  if (type) params.append('type', type)

  const response = await apiFetch(`/api/calendar/events?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events')
  }

  const result: ApiResponse<CalendarEvent[]> = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch calendar events')
  }

  return result.data
}

// Create calendar event
async function createCalendarEvent(tenantId: string, input: CreateEventInput): Promise<{ event: CalendarEvent; conflicts?: CalendarEventConflict[] }> {
  const response = await apiFetch(`/api/calendar/events?tenant=${tenantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create calendar event')
  }

  const result: ApiResponse<CalendarEvent> = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to create calendar event')
  }

  return {
    event: result.data,
    conflicts: result.conflicts
  }
}

// Update calendar event
async function updateCalendarEvent(tenantId: string, input: UpdateEventInput): Promise<CalendarEvent> {
  const { id, ...updateData } = input

  const response = await apiFetch(`/api/calendar/events/${id}?tenant=${tenantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update calendar event')
  }

  const result: ApiResponse<CalendarEvent> = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to update calendar event')
  }

  return result.data
}

// Delete calendar event
async function deleteCalendarEvent(tenantId: string, id: string): Promise<void> {
  const response = await apiFetch(`/api/calendar/events/${id}?tenant=${tenantId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete calendar event')
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete calendar event')
  }
}

// Hook for fetching calendar events
export function useCalendarEvents(params: FetchEventsParams) {
  return useQuery({
    queryKey: ['calendar-events', params.tenantId, params],
    queryFn: () => fetchCalendarEvents(params),
    enabled: !!params.tenantId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for creating calendar events
export function useCreateEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEventInput) => createCalendarEvent(tenantId, input),
    onSuccess: () => {
      // Invalidate and refetch calendar events
      queryClient.invalidateQueries({ queryKey: ['calendar-events', tenantId] })
    }
  })
}

// Hook for updating calendar events
export function useUpdateEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateEventInput) => updateCalendarEvent(tenantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events', tenantId] })
    }
  })
}

// Hook for deleting calendar events
export function useDeleteEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(tenantId, id),
    onMutate: async (id: string) => {
      // INSTANT UI UPDATE: Remove event from all relevant caches immediately

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['calendar-events', tenantId] })

      // Snapshot previous values for rollback
      const previousAllEvents = queryClient.getQueryData(['calendar-events', tenantId])

      // Optimistically update all event queries
      queryClient.setQueriesData(
        { queryKey: ['calendar-events', tenantId] },
        (old: CalendarEvent[] | undefined) => {
          if (!old) return old
          return old.filter(event => event.id !== id)
        }
      )

      // Return context for rollback
      return { previousAllEvents }
    },
    onError: (err, id, context) => {
      // ROLLBACK: Restore previous data on error
      if (context?.previousAllEvents) {
        queryClient.setQueryData(['calendar-events', tenantId], context.previousAllEvents)
      }
      // Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['calendar-events', tenantId], type: 'active' })
    }
  })
}

// Hook for fetching events within a date range (useful for calendar views)
export function useCalendarEventsInRange(tenantId: string, startDate: Date, endDate: Date, type?: string) {
  return useCalendarEvents({
    tenantId,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    type
  })
}