'use client'

import { useState } from 'react'
import { Building2, Target, Calendar, Clock, AlertTriangle, MoreVertical, MapPin, ChevronDown, ChevronRight, Euro, Edit, Trash2 } from 'lucide-react'
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
  dealType?: string
  // Transfer fees (in EUR)
  transferFeeMinEUR?: number
  transferFeeMaxEUR?: number
  // Loan salary (in EUR)
  loanSalaryEUR?: number
  // Free Agent details (in EUR)
  freeAgentSalaryEUR?: number
  signOnBonusEUR?: number
}

interface CompactListViewProps {
  requests: Request[]
  onRequestSelect: (requestId: string) => void
  selectedRequests: Set<string>
  onEdit?: (request: Request) => void
  onDelete?: (request: Request) => void
  className?: string
}

export function CompactListView({
  requests,
  onRequestSelect,
  selectedRequests,
  onEdit,
  onDelete,
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
      case 'open': return 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
      case 'offer_sent': return 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
      case 'agreement': return 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
      case 'completed': return 'bg-green-500/20 text-green-300 border border-green-400/30'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Urgent'
      case 'HIGH': return 'High'
      case 'MEDIUM': return 'Medium'
      case 'LOW': return 'Low'
      default: return priority
    }
  }

  // Format EUR amount in compact form (e.g., 2.5M, 50K)
  const formatEURCompact = (amount: number | undefined): string => {
    if (!amount || amount === 0) return ''

    if (amount >= 1000000) {
      const millions = amount / 1000000
      return `${millions.toFixed(1)}M €`
    } else if (amount >= 1000) {
      const thousands = amount / 1000
      return `${thousands.toFixed(0)}K €`
    }
    return `${amount.toFixed(0)} €`
  }

  // Get budget/salary info for request card with Deal Type
  const getBudgetInfo = (request: Request): string[] => {
    const dealTypes = request.dealType?.split(',') || []
    const results: string[] = []

    if (dealTypes.includes('TRANSFER')) {
      if (request.transferFeeMinEUR && request.transferFeeMaxEUR) {
        results.push(`Transfer → ${formatEURCompact(request.transferFeeMinEUR)} - ${formatEURCompact(request.transferFeeMaxEUR)}`)
      } else {
        results.push('Transfer')
      }
    }

    if (dealTypes.includes('LOAN')) {
      if (request.loanSalaryEUR) {
        results.push(`Loan → ${formatEURCompact(request.loanSalaryEUR)}/wk`)
      } else {
        results.push('Loan')
      }
    }

    if (dealTypes.includes('FREE_AGENT')) {
      if (request.freeAgentSalaryEUR) {
        results.push(`Free Agent → ${formatEURCompact(request.freeAgentSalaryEUR)}/wk`)
      } else {
        results.push('Free Agent')
      }
    }

    return results
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

  // Render individual request card - Mobile Optimized
  const renderRequestCard = (request: Request) => (
    <div
      key={request.id}
      className={`bg-gradient-to-r from-white/5 via-white/3 to-white/5 backdrop-blur-sm border rounded-lg transition-all duration-200 cursor-pointer border-l-4 group ${
        getPriorityColor(request.priority)
      } ${
        selectedRequests.has(request.id)
          ? 'ring-2 ring-blue-400/70 border-blue-400/50 shadow-lg shadow-blue-500/30 bg-blue-500/20'
          : 'border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
      onClick={() => onRequestSelect(request.id)}
    >
      <div className="p-3">
        {/* Mobile: Stack vertically, Desktop: Horizontal */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Top Row: Checkbox + Title + Action Buttons (Mobile & Desktop) */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            <div className="flex-shrink-0 mt-0.5">
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

            {/* Title & Info Column */}
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <h3 className="font-semibold text-white text-sm group-hover:text-blue-200 transition-colors">
                  {request.title}
                </h3>
              </div>

              {/* Budget Info */}
              {getBudgetInfo(request).length > 0 && (
                <div className="mb-2 space-y-0.5">
                  {getBudgetInfo(request).map((budgetLine, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs text-green-400/80">
                      <Euro className="w-3 h-3" />
                      <span className="font-medium">{budgetLine}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Compact Info Row - Wrap on mobile */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{request.club}</span>
                </div>

                {request.position && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 flex-shrink-0" />
                    <span>{request.position}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDate(request.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Status, Priority, Window Badge + Action Buttons (Mobile: Wrap, Desktop: Inline) */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:flex-shrink-0 pl-7 md:pl-0">
            {/* Status */}
            <span className={`text-xs px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap ${getStatusColor(request.status)}`}>
              {getStatusLabel(request.status)}
            </span>

            {/* Priority */}
            <div className="flex items-center gap-1">
              {request.priority === 'URGENT' && (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap ${
                request.priority === 'URGENT' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                request.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' :
                request.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                'bg-gray-500/20 text-gray-300 border border-gray-400/30'
              }`}>
                {getPriorityLabel(request.priority)}
              </span>
            </div>

            {/* Window Badge */}
            {(request.windowOpenAt || request.windowCloseAt) && (
              <WindowBadge
                windowOpenAt={request.windowOpenAt}
                windowCloseAt={request.windowCloseAt}
                graceDays={request.graceDays}
                size="sm"
              />
            )}

            {/* Action Buttons - Show on hover (desktop) or always (mobile) */}
            <div className="flex items-center gap-1 ml-auto md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(request)
                  }}
                  className="p-1.5 md:p-2 text-white/40 hover:text-blue-400 transition-colors"
                  title="Edit request"
                >
                  <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(request)
                  }}
                  className="p-1.5 md:p-2 text-red-400/70 hover:text-red-400 transition-colors"
                  title="Delete request"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              )}
            </div>
          </div>
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
            {/* Country Header - Mobile Optimized */}
            <button
              onClick={() => toggleCountry(country)}
              className="w-full flex items-center justify-between px-2 md:px-3 py-1.5 bg-white/[0.12] backdrop-blur-sm border border-white/20 rounded hover:bg-white/[0.16] transition-all duration-200 group"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                )}
                <h3 className="font-medium text-xs md:text-sm text-white/80 group-hover:text-white transition-colors">
                  {country}
                </h3>
                {country === 'Unknown' && (
                  <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded whitespace-nowrap">
                    ⚠️ Unknown
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 whitespace-nowrap">
                  {countryRequests.length} request{countryRequests.length !== 1 ? 's' : ''}
                </span>
              </div>
            </button>

            {/* Country Requests - Mobile: Less indent, Desktop: More indent */}
            {isExpanded && (
              <div className="ml-3 md:ml-6 space-y-2">
                {countryRequests.map(renderRequestCard)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}