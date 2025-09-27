'use client'

import { useState } from 'react'
import { Calendar, MapPin, User, Star, Clock, Edit, Trash2, CheckCircle } from 'lucide-react'
import { Trial } from '../types/trial'
import { TrialStatusBadge } from './TrialStatusBadge'
import { useAvatarUrl } from '../../players/hooks/useAvatarUrl'
// import { getPlayerInitials } from '@/lib/formatters' // Removed - no longer using initials
import { getFullPositionName } from '@/lib/positions'
import { useUpdateTrialStatus } from '../hooks/useTrialMutations'

interface TrialCardProps {
  trial: Trial
  onEdit?: (trial: Trial) => void
  onDelete?: (trial: Trial) => void
  onEvaluate?: (trial: Trial) => void
  onClick?: (trial: Trial) => void
}

export function TrialCard({ trial, onEdit, onDelete, onEvaluate, onClick }: TrialCardProps) {
  const [imageError, setImageError] = useState(false)

  // Hook for updating trial status
  const updateTrialStatus = useUpdateTrialStatus(trial.tenantId)

  const playerName = trial.player
    ? `${trial.player.firstName} ${trial.player.lastName}`
    : 'Unknown Player'

  // Extract club from notes if it starts with "Club: "
  const extractClubFromNotes = (notes: string | null | undefined): string | null => {
    if (!notes) return null
    const clubMatch = notes.match(/^Club: (.+?)(?:\n|$)/)
    return clubMatch ? clubMatch[1] : null
  }

  const trialClub = trial.request?.club || extractClubFromNotes(trial.notes) || 'Unknown Club'
  const trialTitle = `Trial with → ${trialClub}`

  const playerPosition = trial.player?.position
    ? getFullPositionName(trial.player.position)
    : 'No position'

  // Get player avatar URL
  const { url: avatarUrl, isLoading: avatarLoading } = useAvatarUrl({
    avatarPath: trial.player?.avatarPath || undefined,
    avatarUrl: trial.player?.avatarUrl || undefined,
    tenantId: trial.tenantId,
    playerName: trial.player ? `${trial.player.firstName} ${trial.player.lastName}` : undefined
  })

  const trialDate = new Date(trial.scheduledAt)
  const isUpcoming = trialDate > new Date()
  const isPast = trialDate < new Date()
  const canEvaluate = trial.status === 'COMPLETED' && !trial.rating

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleCardClick = () => {
    onClick?.(trial)
  }

  const handleMarkCompleted = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click

    const confirmed = window.confirm('Are you sure you want to mark this trial as completed?')
    if (!confirmed) return

    updateTrialStatus.mutate({
      trialId: trial.id,
      status: 'COMPLETED'
    }, {
      onError: (error) => {
        console.error('Failed to mark trial as completed:', error)
        // Error is handled by React Query and displayed to user
      }
    })
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(trial)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(trial)
  }

  const handleEvaluate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEvaluate?.(trial)
  }

  return (
    <div
      className={`
        group relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20
        shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer
        hover:scale-[1.02] hover:bg-white/15
        ${canEvaluate ? 'ring-2 ring-yellow-400/50' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Player Avatar */}
            {avatarUrl && !imageError && !avatarLoading ? (
              <img
                src={avatarUrl}
                alt={`Profile photo of ${trial.player?.firstName} ${trial.player?.lastName}`}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
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

                  // Final fallback: show initials
                  console.warn(`Failed to load player image: ${target.src}`)
                  setImageError(true)
                }}
                onLoad={(e) => {
                  // Reset error state and retry flags on successful load
                  setImageError(false)
                  const target = e.target as HTMLImageElement
                  delete target.dataset.retried
                }}
              />
            ) : (
              // Fallback Avatar - Show generic icon only
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white">{playerName}</h3>
              <p className="text-sm text-blue-300 font-medium">{trialTitle}</p>
              <p className="text-sm text-white/60">{playerPosition}</p>
            </div>
          </div>
          <TrialStatusBadge status={trial.status} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-white/40" />
          <span className={`
            ${isUpcoming ? 'text-blue-400 font-medium' : 'text-white'}
            ${isPast ? 'text-white/60' : ''}
          `}>
            {formatDate(trialDate)}
          </span>
          {isUpcoming && (
            <span className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded-full">
              Upcoming
            </span>
          )}
        </div>

        {/* Location */}
        {trial.location && (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <MapPin className="w-4 h-4 text-white/40" />
            <span>{trial.location}</span>
          </div>
        )}

        {/* Club */}
        {trial.player?.club && (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <User className="w-4 h-4 text-white/40" />
            <span>{trial.player.club}</span>
          </div>
        )}

        {/* Notes Preview */}
        {trial.notes && (
          <div className="text-sm text-white/70 line-clamp-2">
            {trial.notes}
          </div>
        )}

        {/* Rating */}
        {trial.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium text-white">{trial.rating}/10</span>
          </div>
        )}

        {/* Evaluation Required Banner */}
        {canEvaluate && (
          <div className="bg-yellow-600/20 border border-yellow-400/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-200">
                Evaluation Required
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 p-4 pt-0">
        {/* Mark as Completed button - only show for non-completed trials */}
        {trial.status !== 'COMPLETED' && trial.status !== 'CANCELLED' && (
          <button
            onClick={handleMarkCompleted}
            disabled={updateTrialStatus.isPending}
            className="p-2 text-green-400/70 hover:text-green-400 transition-colors disabled:opacity-50"
            title="Mark as completed"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}

        {canEvaluate && (
          <button
            onClick={handleEvaluate}
            className="px-3 py-1 text-sm bg-yellow-600/20 text-yellow-300 rounded-lg hover:bg-yellow-600/30 transition-colors"
          >
            Evaluate
          </button>
        )}

        <button
          onClick={handleEdit}
          className="p-2 text-white/40 hover:text-blue-400 transition-colors"
          title="Edit trial"
        >
          <Edit className="w-4 h-4" />
        </button>

        <button
          onClick={handleDelete}
          className="p-2 text-red-400/70 hover:text-red-400 transition-colors"
          title="Delete trial"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Request Connection */}
      {trial.request && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" title={`Connected to request: ${trial.request.title}`} />
        </div>
      )}
    </div>
  )
}