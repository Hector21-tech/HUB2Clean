import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trial, CreateTrialInput, UpdateTrialInput, TrialEvaluationInput } from '../types/trial'
import { apiFetch } from '@/lib/api-config'

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
      // OPTIMISTIC UPDATE: Add new trial to cache using API response
      queryClient.setQueryData(['trials', tenantId], (old: Trial[] | undefined) => {
        if (!old) return [newTrial]
        return [newTrial, ...old]
      })
      // ✅ NO REFETCH NEEDED - cache updated with API response data instantly
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
      // OPTIMISTIC UPDATE: Replace trial in cache using API response
      queryClient.setQueryData(['trials', tenantId], (old: Trial[] | undefined) => {
        if (!old) return [updatedTrial]
        return old.map(t => t.id === updatedTrial.id ? updatedTrial : t)
      })
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
      // ✅ NO REFETCH NEEDED - cache updated with API response data instantly
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

      // Snapshot previous values for rollback
      const previousTrials = queryClient.getQueryData(['trials', tenantId])

      // Optimistically update trials list
      queryClient.setQueriesData(
        { queryKey: ['trials', tenantId] },
        (old: Trial[] | undefined) => {
          if (!old) return old
          return old.filter(trial => trial.id !== trialId)
        }
      )

      // Remove single trial from cache
      queryClient.removeQueries({ queryKey: ['trial', trialId, tenantId] })

      // Return context for rollback
      return { previousTrials }
    },
    onError: (err, trialId, context) => {
      // ROLLBACK: Restore previous data on error
      if (context?.previousTrials) {
        queryClient.setQueryData(['trials', tenantId], context.previousTrials)
      }
      // Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['trials', tenantId], type: 'active' })
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
      // OPTIMISTIC UPDATE: Replace trial in cache using API response
      queryClient.setQueryData(['trials', tenantId], (old: Trial[] | undefined) => {
        if (!old) return [updatedTrial]
        return old.map(t => t.id === updatedTrial.id ? updatedTrial : t)
      })
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
      // ✅ NO REFETCH NEEDED - cache updated with API response data instantly
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
      // OPTIMISTIC UPDATE: Replace trial in cache using API response
      queryClient.setQueryData(['trials', tenantId], (old: Trial[] | undefined) => {
        if (!old) return [updatedTrial]
        return old.map(t => t.id === updatedTrial.id ? updatedTrial : t)
      })
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
      // ✅ NO REFETCH NEEDED - cache updated with API response data instantly
    }
  })
}