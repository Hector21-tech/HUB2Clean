'use client'

import { Player } from '../types/player'
import { PlayerCard } from './PlayerCard'
import { Loader2, User } from 'lucide-react'
import { useAvatarUrl } from '../hooks/useAvatarUrl'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'

interface PlayerGridProps {
  players: Player[]
  loading?: boolean
  onPlayerSelect: (player: Player) => void
  viewMode: 'grid' | 'list'
}

export function PlayerGrid({ players, loading, onPlayerSelect, viewMode }: PlayerGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-4" />
        <p className="text-white/60 text-sm">Loading players...</p>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-400/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-blue-400/60" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Add your first player</h3>
        <p className="text-white/60 text-sm max-w-md">
          Start building your scouting database by adding players to track their progress and performance.
        </p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
        {/* Desktop List Header - Hidden on mobile */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-white/10 backdrop-blur-md border-b border-white/20 text-sm font-medium text-white/60">
          <div className="col-span-2">Player</div>
          <div className="col-span-2">Position</div>
          <div className="col-span-1">Club</div>
          <div className="col-span-2">Contract Status</div>
          <div className="col-span-1">Age</div>
          <div className="col-span-1">Rating</div>
          <div className="col-span-1">Goals</div>
          <div className="col-span-1">Assists</div>
          <div className="col-span-1">Value</div>
        </div>

        {/* List Items */}
        <div className="divide-y divide-white/20">
          {players.map((player) => (
            <PlayerListItem
              key={player.id}
              player={player}
              onPlayerSelect={onPlayerSelect}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`
      grid gap-6
      grid-cols-1
      md:grid-cols-3
      lg:grid-cols-4
      xl:grid-cols-5
      2xl:grid-cols-5
    `}>
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          onCardClick={onPlayerSelect}
        />
      ))}
    </div>
  )
}

// Helper component for individual list items with proper avatar handling
interface PlayerListItemProps {
  player: Player
  onPlayerSelect: (player: Player) => void
}

function PlayerListItem({ player, onPlayerSelect }: PlayerListItemProps) {
  const { tenantSlug } = useTenantSlug()
  const { url: avatarUrl, isLoading: avatarLoading, error: imageError } = useAvatarUrl({
    avatarPath: player.avatarPath,
    avatarUrl: player.avatarUrl,
    tenantId: tenantSlug || 'default',
    playerName: `${player.firstName} ${player.lastName}`
  })

  const getPlayerInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return first + last
  }

  return (
    <div
      onClick={() => onPlayerSelect(player)}
      className="cursor-pointer transition-colors duration-200 hover:bg-white/5 min-h-[80px]"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 items-center">
        <div className="col-span-2 flex items-center gap-3">
          <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-lg flex items-center justify-center overflow-hidden">
            {/* Avatar Image */}
            {avatarUrl && !imageError && !avatarLoading && (
              <img
                src={avatarUrl}
                alt={`${player.firstName} ${player.lastName}`}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}

            {/* Placeholder Avatar when no image available */}
            {(!avatarUrl || imageError || avatarLoading) && (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                <span className="text-sm font-bold text-white">
                  {getPlayerInitials(player.firstName, player.lastName)}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white/90" translate="no" lang="en">
              {player.firstName} {player.lastName}
            </p>
            <p className="text-xs text-white/60">{player.nationality}</p>
          </div>
        </div>
        <div className="col-span-2 flex items-center">
          <span className="text-sm text-white/90">{player.positions?.join(', ') || 'N/A'}</span>
        </div>
        <div className="col-span-1 flex items-center">
          <span className="text-sm text-white/90 truncate">{player.club || 'Free Agent'}</span>
        </div>
        <div className="col-span-2 flex items-center">
          {(() => {
            const isFreeAgent = !player.club || player.club === ''
            if (isFreeAgent) {
              return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                  🟡 Free Agent
                </span>
              )
            }

            if (player.contractExpiry) {
              const today = new Date()
              const expiry = new Date(player.contractExpiry)
              const diffTime = expiry.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

              if (diffDays < 0) {
                return (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                    🔴 Expired
                  </span>
                )
              } else if (diffDays <= 180) {
                return (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                    🟠 {diffDays}d left
                  </span>
                )
              } else {
                return (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    🟢 {Math.round(diffDays / 30)}m left
                  </span>
                )
              }
            }

            return (
              <span className="text-sm text-white/60">
                No contract data
              </span>
            )
          })()}
        </div>
        <div className="col-span-1 flex items-center">
          <span className="text-sm text-white/90">
            {player.dateOfBirth ?
              Math.floor((new Date().getTime() - new Date(player.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))
              : 'N/A'
            }
          </span>
        </div>
        <div className="col-span-1 flex items-center">
          {player.rating ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
              {player.rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-sm text-white/60">-</span>
          )}
        </div>
        <div className="col-span-1 flex items-center">
          <span className="text-sm text-white/90">{player.goalsThisSeason || 0}</span>
        </div>
        <div className="col-span-1 flex items-center">
          <span className="text-sm text-white/90">{player.assistsThisSeason || 0}</span>
        </div>
        <div className="col-span-1 flex items-center">
          <span className="text-sm font-medium text-blue-400">
            {player.marketValue ?
              player.marketValue >= 1000000 ?
                `€${(player.marketValue / 1000000).toFixed(1)}M` :
                player.marketValue >= 1000 ?
                  `€${(player.marketValue / 1000).toFixed(0)}K` :
                  `€${player.marketValue}`
              : '-'
            }
          </span>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-lg flex items-center justify-center overflow-hidden">
            {/* Avatar Image */}
            {avatarUrl && !imageError && !avatarLoading && (
              <img
                src={avatarUrl}
                alt={`${player.firstName} ${player.lastName}`}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}

            {/* Placeholder Avatar when no image available */}
            {(!avatarUrl || imageError || avatarLoading) && (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                <span className="text-sm font-bold text-white">
                  {getPlayerInitials(player.firstName, player.lastName)}
                </span>
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white/90 text-lg leading-tight mb-1" translate="no" lang="en">
              {player.firstName} {player.lastName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
              <span>{player.club || 'Free Agent'}</span>
              <span>•</span>
              <span>{player.positions?.join(', ') || 'Player'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white/60">
                  Age {player.dateOfBirth ?
                    Math.floor((new Date().getTime() - new Date(player.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))
                    : 'N/A'
                  }
                </span>
                {player.rating && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
                    {player.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-blue-400">
                {player.marketValue ?
                  player.marketValue >= 1000000 ?
                    `€${(player.marketValue / 1000000).toFixed(1)}M` :
                    player.marketValue >= 1000 ?
                      `€${(player.marketValue / 1000).toFixed(0)}K` :
                      `€${player.marketValue}`
                  : ''
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton Component
export function PlayerGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className={`
      grid gap-6
      grid-cols-1
      md:grid-cols-3
      lg:grid-cols-4
      xl:grid-cols-5
      2xl:grid-cols-5
    `}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 overflow-hidden"
        >
          {/* Hero Header Skeleton */}
          <div className="relative h-32 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

            {/* Name Skeleton */}
            <div className="absolute bottom-4 left-4">
              <div className="h-5 bg-white/30 rounded animate-pulse mb-2 w-32"></div>
              <div className="h-3 bg-white/20 rounded animate-pulse w-24"></div>
            </div>

            {/* Rating Badge Skeleton */}
            <div className="absolute top-4 right-4">
              <div className="h-6 w-10 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="relative p-4">
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-5 bg-white/20 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-white/15 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Footer Skeleton */}
            <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
              <div className="flex items-center gap-4">
                <div className="h-3 bg-white/15 rounded animate-pulse w-12"></div>
                <div className="h-3 bg-white/15 rounded animate-pulse w-16"></div>
              </div>
              <div className="h-3 bg-blue-400/30 rounded animate-pulse w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}