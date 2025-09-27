'use client'

import { useState } from 'react'
import { Calendar, MapPin, User, Edit, Trash2, CheckCircle } from 'lucide-react'
import { Trial } from '../types/trial'
import { TrialStatusBadge } from './TrialStatusBadge'
import { useAvatarUrl } from '../../players/hooks/useAvatarUrl'
// import { getPlayerInitials } from '@/lib/formatters' // Removed - no longer using initials
import { getFullPositionName } from '@/lib/positions'
import { useUpdateTrialStatus } from '../hooks/useTrialMutations'

interface TrialListItemProps {
  trial: Trial
  onEdit: (trial: Trial) => void
  onDelete: (trial: Trial) => void
  onClick: (trial: Trial) => void
}

export function TrialListItem({ trial, onEdit, onDelete, onClick }: TrialListItemProps) {
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

  const trialDate = new Date(trial.scheduledAt)
  const isUpcoming = trialDate > new Date()

  // Get player avatar URL
  const { url: avatarUrl, isLoading: avatarLoading } = useAvatarUrl({
    avatarPath: trial.player?.avatarPath || undefined,
    avatarUrl: trial.player?.avatarUrl || undefined,
    tenantId: trial.tenantId,
    playerName: trial.player ? `${trial.player.firstName} ${trial.player.lastName}` : undefined
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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

  const renderAvatar = () => {
    if (avatarUrl && !imageError && !avatarLoading) {
      return (
        <img
          src={avatarUrl}
          alt={`Profile photo of ${trial.player?.firstName} ${trial.player?.lastName}`}
          className="w-12 h-12 rounded-lg object-cover border-2 border-white/20"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            if (!target.dataset.retried) {
              target.dataset.retried = 'true'
              const url = new URL(target.src)
              url.searchParams.set('t', Date.now().toString())
              target.src = url.toString()
              return
            }
            console.warn(`Failed to load player image: ${target.src}`)
            setImageError(true)
          }}
          onLoad={(e) => {
            setImageError(false)
            const target = e.target as HTMLImageElement
            delete target.dataset.retried
          }}
        />
      )
    }

    // Fallback to User icon only
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-lg flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
      </div>
    )
  }

  return (
    <div
      onClick={() => onClick(trial)}
      className="cursor-pointer transition-colors duration-200 hover:bg-white/5 min-h-[80px]"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 items-center">
        <div className="col-span-2 flex items-center gap-3">
          {renderAvatar()}
          <div>
            <p className="font-medium text-white/90">{playerName}</p>
            <p className="text-xs text-blue-300 font-medium">{trialTitle}</p>
            <p className="text-xs text-white/60">{playerPosition}</p>
          </div>
        </div>
        <div className="col-span-2 flex items-center">
          <span className={`text-sm ${
            isUpcoming ? 'text-blue-400 font-medium' : 'text-white/90'
          }`}>
            {formatDate(trialDate)}
          </span>
        </div>
        <div className="col-span-2 flex items-center">
          <span className="text-sm text-white/90 truncate">{trial.location || 'N/A'}</span>
        </div>
        <div className="col-span-2 flex items-center">
          <TrialStatusBadge status={trial.status} size="sm" />
        </div>
        <div className="col-span-2 flex items-center">
          <span className="text-sm text-white/90 truncate">{trial.player?.club || 'Free Agent'}</span>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          {/* Mark as Completed button - only show for non-completed trials */}
          {trial.status !== 'COMPLETED' && trial.status !== 'CANCELLED' && (
            <button
              onClick={handleMarkCompleted}
              disabled={updateTrialStatus.isPending}
              className="p-1 text-green-400/70 hover:text-green-400 transition-colors disabled:opacity-50"
              title="Mark as completed"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(trial)
            }}
            className="p-1 text-white/40 hover:text-blue-400 transition-colors"
            title="Edit trial"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(trial)
            }}
            className="p-1 text-red-400/70 hover:text-red-400 transition-colors"
            title="Delete trial"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {renderAvatar()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-white/90 truncate">{playerName}</p>
                <p className="text-sm text-blue-300 font-medium truncate">{trialTitle}</p>
                <p className="text-sm text-white/60">{playerPosition}</p>
              </div>
              <TrialStatusBadge status={trial.status} size="sm" />
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-white/70">
                <Calendar className="w-3 h-3 inline mr-1" />
                {formatDate(trialDate)}
              </p>
              {trial.location && (
                <p className="text-sm text-white/70">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {trial.location}
                </p>
              )}
              {trial.player?.club && (
                <p className="text-sm text-white/70">
                  <User className="w-3 h-3 inline mr-1" />
                  {trial.player.club}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}