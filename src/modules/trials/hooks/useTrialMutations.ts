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
    onSuccess: () => {
      // Invalidate and refetch trials
      queryClient.invalidateQueries({ queryKey: ['trials', tenantId] })
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
      // Invalidate trials list
      queryClient.invalidateQueries({ queryKey: ['trials', tenantId] })
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
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
    onSuccess: (_, trialId) => {
      // Invalidate trials list
      queryClient.invalidateQueries({ queryKey: ['trials', tenantId] })
      // Remove single trial from cache
      queryClient.removeQueries({ queryKey: ['trial', trialId, tenantId] })
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
      // Invalidate trials list
      queryClient.invalidateQueries({ queryKey: ['trials', tenantId] })
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
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
      // Invalidate trials list
      queryClient.invalidateQueries({ queryKey: ['trials', tenantId] })
      // Update single trial cache
      queryClient.setQueryData(['trial', updatedTrial.id, tenantId], updatedTrial)
    }
  })
}