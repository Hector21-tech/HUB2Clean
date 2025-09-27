'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, User, Star, Clock, Edit, Trash2, Target } from 'lucide-react'
import { Trial } from '../types/trial'
import { TrialStatusBadge } from './TrialStatusBadge'
import { useAvatarUrl } from '../../players/hooks/useAvatarUrl'
// import { getPlayerInitials } from '@/lib/formatters' // Removed - no longer using initials

interface TrialDetailDrawerProps {
  trial: Trial | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (trial: Trial) => void
  onDelete?: (trial: Trial) => void
  onEvaluate?: (trial: Trial) => void
}

export function TrialDetailDrawer({
  trial,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onEvaluate
}: TrialDetailDrawerProps) {
  if (!trial) return null

  const [imageError, setImageError] = useState(false)

  const playerName = trial.player
    ? `${trial.player.firstName} ${trial.player.lastName}`
    : 'Unknown Player'

  const playerPositions = trial.player?.position || ''

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-2xl bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510]
          shadow-2xl border-l border-white/20 z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6">
            <h2 className="text-2xl font-bold text-white">Trial Details</h2>
            <p className="text-blue-200">View trial information and evaluation</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Player Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center gap-4">
              {/* Player Avatar */}
              {avatarUrl && !imageError && !avatarLoading ? (
                <img
                  src={avatarUrl}
                  alt={`Profile photo of ${trial.player?.firstName} ${trial.player?.lastName}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
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
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{playerName}</h3>
                <p className="text-white/70">{playerPositions}</p>
                {trial.player?.club && (
                  <p className="text-sm text-white/60">{trial.player.club}</p>
                )}
              </div>

              <TrialStatusBadge status={trial.status} size="lg" />
            </div>
          </div>

          {/* Trial Information */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Trial Information</h4>

            <div className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-white/40 mt-0.5" />
                <div>
                  <p className="text-sm text-white/60">Date & Time</p>
                  <p className={`font-medium ${
                    isUpcoming ? 'text-blue-400' : isPast ? 'text-white' : 'text-white'
                  }`}>
                    {formatDate(trialDate)}
                  </p>
                  {isUpcoming && (
                    <span className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded-full mt-1 inline-block">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>

              {/* Location */}
              {trial.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-white/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/60">Location</p>
                    <p className="text-white font-medium">{trial.location}</p>
                  </div>
                </div>
              )}

              {/* Connected Request */}
              {trial.request && (
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-white/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/60">Connected Request</p>
                    <p className="text-white font-medium">{trial.request.title}</p>
                    <p className="text-sm text-white/60">{trial.request.club} • {trial.request.position}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {trial.notes && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-white/40 mt-0.5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Notes</p>
                    <p className="text-white">{trial.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evaluation Section */}
          {(trial.rating || trial.feedback || canEvaluate) && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Evaluation</h4>

              {trial.rating && (
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <div>
                    <p className="text-sm text-white/60">Rating</p>
                    <p className="text-xl font-bold text-white">{trial.rating}/10</p>
                  </div>
                </div>
              )}

              {trial.feedback && (
                <div className="mb-4">
                  <p className="text-sm text-white/60 mb-2">Feedback</p>
                  <p className="text-white">{trial.feedback}</p>
                </div>
              )}

              {canEvaluate && (
                <div className="bg-yellow-600/20 border border-yellow-400/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-200">Evaluation Required</p>
                      <p className="text-sm text-yellow-300/80">
                        This trial is completed but hasn't been evaluated yet.
                      </p>
                    </div>
                    <button
                      onClick={() => onEvaluate?.(trial)}
                      className="px-4 py-2 bg-yellow-600/30 text-yellow-200 rounded-lg hover:bg-yellow-600/40 transition-colors text-sm font-medium"
                    >
                      Evaluate Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onEdit?.(trial)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit Trial
            </button>

            <button
              onClick={() => onDelete?.(trial)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete Trial
            </button>
          </div>
        </div>
      </div>
    </>
  )
}