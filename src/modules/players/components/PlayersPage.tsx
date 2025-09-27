'use client'

import { useState, useMemo } from 'react'
import { Player, PlayerFilters } from '../types/player'
import { usePlayersQuery } from '../hooks/usePlayersQuery'
import { useQueryClient } from '@tanstack/react-query'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'
import { apiFetch } from '@/lib/api-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PlayersPage() {
  const { tenantSlug, tenantId } = useTenantSlug()
  // React Query for data fetching with automatic caching
  const { data: players = [], isLoading: loading, error } = usePlayersQuery(tenantId)
  const queryClient = useQueryClient()

  // UI State - MUST be declared before any early returns to follow Rules of Hooks
  const [filters, setFilters] = useState<PlayerFilters>({})
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

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

        return nameMatch || clubMatch || positionMatch || nationalityMatch
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

    return filtered
  }, [players, filters])

  // Show loading if tenantId is not yet available - AFTER all hooks
  if (!tenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tenant...</p>
        </div>
      </div>
    )
  }

  const handleFiltersChange = (newFilters: PlayerFilters) => {
    setFilters(newFilters)
  }

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player)
  }

  return (
    <div className="flex-1 bg-background">
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-600/20 border border-blue-400/30 text-foreground p-3 text-sm">
          <strong>Debug:</strong> Tenant: {tenantId} | Players: {players.length} | Loading: {loading.toString()} | Error: {error?.message || 'None'}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Players</h1>
              <p className="text-muted-foreground">
                Manage and scout players for {tenantId}
              </p>
            </div>
            <Button>Add Player</Button>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <Input
              placeholder="Search players..."
              value={filters.search || ''}
              onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
              className="max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handlePlayerSelect(player)}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {player.firstName} {player.lastName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {player.club || 'Free Agent'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span>{player.positions?.join(', ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nationality:</span>
                      <span>{player.nationality || 'N/A'}</span>
                    </div>
                    {player.rating && (
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-semibold">{player.rating}/10</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">No players found</h3>
            <p className="text-muted-foreground">
              {filters.search ? 'Try adjusting your search filters.' : 'Start by adding your first player.'}
            </p>
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {selectedPlayer.firstName} {selectedPlayer.lastName}
                </CardTitle>
                <Button variant="ghost" onClick={() => setSelectedPlayer(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Basic Info</h4>
                  <div className="space-y-1">
                    <p><span className="font-medium">Club:</span> {selectedPlayer.club || 'Free Agent'}</p>
                    <p><span className="font-medium">Position:</span> {selectedPlayer.positions?.join(', ') || 'N/A'}</p>
                    <p><span className="font-medium">Nationality:</span> {selectedPlayer.nationality || 'N/A'}</p>
                    {selectedPlayer.height && (
                      <p><span className="font-medium">Height:</span> {selectedPlayer.height} cm</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <div className="space-y-1">
                    {selectedPlayer.rating && (
                      <p><span className="font-medium">Rating:</span> {selectedPlayer.rating}/10</p>
                    )}
                    {selectedPlayer.goalsThisSeason !== undefined && (
                      <p><span className="font-medium">Goals:</span> {selectedPlayer.goalsThisSeason}</p>
                    )}
                    {selectedPlayer.assistsThisSeason !== undefined && (
                      <p><span className="font-medium">Assists:</span> {selectedPlayer.assistsThisSeason}</p>
                    )}
                    {selectedPlayer.appearances !== undefined && (
                      <p><span className="font-medium">Appearances:</span> {selectedPlayer.appearances}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedPlayer.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Scout Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedPlayer.notes}</p>
                </div>
              )}

              {selectedPlayer.tags && selectedPlayer.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayer.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}