import { useQuery } from '@tanstack/react-query'
import { Player } from '../types/player'
import { apiFetch } from '@/lib/api-config'


// Mock players for demo/fallback - moved from PlayersPage
const getMockPlayers = (): Player[] => [
  {
    id: 'mock-1',
    firstName: 'Marcus',
    lastName: 'Lindberg',
    dateOfBirth: new Date('1995-03-15'),
    nationality: 'Sweden',
    positions: ['CAM', 'LW'],
    club: 'IFK Göteborg',
    height: 178,
    rating: 8.2,
    notes: 'Mycket teknisk spelare med exceptionella avslut. Mycket farlig i en-mot-en-situationer. Har en god näsa för mål.',
    tags: ['Technical', 'Clinical Finisher'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    goalsThisSeason: 12,
    assistsThisSeason: 8,
    appearances: 22,
    minutesPlayed: 1890,
    marketValue: 2500000,
    contractExpiry: new Date('2025-06-30'),
    tenantId: 'mock-tenant',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-2',
    firstName: 'Erik',
    lastName: 'Johansson',
    dateOfBirth: new Date('1998-08-22'),
    nationality: 'Sweden',
    positions: ['CB', 'DMF'],
    club: 'Free Agent',
    height: 185,
    rating: 7.8,
    notes: 'Stark i luften och bra med bollen vid fötterna. Kan spela både som mittback och defensiv mittfältare.',
    tags: ['Versatile', 'Good in Air'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    goalsThisSeason: 3,
    assistsThisSeason: 2,
    appearances: 18,
    minutesPlayed: 1620,
    marketValue: 1800000,
    tenantId: 'mock-tenant',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

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
      return getMockPlayers()
    }

    if (!result.data) {
      console.warn('⚠️ API returned no data field')
      return getMockPlayers()
    }

    if (result.data.length === 0) {
      console.warn('⚠️ API returned empty data array')
      return getMockPlayers()
    }

    console.log('✅ Returning real players:', result.data.length)
    return result.data
  } catch (error) {
    console.error('❌ fetchPlayers error:', error)
    return getMockPlayers()
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