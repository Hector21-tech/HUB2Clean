'use client'

import { useState, useMemo } from 'react'
import { Player, PlayerFilters } from '../types/player'
import { PlayersHeader } from './PlayersHeader'
import { PlayerGrid, PlayerGridSkeleton } from './PlayerGrid'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'
import { AddPlayerModal } from './AddPlayerModal'
import { AddTrialModal } from '../../trials/components/AddTrialModal'
import { usePlayersQuery } from '../hooks/usePlayersQuery'
import { useQueryClient } from '@tanstack/react-query'
import { triggerAvatarCacheInvalidation } from '../hooks/useAvatarUrl'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'
import { apiFetch } from '@/lib/api-config'

export function PlayersPage() {
  const { tenantSlug, tenantId } = useTenantSlug()
  // React Query for data fetching with automatic caching
  const { data: players = [], isLoading: loading, error } = usePlayersQuery(tenantId)
  const queryClient = useQueryClient()

  // UI State - MUST be declared before any early returns to follow Rules of Hooks
  const [filters, setFilters] = useState<PlayerFilters>({})
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false)
  const [isEditPlayerModalOpen, setIsEditPlayerModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [isScheduleTrialModalOpen, setIsScheduleTrialModalOpen] = useState(false)
  const [trialPlayer, setTrialPlayer] = useState<Player | null>(null)

  // Filter and search players - MUST be declared before any early returns to follow Rules of Hooks
  const filteredPlayers = useMemo(() => {
    let filtered = [...players]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(player => {
        // Standard search fields
        const nameMatch = player.firstName?.toLowerCase().includes(searchLower) ||
                          player.lastName?.toLowerCase().includes(searchLower)
        const clubMatch = player.club?.toLowerCase().includes(searchLower)
        const positionMatch = player.positions?.some(pos => pos.toLowerCase().includes(searchLower))
        const nationalityMatch = player.nationality?.toLowerCase().includes(searchLower)

        // Free Agent search - check if player has no club and search includes free agent terms
        const freeAgentTerms = ['free agent', 'free', 'agent', 'freeagent']
        const isFreeAgentSearch = freeAgentTerms.some(term => searchLower.includes(term))
        const isFreeAgent = !player.club || player.club === ''
        const freeAgentMatch = isFreeAgentSearch && isFreeAgent

        return nameMatch || clubMatch || positionMatch || nationalityMatch || freeAgentMatch
      })
    }

    // Position filter
    if (filters.position) {
      filtered = filtered.filter(player => player.positions?.includes(filters.position!))
    }

    // Nationality filter
    if (filters.nationality) {
      filtered = filtered.filter(player => player.nationality === filters.nationality)
    }

    // Contract status filter
    if (filters.contractStatus) {
      filtered = filtered.filter(player => {
        const isFreeAgent = !player.club || player.club === ''
        const hasContract = !isFreeAgent && player.contractExpiry
        const isContractExpiring = hasContract && (() => {
          const today = new Date()
          const expiry = new Date(player.contractExpiry!)
          const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return daysUntilExpiry > 0 && daysUntilExpiry <= 180 // 6 months = ~180 days
        })()

        switch (filters.contractStatus) {
          case 'free_agent':
            return isFreeAgent
          case 'expiring':
            return isContractExpiring
          case 'active':
            // Players with club (not free agent) are considered active, even without explicit contract expiry
            return !isFreeAgent && (!player.contractExpiry || !isContractExpiring)
          default:
            return true
        }
      })
    }

    // Age filters - only apply if values are > 0
    if ((filters.ageMin && filters.ageMin > 0) || (filters.ageMax && filters.ageMax > 0)) {
      filtered = filtered.filter(player => {
        if (!player.dateOfBirth) return false

        const age = Math.floor(
          (new Date().getTime() - new Date(player.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
        )

        if (filters.ageMin && filters.ageMin > 0 && age < filters.ageMin) return false
        if (filters.ageMax && filters.ageMax > 0 && age > filters.ageMax) return false

        return true
      })
    }

    // Rating filters
    if (filters.ratingMin && filters.ratingMax) {
      filtered = filtered.filter(player => {
        if (!player.rating) return false
        return player.rating >= filters.ratingMin! && player.rating <= filters.ratingMax!
      })
    } else if (filters.ratingMin) {
      filtered = filtered.filter(player => {
        if (!player.rating) return false
        return player.rating >= filters.ratingMin!
      })
    } else if (filters.ratingMax) {
      filtered = filtered.filter(player => {
        if (!player.rating) return false
        return player.rating <= filters.ratingMax!
      })
    }

    // Market value filters
    if (filters.marketValueMin && filters.marketValueMax) {
      filtered = filtered.filter(player => {
        if (!player.marketValue) return false
        return player.marketValue >= filters.marketValueMin! && player.marketValue <= filters.marketValueMax!
      })
    } else if (filters.marketValueMin) {
      filtered = filtered.filter(player => {
        if (!player.marketValue) return false
        return player.marketValue >= filters.marketValueMin!
      })
    } else if (filters.marketValueMax) {
      filtered = filtered.filter(player => {
        if (!player.marketValue) return false
        return player.marketValue <= filters.marketValueMax!
      })
    }

    return filtered
  }, [players, filters])

  // Show loading if tenantId is not yet available - AFTER all hooks
  if (!tenantId) {
    return <PlayerGridSkeleton />
  }


  // Mock players for demo/fallback
  const getMockPlayers = (): Player[] => [
    {
      id: 'mock-1',
      tenantId: tenantId || 'mock-tenant',
      firstName: 'Marcus',
      lastName: 'Rashford',
      dateOfBirth: new Date('1997-10-31'),
      positions: ['Forward'],
      club: 'Manchester United',
      nationality: 'England',
      height: 186,
      notes: 'Excellent pace and finishing ability',
      tags: ['pace', 'finishing', 'versatile'],
      rating: 8.5,
      goalsThisSeason: 12,
      assistsThisSeason: 8,
      appearances: 25,
      minutesPlayed: 2100,
      marketValue: 80000000,
      pace: 9.2,
      shooting: 8.1,
      passing: 7.3,
      dribbling: 8.7,
      vision: 7.8,
      strength: 7.5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-2',
      tenantId: tenantId || 'mock-tenant',
      firstName: 'Erling',
      lastName: 'Haaland',
      dateOfBirth: new Date('2000-07-21'),
      positions: ['Striker'],
      club: 'Manchester City',
      nationality: 'Norway',
      height: 194,
      notes: 'Incredible goal scoring record',
      tags: ['goals', 'strength', 'positioning'],
      rating: 9.2,
      goalsThisSeason: 28,
      assistsThisSeason: 5,
      appearances: 30,
      minutesPlayed: 2600,
      marketValue: 120000000,
      pace: 8.8,
      shooting: 9.5,
      passing: 6.9,
      dribbling: 7.4,
      vision: 7.2,
      strength: 9.1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-3',
      tenantId: tenantId || 'mock-tenant',
      firstName: 'Bukayo',
      lastName: 'Saka',
      dateOfBirth: new Date('2001-09-05'),
      positions: ['Winger'],
      club: 'Arsenal',
      nationality: 'England',
      height: 178,
      notes: 'Versatile winger with great crossing ability',
      tags: ['pace', 'crossing', 'young talent'],
      rating: 8.3,
      goalsThisSeason: 9,
      assistsThisSeason: 12,
      appearances: 28,
      minutesPlayed: 2400,
      marketValue: 90000000,
      pace: 8.9,
      shooting: 7.8,
      passing: 8.2,
      dribbling: 8.8,
      vision: 8.1,
      strength: 6.8,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]


  const handleFiltersChange = (newFilters: PlayerFilters) => {
    setFilters(newFilters)
  }

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player)
  }

  const handleDrawerClose = () => {
    setSelectedPlayer(null)
  }

  const handleAddPlayer = () => {
    setIsAddPlayerModalOpen(true)
  }

  const handleAddPlayerClose = () => {
    setIsAddPlayerModalOpen(false)
  }

  const handleSavePlayer = async (playerData: any) => {
    try {
      // Validate tenant context before making API call
      if (!tenantId) {
        throw new Error('No tenant context available')
      }

      // Use centralized API configuration for environment-specific URLs
      const response = await apiFetch(`/api/players?tenant=${tenantId}`, {
        method: 'POST',
        body: JSON.stringify(playerData),
      })


      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Add new player to local state
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['players', tenantId] })

        // Invalidate avatar cache to ensure new avatars show immediately
        triggerAvatarCacheInvalidation()

        console.log('✅ Player added successfully:', result.data)
      } else {
        console.error('❌ Error adding player:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ Error saving player:', error)
      throw error
    }
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setIsEditPlayerModalOpen(true)
    setSelectedPlayer(null) // Close detail drawer
  }

  const handleUpdatePlayer = async (playerData: any) => {
    try {
      // Validate tenant context before making API call
      if (!tenantId) {
        throw new Error('No tenant context available')
      }

      console.log('✏️ Updating player:', editingPlayer?.id)
      console.log('📋 Updated data:', playerData)

      // Use centralized API configuration for environment-specific URLs
      const response = await apiFetch(`/api/players?tenant=${tenantId}&id=${editingPlayer?.id}`, {
        method: 'PUT',
        body: JSON.stringify(playerData),
      })

      const result = await response.json()

      if (result.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['players', tenantId] })

        // Invalidate avatar cache to ensure updated avatars show immediately
        triggerAvatarCacheInvalidation()

        console.log('✅ Player updated successfully:', result.data)
        setIsEditPlayerModalOpen(false)
        setEditingPlayer(null)
      } else {
        console.error('❌ Error updating player:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ Error updating player:', error)
      throw error
    }
  }

  const handleDeletePlayer = async (player: Player) => {
    try {
      // Validate tenant context before making API call
      if (!tenantId) {
        throw new Error('No tenant context available')
      }

      console.log('🗑️ Deleting player:', player.id)

      // Close detail drawer immediately for better UX
      setSelectedPlayer(null)

      // Optimistic update: immediately remove from cache
      const queryKey = ['players', tenantId]
      const previousData = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (oldData: Player[] | undefined) => {
        if (!oldData) return oldData
        return oldData.filter(p => p.id !== player.id)
      })

      try {
        // Use centralized API configuration for environment-specific URLs
        const response = await apiFetch(`/api/players?id=${player.id}&tenantId=${tenantId}`, {
          method: 'DELETE'
        })

        const result = await response.json()

        if (result.success) {
          console.log('✅ Player deleted successfully')
          // No need to invalidate - optimistic update already handled cache update
        } else {
          console.error('❌ Error deleting player:', result.error)
          // Rollback optimistic update - restore previous data then force refetch
          queryClient.setQueryData(queryKey, previousData)
          await queryClient.refetchQueries({ queryKey, type: 'active' })
          throw new Error(result.error)
        }
      } catch (networkError) {
        console.error('❌ Network error deleting player:', networkError)
        // Rollback optimistic update - restore previous data then force refetch
        queryClient.setQueryData(queryKey, previousData)
        await queryClient.refetchQueries({ queryKey, type: 'active' })
        throw networkError
      }
    } catch (error) {
      console.error('❌ Error deleting player:', error)
      throw error
    }
  }

  const handleScheduleTrial = (player: Player) => {
    setTrialPlayer(player)
    setIsScheduleTrialModalOpen(true)
    setSelectedPlayer(null) // Close detail drawer
  }

  // Don't show error state since we have fallback data
  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
  //           <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  //           </svg>
  //         </div>
  //         <h2 className="text-xl font-semibold text-[#3E2723] mb-2">Something went wrong</h2>
  //         <p className="text-[#3E2723]/60 mb-4">{error}</p>
  //         <button
  //           onClick={() => window.location.reload()}
  //           className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#D4AF37]/90 transition-colors duration-200"
  //         >
  //           Try Again
  //         </button>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="flex-1 relative">
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="relative bg-blue-600/20 border border-blue-400/30 text-white p-3 text-sm">
          <strong>Debug:</strong> Tenant: {tenantId} | Players: {players.length} | Loading: {loading.toString()} | Error: {error?.message || 'None'}
        </div>
      )}

      {/* Header */}
      <div className="relative">
        <PlayersHeader
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalPlayers={filteredPlayers.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddPlayer={handleAddPlayer}
        players={players}
        />
      </div>

      {/* Main Content */}
      <div className="relative p-6">
        {loading ? (
          <PlayerGridSkeleton />
        ) : (
          <PlayerGrid
            players={filteredPlayers}
            loading={loading}
            onPlayerSelect={handlePlayerSelect}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* Detail Drawer */}
      <PlayerDetailDrawer
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={handleDrawerClose}
        onEdit={handleEditPlayer}
        onDelete={handleDeletePlayer}
        onScheduleTrial={handleScheduleTrial}
      />

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={isAddPlayerModalOpen}
        onClose={handleAddPlayerClose}
        onSave={handleSavePlayer}
        tenantId={tenantId || 'unknown'}
      />

      {/* Edit Player Modal */}
      <AddPlayerModal
        isOpen={isEditPlayerModalOpen}
        onClose={() => {
          setIsEditPlayerModalOpen(false)
          setEditingPlayer(null)
        }}
        onSave={handleUpdatePlayer}
        tenantId={tenantId || 'unknown'}
        editingPlayer={editingPlayer}
      />

      {/* Schedule Trial Modal */}
      <AddTrialModal
        isOpen={isScheduleTrialModalOpen}
        onClose={() => {
          setIsScheduleTrialModalOpen(false)
          setTrialPlayer(null)
        }}
        preSelectedPlayerId={trialPlayer?.id}
      />
    </div>
  )
}

// Export individual components for flexibility
export {
  PlayersHeader,
  PlayerGrid,
  PlayerCard,
  PlayerDetailDrawer
} from './index'