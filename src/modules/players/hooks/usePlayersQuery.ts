import { useQuery } from '@tanstack/react-query'
import { Player } from '../types/player'
import { apiFetch } from '@/lib/api-config'

const fetchPlayers = async (tenantId: string): Promise<Player[]> => {
  try {
    console.log('🔄 fetchPlayers called with tenantId:', tenantId)

    // Use centralized API configuration for environment-specific URLs
    const response = await apiFetch(`/api/players?tenant=${tenantId}`)
    console.log('📡 API Response status:', response.status)

    const result = await response.json()
    console.log('📋 API Result:', { success: result.success, dataLength: result.data?.length, error: result.error })

    if (!result.success) {
      console.error('❌ API returned error:', result.error)
      return []
    }

    if (!result.data) {
      console.warn('⚠️ API returned no data field')
      return []
    }

    if (result.data.length === 0) {
      console.log('ℹ️ No players found for tenant')
      return []
    }

    console.log('✅ Returning real players:', result.data.length)
    return result.data
  } catch (error) {
    console.error('❌ fetchPlayers error:', error)
    return []
  }
}

export function usePlayersQuery(tenantId: string | null) {
  return useQuery({
    queryKey: ['players', tenantId],
    queryFn: () => fetchPlayers(tenantId!),
    enabled: !!tenantId, // Only run query when tenantId is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  })
}