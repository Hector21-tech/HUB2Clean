'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, User, Star, Clock, Target, ExternalLink, Edit3, Trash2 } from 'lucide-react'
import { CalendarEvent, EVENT_TYPE_CONFIG } from '../types/calendar'
import { TrialStatusBadge } from '../../trials/components/TrialStatusBadge'
import { useAvatarUrl } from '../../players/hooks/useAvatarUrl'
// import { getPlayerInitials } from '@/lib/formatters' // Removed - no longer using initials

interface EventDetailModalProps {
  event: CalendarEvent
  onClose: () => void
  onNavigateToTrial?: (trialId: string) => void
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (event: CalendarEvent) => void
}

export function EventDetailModal({
  event,
  onClose,
  onNavigateToTrial,
  onEdit,
  onDelete
}: EventDetailModalProps) {
  const [imageError, setImageError] = useState(false)
  const isTrialEvent = event.type === 'TRIAL' && event.trial
  const eventConfig = EVENT_TYPE_CONFIG[event.type]

  // Get player avatar URL if this is a trial event
  const { url: avatarUrl, isLoading: avatarLoading } = useAvatarUrl({
    avatarPath: event.trial?.player?.avatarPath || undefined,
    avatarUrl: event.trial?.player?.avatarUrl || undefined,
    tenantId: event.trial?.id || '' // This will be empty for non-trial events
  })

  const formatDateTime = (dateTime: string) => {
    return new Intl.DateTimeFormat('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateTime))
  }

  const handleNavigateToTrial = () => {
    if (event.trial && onNavigateToTrial) {
      onNavigateToTrial(event.trial.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 flex items-center gap-3">
            <div className={`p-2 ${eventConfig.bgColor} rounded-lg border ${eventConfig.borderColor}`}>
              <span className="text-xl">{eventConfig.icon}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{eventConfig.label}</h2>
              <p className="text-blue-200">Event Details</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">{event.title}</h3>

            <div className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-white/40 mt-0.5" />
                <div>
                  <p className="text-sm text-white/60">Date & Time</p>
                  <p className="text-white font-medium">{formatDateTime(event.startTime)}</p>
                  {!event.isAllDay && (
                    <p className="text-sm text-white/60">
                      to {formatDateTime(event.endTime)}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-white/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/60">Location</p>
                    <p className="text-white font-medium">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-white/40 mt-0.5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Description</p>
                    <p className="text-white">{event.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trial Context */}
          {isTrialEvent && event.trial && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Trial Information</h4>
                <TrialStatusBadge status={event.trial.status as any} size="sm" />
              </div>

              {/* Player Info */}
              {event.trial.player && (
                <div className="flex items-center gap-4 mb-4">
                  {/* Player Avatar */}
                  {avatarUrl && !imageError && !avatarLoading ? (
                    <img
                      src={avatarUrl}
                      alt={`Profile photo of ${event.trial.player.firstName} ${event.trial.player.lastName}`}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
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
                        setImageError(true)
                      }}
                      onLoad={(e) => {
                        setImageError(false)
                        const target = e.target as HTMLImageElement
                        delete target.dataset.retried
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h5 className="text-lg font-bold text-white">
                      {event.trial.player.firstName} {event.trial.player.lastName}
                    </h5>
                    <p className="text-white/70">{event.trial.player.position}</p>
                    {event.trial.player.club && (
                      <p className="text-sm text-white/60">{event.trial.player.club}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Request Info */}
              {event.trial.request && (
                <div className="flex items-start gap-3 mb-4">
                  <Target className="w-5 h-5 text-white/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/60">Connected Request</p>
                    <p className="text-white font-medium">{event.trial.request.title}</p>
                    <p className="text-sm text-white/60">
                      {event.trial.request.club} • {event.trial.request.position}
                    </p>
                  </div>
                </div>
              )}

              {/* Trial Rating */}
              {event.trial.rating && (
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <div>
                    <p className="text-sm text-white/60">Trial Rating</p>
                    <p className="text-xl font-bold text-white">{event.trial.rating}/10</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isTrialEvent && event.trial && onNavigateToTrial && (
              <button
                onClick={handleNavigateToTrial}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Trial Details
              </button>
            )}

            {/* Edit and Delete buttons - only for manual events (not trials) */}
            {!isTrialEvent && onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors font-medium"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}

            {!isTrialEvent && onDelete && (
              <button
                onClick={() => onDelete(event)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}