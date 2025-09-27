'use client'

import { useState } from 'react'
import { Building2, Target, Calendar, Clock, AlertTriangle, MoreVertical, MapPin, ChevronDown, ChevronRight } from 'lucide-react'
import { WindowBadge } from './WindowBadge'
import { getCountryByClub } from '@/lib/club-country-mapping'

interface Request {
  id: string
  title: string
  description: string
  club: string
  country?: string
  league?: string
  position: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  windowOpenAt?: string | null
  windowCloseAt?: string | null
  deadline?: string | null
  graceDays?: number
}

interface CompactListViewProps {
  requests: Request[]
  onRequestSelect: (requestId: string) => void
  selectedRequests: Set<string>
  className?: string
}

export function CompactListView({
  requests,
  onRequestSelect,
  selectedRequests,
  className = ''
}: CompactListViewProps) {
  // Group requests by country first to determine which countries to show
  const groupedRequests = requests.reduce((groups, request) => {
    const country = getCountryByClub(request.club) || 'Unknown'
    if (!groups[country]) {
      groups[country] = []
    }
    groups[country].push(request)
    return groups
  }, {} as Record<string, Request[]>)

  // Only show countries that have requests - automatically expand all countries with requests
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(Object.keys(groupedRequests))
  )
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'border-l-red-500/60 bg-red-500/5'
      case 'high': return 'border-l-orange-500/60 bg-orange-500/5'
      case 'medium': return 'border-l-blue-500/60 bg-blue-500/5'
      case 'low': return 'border-l-gray-500/60 bg-gray-500/5'
      default: return 'border-l-gray-500/60 bg-gray-500/5'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'offer_sent': return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      case 'agreement': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'New'
      case 'IN_PROGRESS': return 'In Progress'
      case 'OFFER_SENT': return 'Offer Sent'
      case 'AGREEMENT': return 'Agreement'
      case 'COMPLETED': return 'Won'
      case 'CANCELLED': return 'Lost'
      default: return status
    }
  }

  // Country flag mapping
  const getCountryFlag = (country: string): string => {
    const flags: Record<string, string> = {
      'Sweden': '🇸🇪',
      'Denmark': '🇩🇰',
      'Norway': '🇳🇴',
      'Finland': '🇫🇮',
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Spain': '🇪🇸',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Saudi Arabia': '🇸🇦',
      'UAE': '🇦🇪',
      'Turkey': '🇹🇷',
      'Egypt': '🇪🇬',
      'Morocco': '🇲🇦',
      'South Africa': '🇿🇦'
    }
    return flags[country] || '🌍'
  }


  // Sort countries alphabetically, but put Unknown last
  const sortedCountries = Object.keys(groupedRequests).sort((a, b) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return a.localeCompare(b)
  })

  // Toggle country expansion
  const toggleCountry = (country: string) => {
    const newExpanded = new Set(expandedCountries)
    if (newExpanded.has(country)) {
      newExpanded.delete(country)
    } else {
      newExpanded.add(country)
    }
    setExpandedCountries(newExpanded)
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/60">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Target className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium mb-2">No requests found</p>
          <p className="text-sm text-white/40">
            No requests match your current filters
          </p>
        </div>
      </div>
    )
  }

  // Render individual request card
  const renderRequestCard = (request: Request) => (
    <div
      key={request.id}
      className={`bg-gradient-to-r from-white/5 via-white/3 to-white/5 backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-200 cursor-pointer border-l-4 group ${
        getPriorityColor(request.priority)
      } ${
        selectedRequests.has(request.id)
          ? 'ring-2 ring-blue-400/50 shadow-blue-500/20 shadow-lg bg-blue-500/10'
          : 'hover:bg-white/10 hover:border-white/20'
      }`}
      onClick={() => onRequestSelect(request.id)}
    >
      <div className="p-4">
        {/* Main Content Row */}
        <div className="flex items-center gap-4">
          {/* Checkbox */}
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={selectedRequests.has(request.id)}
              onChange={(e) => {
                e.stopPropagation()
                onRequestSelect(request.id)
              }}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
          </div>

          {/* Title and Window Badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-white text-sm truncate group-hover:text-blue-200 transition-colors">
                {request.title}
              </h3>
              {(request.windowOpenAt || request.windowCloseAt) && (
                <WindowBadge
                  windowOpenAt={request.windowOpenAt}
                  windowCloseAt={request.windowCloseAt}
                  graceDays={request.graceDays}
                  size="sm"
                />
              )}
            </div>

            {/* Compact Info Row */}
            <div className="flex items-center gap-4 text-xs text-white/60">
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span className="truncate max-w-32">{request.club}</span>
              </div>

              {request.position && (
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>{request.position}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(request.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-1 rounded border backdrop-blur-sm ${getStatusColor(request.status)}`}>
              {getStatusLabel(request.status)}
            </span>

            <div className="flex items-center gap-1">
              {request.priority === 'URGENT' && (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs px-2 py-1 rounded backdrop-blur-sm ${
                request.priority === 'URGENT' ? 'bg-red-500/20 text-red-300' :
                request.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                request.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {request.priority}
              </span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-1 text-xs text-white/40 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{formatDate(request.updatedAt)}</span>
          </div>

          {/* More Actions */}
          <button
            className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedCountries.map((country) => {
        const countryRequests = groupedRequests[country]
        const isExpanded = expandedCountries.has(country)

        return (
          <div key={country} className="space-y-2">
            {/* Country Header */}
            <button
              onClick={() => toggleCountry(country)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  )}
                  <span className="text-lg">{getCountryFlag(country)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                    {country}
                  </h3>
                  {country === 'Unknown' && (
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded">
                      ⚠️ Unknown
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">
                  {countryRequests.length} request{countryRequests.length !== 1 ? 's' : ''}
                </span>
              </div>
            </button>

            {/* Country Requests */}
            {isExpanded && (
              <div className="ml-6 space-y-2">
                {countryRequests.map(renderRequestCard)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}