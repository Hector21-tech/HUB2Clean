'use client'

import { useState } from 'react'
import { Player } from '../types/player'
import { formatPositionsDisplay } from '@/lib/positions'
import { formatCurrency, calculateAge, isContractExpiring, getPlayerInitials } from '@/lib/formatters'
import { useAvatarUrl } from '../hooks/useAvatarUrl'

interface PlayerCardProps {
  player: Player
  onCardClick: (player: Player) => void
}

export function PlayerCard({ player, onCardClick }: PlayerCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Get the best avatar URL (new system with fallback to legacy)
  const { url: avatarUrl, isLoading: avatarLoading } = useAvatarUrl({
    avatarPath: player.avatarPath,
    avatarUrl: player.avatarUrl,
    tenantId: player.tenantId,
    playerName: `${player.firstName} ${player.lastName}`
  })

  return (
    <div
      className={`
        relative bg-white/10 backdrop-blur-md
        rounded-lg shadow-lg cursor-pointer transition-all duration-200
        border border-white/20 overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400
        ${isHovered ? 'bg-white/15 border-white/30 shadow-xl' : 'shadow-lg'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick(player)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCardClick(player)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${player.firstName} ${player.lastName}, ${player.club || 'Free Agent'}`}
    >

      {/* Hero Header */}
      <div className="relative h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
        {/* Player Avatar/Background */}
        {avatarUrl && !imageError && !avatarLoading && (
          <img
            src={avatarUrl}
            alt={`Profile photo of ${player.firstName} ${player.lastName}`}
            className="absolute inset-0 w-full h-full object-cover object-top filter sepia-[5%] contrast-105 brightness-98"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement

              // First attempt: try to reload with cache busting
              if (!target.dataset.retried) {
                target.dataset.retried = 'true'
                const url = new URL(target.src)
                url.searchParams.set('t', Date.now().toString())
                target.src = url.toString()
                return
              }

              // Second attempt: try removing query parameters
              if (!target.dataset.cleaned) {
                target.dataset.cleaned = 'true'
                const cleanUrl = target.src.split('?')[0]
                if (cleanUrl !== target.src) {
                  target.src = cleanUrl
                  return
                }
              }

              // Final fallback: hide image
              console.warn(`Failed to load player image: ${target.src}`)
              setImageError(true)
            }}
            onLoad={(e) => {
              // Reset error state and retry flags on successful load
              setImageError(false)
              const target = e.target as HTMLImageElement
              delete target.dataset.retried
              delete target.dataset.cleaned
            }}
          />
        )}

        {/* Enhanced Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Player Name Overlay */}
        <div className="absolute bottom-4 left-4">
          <h3 className="text-xl font-semibold text-white leading-tight" translate="no" lang="en">
            {player.firstName} {player.lastName}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className={`${player.club ? 'text-white/80' : 'text-yellow-300 font-medium'}`}>
              {player.club || 'Free Agent'}
            </span>
            <span className="text-white/60">•</span>
            <span className="text-white/80">
              {formatPositionsDisplay(player.positions || []) || 'Player'}
            </span>
          </div>
        </div>


        {/* Rating Badge */}
        {player.rating && (
          <div className="absolute top-4 right-4">
            <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {player.rating.toFixed(1)}
            </div>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="relative p-4">

        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4" role="group" aria-label="Player statistics">
          <div className="text-center">
            <div className="text-lg font-semibold text-white" aria-label={`${player.goalsThisSeason || 0} goals`}>
              {player.goalsThisSeason || 0}
            </div>
            <div className="text-xs text-white/60">Goals</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white" aria-label={`${player.assistsThisSeason || 0} assists`}>
              {player.assistsThisSeason || 0}
            </div>
            <div className="text-xs text-white/60">Assists</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white" aria-label={`${player.appearances || 0} matches`}>
              {player.appearances || 0}
            </div>
            <div className="text-xs text-white/60">Matches</div>
          </div>
        </div>

        {/* Quick Info Footer */}
        <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3" role="group" aria-label="Player details">
          <div className="flex items-center gap-4">
            <span className="text-white/60" aria-label={`Age ${calculateAge(player.dateOfBirth) || 'unknown'}`}>
              Age {calculateAge(player.dateOfBirth) || 'N/A'}
            </span>
            <span className="text-white/60" aria-label={`Nationality ${player.nationality || 'unknown'}`}>
              {player.nationality || 'Unknown'}
            </span>
            <span className={`${
              !player.club
                ? 'text-yellow-300 font-medium'
                : isContractExpiring(player.contractExpiry)
                  ? 'text-yellow-400 font-medium'
                  : 'text-white/60'
            }`} aria-label={`Contract status`}>
              {!player.club
                ? 'Free Agent'
                : player.contractExpiry
                  ? new Date(player.contractExpiry).toLocaleDateString('sv-SE')
                  : 'No contract date'
              }
            </span>
          </div>
          <span className="text-blue-400 font-semibold" aria-label={`Market value ${formatCurrency(player.marketValue)}`}>
            {formatCurrency(player.marketValue)}
          </span>
        </div>

      </div>
    </div>
  )
}