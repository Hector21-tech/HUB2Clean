'use client'

import { Clock, Users, FileText, Calendar, ArrowRight } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { Skeleton } from '@/components/ui/skeleton'

interface RecentActivityFeedProps {
  tenantId: string
}

interface Activity {
  id: string
  type: 'player' | 'request' | 'trial'
  title: string
  subtitle: string
  time: Date
  scheduledTime?: Date
  rating?: number | null
  priority?: string
  icon: any
  color: string
}

export function RecentActivityFeed({ tenantId }: RecentActivityFeedProps) {
  const { data: stats, isLoading } = useDashboardStats(tenantId)

  // Combine and sort all recent activities
  const activities: Activity[] = []

  if (stats) {
    // Recent players
    stats.players.recent.forEach(player => {
      activities.push({
        id: `player-${player.id}`,
        type: 'player',
        title: `${player.firstName} ${player.lastName}`,
        subtitle: `New player added • ${player.position || 'Position not set'} • ${player.club || 'No club'}`,
        time: new Date(player.createdAt),
        rating: player.rating,
        icon: Users,
        color: 'blue'
      })
    })

    // Recent requests
    stats.requests.recent.forEach(request => {
      activities.push({
        id: `request-${request.id}`,
        type: 'request',
        title: request.title,
        subtitle: `Request from ${request.club} • ${request.country || 'Country unknown'} • ${request.status}`,
        time: new Date(request.createdAt),
        priority: request.priority,
        icon: FileText,
        color: 'orange'
      })
    })

    // Recent trials
    stats.trials.recent.forEach(trial => {
      activities.push({
        id: `trial-${trial.id}`,
        type: 'trial',
        title: trial.player ? `${trial.player.firstName} ${trial.player.lastName}` : 'Unknown Player',
        subtitle: `Trial ${trial.status.toLowerCase()} • ${trial.location || 'Location TBD'}`,
        time: new Date(trial.createdAt),
        scheduledTime: new Date(trial.scheduledAt),
        rating: trial.rating,
        icon: Calendar,
        color: 'green'
      })
    })
  }

  // Sort by time (most recent first)
  activities.sort((a, b) => b.time.getTime() - a.time.getTime())

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-400 bg-blue-500/20'
      case 'orange': return 'text-orange-400 bg-orange-500/20'
      case 'green': return 'text-green-400 bg-green-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getPriorityIndicator = (priority?: string) => {
    if (!priority) return null

    const colors = {
      URGENT: 'bg-red-500',
      HIGH: 'bg-orange-500',
      MEDIUM: 'bg-blue-500',
      LOW: 'bg-gray-500'
    }

    return (
      <div className={`w-2 h-2 rounded-full ${colors[priority as keyof typeof colors] || 'bg-gray-500'}`} />
    )
  }

  const getRatingStars = (rating?: number | null) => {
    if (!rating) return null

    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < rating ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <span className="text-sm text-white/60">Last 24 hours</span>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
              </div>
              <Skeleton className="w-16 h-3 bg-white/10" />
            </div>
          ))
        ) : activities.length > 0 ? (
          activities.slice(0, 8).map((activity) => {
            const IconComponent = activity.icon

            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className={`p-2 rounded-lg ${getIconColor(activity.color)}`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">
                      {activity.title}
                    </h4>
                    {getPriorityIndicator(activity.priority)}
                    {getRatingStars(activity.rating)}
                  </div>
                  <p className="text-xs text-white/60 truncate">
                    {activity.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-white/50">
                    {formatRelativeTime(activity.time)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white/40" />
            </div>
            <p className="text-sm text-white/60 mb-2">No recent activity</p>
            <p className="text-xs text-white/40">
              Start adding players, creating requests, or scheduling trials to see activity here
            </p>
          </div>
        )}
      </div>

      {!isLoading && activities.length > 8 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
            View all activity →
          </button>
        </div>
      )}
    </div>
  )
}