import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trial, CreateTrialInput, UpdateTrialInput, TrialEvaluationInput } from '../types/trial'
import { apiFetch } from '@/lib/api-config'
import { CalendarEvent } from '@/modules/calendar/types/calendar'

interface TrialResponse {
  success: boolean
  data: Trial
  message?: string
}

// Create trial mutation
export function useCreateTrial(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trialData: CreateTrialInput): Promise<Trial> => {
      const response = await apiFetch(`/api/trials?tenant=${tenantId}`, {
        method: 'POST',
        body: JSON.stringify(trialData)
      })

      const result: TrialResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to create trial')
      }

      return result.data
    },
    onSuccess: (newTrial) => {
      // OPTIMISTIC UPDATE: Add new trial to ALL matching caches (with any filters)
      queryClient.setQueriesData(
        { queryKey: ['trials', tenantId] },
        (old: Trial[] | undefined) => {
          if (!old) return [newTrial]
          return [newTrial, ...old]
        }
      )
      // ✅ Updates ALL queries: ['trials', tenantId, filters] etc

      // 🗓️ INSTANT CALENDAR SYNC: Add optimistic calendar event immediately
      const optimisticCalendarEvent: CalendarEvent = {
        id: `temp-${newTrial.id}`, // Temporary ID
        tenantId: newTrial.tenantId,
        title: newTrial.player
          ? `Trial: ${newTrial.player.firstName} ${newTrial.player.lastName}`
          : 'Trial',
        description: newTrial.notes || undefined,
        startTime: new Date(newTrial.scheduledAt).toISOString(),
        endTime: new Date(new Date(newTrial.scheduledAt).getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
        location: newTrial.location || undefined,
        type: 'TRIAL',
        isAllDay: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trialId: newTrial.id,
        trial: {
          id: newTrial.id,
          status: newTrial.status,
          rating: newTrial.rating,
          player: newTrial.player || null,
          request: newTrial.request || null
        }
      }

      queryClient.setQueriesData(
        { queryKey: ['calendar-events', tenantId] },
        (old: CalendarEvent[] | undefined) => {
          if (!old) return [optimisticCalendarEvent]
          return [optimisticCalendarEvent, ...old]
        }
      )

      // Then force refetch to get real data from backend (with real event ID)
      queryClient.invalidateQueries({
        queryKey: ['calendar-events', tenantId]
      })
    }
  })
}

// Update trial mutation
export function useUpdateTrial(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trialId, data }: { trialId: string; data: UpdateTrialInput }): Promise<Trial> => {
      const response = await apiFetch(`/api/trials/${trialId}?tenant=${tenantId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })

      const result: TrialResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to update trial')
      }

      return result.data
    },
    onSuccess: (updatedTrial) => {
      // OPTIMISTIC UPDATE: Replace trial in ALL matching caches (with any filters)
      queryClient.setQueriesData(
        { queryKey: ['trials', tenantId] },
        (old: Trial[] | undefined) => {
          if (!old) return [updatedTrial]
          return old.map(t => t.id === updatedTrial.id ? updatedTrial : t)
        }
      )
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
      // ✅ Updates ALL queries: ['trials', tenantId, filters] etc

      // 🗓️ SYNC CALENDAR: Force refetch ALL calendar queries immediately
      queryClient.invalidateQueries({
        queryKey: ['calendar-events', tenantId]
      })
    }
  })
}

// Delete trial mutation
export function useDeleteTrial(tenantId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trialId: string): Promise<void> => {
      const response = await apiFetch(`/api/trials/${trialId}?tenant=${tenantId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete trial')
      }
    },
    onMutate: async (trialId: string) => {
      // INSTANT UI UPDATE: Remove trial from cache immediately

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['trials', tenantId] })
      await queryClient.cancelQueries({ queryKey: ['calendar-events', tenantId] })

      // Snapshot previous values for rollback
      const previousTrials = queryClient.getQueryData(['trials', tenantId])
      const previousEvents = queryClient.getQueryData(['calendar-events', tenantId])

      // Optimistically update trials list
      queryClient.setQueriesData(
        { queryKey: ['trials', tenantId] },
        (old: Trial[] | undefined) => {
          if (!old) return old
          return old.filter(trial => trial.id !== trialId)
        }
      )

      // 🗓️ INSTANT CALENDAR UPDATE: Remove calendar event with this trialId
      queryClient.setQueriesData(
        { queryKey: ['calendar-events', tenantId] },
        (old: CalendarEvent[] | undefined) => {
          if (!old) return old
          return old.filter(event => event.trialId !== trialId)
        }
      )

      // Remove single trial from cache
      queryClient.removeQueries({ queryKey: ['trial', trialId, tenantId] })

      // Return context for rollback
      return { previousTrials, previousEvents }
    },
    onError: (err, trialId, context) => {
      // ROLLBACK: Restore previous data on error
      if (context?.previousTrials) {
        queryClient.setQueryData(['trials', tenantId], context.previousTrials)
      }
      if (context?.previousEvents) {
        queryClient.setQueryData(['calendar-events', tenantId], context.previousEvents)
      }
      // Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['trials', tenantId], type: 'active' })
      queryClient.refetchQueries({ queryKey: ['calendar-events', tenantId], type: 'active' })
    },
    onSuccess: () => {
      // 🗓️ SYNC CALENDAR: Force refetch ALL calendar queries immediately
      queryClient.invalidateQueries({
        queryKey: ['calendar-events', tenantId]
      })
    }
  })
}

// Evaluate trial mutation
export function useEvaluateTrial(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trialId, evaluation }: { trialId: string; evaluation: TrialEvaluationInput }): Promise<Trial> => {
      const response = await apiFetch(`/api/trials/${trialId}/evaluate?tenant=${tenantId}`, {
        method: 'POST',
        body: JSON.stringify(evaluation)
      })

      const result: TrialResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to evaluate trial')
      }

      return result.data
    },
    onSuccess: (updatedTrial) => {
      // OPTIMISTIC UPDATE: Replace trial in ALL matching caches (with any filters)
      queryClient.setQueriesData(
        { queryKey: ['trials', tenantId] },
        (old: Trial[] | undefined) => {
          if (!old) return [updatedTrial]
          return old.map(t => t.id === updatedTrial.id ? updatedTrial : t)
        }
      )
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
      // ✅ Updates ALL queries: ['trials', tenantId, filters] etc

      // 🗓️ SYNC CALENDAR: Force refetch ALL calendar queries immediately
      queryClient.invalidateQueries({
        queryKey: ['calendar-events', tenantId]
      })
    }
  })
}

// Bulk update trial status (useful for batch operations)
export function useUpdateTrialStatus(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trialId, status }: { trialId: string; status: Trial['status'] }): Promise<Trial> => {
      const response = await apiFetch(`/api/trials/${trialId}?tenant=${tenantId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })

      const result: TrialResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to update trial status')
      }

      return result.data
    },
    onSuccess: (updatedTrial) => {
      // OPTIMISTIC UPDATE: Replace trial in ALL matching caches (with any filters)
      queryClient.setQueriesData(
        { queryKey: ['trials', tenantId] },
        (old: Trial[] | undefined) => {
          if (!old) return [updatedTrial]
          return old.map(t => t.id === updatedTrial.id ? updatedTrial : t)
        }
      )
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
      // ✅ Updates ALL queries: ['trials', tenantId, filters] etc
    }
  })
}