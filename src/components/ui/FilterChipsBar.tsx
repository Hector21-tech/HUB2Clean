'use client'

import { useState } from 'react'
import { X, Plus, Search, MapPin, Target, Building2, Calendar, Filter } from 'lucide-react'

export interface FilterChip {
  id: string
  type: 'country' | 'position' | 'club' | 'window' | 'loan' | 'custom'
  label: string
  value: string
  color?: string
}

interface FilterChipsBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  activeChips: FilterChip[]
  onChipAdd: (chip: FilterChip) => void
  onChipRemove: (chipId: string) => void
  onAdvancedFilters?: () => void
  suggestions?: {
    countries: string[]
    positions: string[]
    clubs: string[]
    windowStatuses: string[]
  }
  className?: string
}

const POSITION_OPTIONS = [
  { value: 'GK', label: 'Goalkeeper' },
  { value: 'LB', label: 'Left Back' },
  { value: 'CB', label: 'Centre Back' },
  { value: 'RB', label: 'Right Back' },
  { value: 'CDM', label: 'Defensive Mid' },
  { value: 'CM', label: 'Central Mid' },
  { value: 'CAM', label: 'Attacking Mid' },
  { value: 'LW', label: 'Left Winger' },
  { value: 'RW', label: 'Right Winger' },
  { value: 'ST', label: 'Striker' }
]

const WINDOW_STATUS_OPTIONS = [
  { value: 'open', label: 'Open now', emoji: '🟢' },
  { value: 'closes-soon', label: 'Closing soon', emoji: '🟡' },
  { value: 'grace', label: 'Grace period', emoji: '⚠️' },
  { value: 'opens-soon', label: 'Opens soon', emoji: '🔵' },
  { value: 'expired', label: 'Expired', emoji: '⚫' }
]

const LOAN_TYPE_OPTIONS = [
  { value: 'loan', label: 'Loan', emoji: '🔄' },
  { value: 'permanent', label: 'Permanent', emoji: '💰' },
  { value: 'free', label: 'Free transfer', emoji: '🆓' }
]

export function FilterChipsBar({
  searchTerm,
  onSearchChange,
  activeChips,
  onChipAdd,
  onChipRemove,
  onAdvancedFilters,
  suggestions = { countries: [], positions: [], clubs: [], windowStatuses: [] },
  className = ''
}: FilterChipsBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionType, setSuggestionType] = useState<'position' | 'window' | 'loan' | null>(null)

  const getChipColor = (type: FilterChip['type']) => {
    switch (type) {
      case 'country':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'position':
        return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'club':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      case 'window':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'loan':
        return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getChipIcon = (type: FilterChip['type']) => {
    switch (type) {
      case 'country':
        return <MapPin className="w-3 h-3" />
      case 'position':
        return <Target className="w-3 h-3" />
      case 'club':
        return <Building2 className="w-3 h-3" />
      case 'window':
        return <Calendar className="w-3 h-3" />
      default:
        return null
    }
  }

  const addQuickChip = (type: 'position' | 'window' | 'loan', option: any) => {
    const chip: FilterChip = {
      id: `${type}-${option.value}-${Date.now()}`,
      type: type === 'loan' ? 'custom' : type,
      label: option.label,
      value: option.value
    }
    onChipAdd(chip)
    setShowSuggestions(false)
    setSuggestionType(null)
  }

  const handleSuggestionToggle = (type: 'position' | 'window' | 'loan') => {
    if (suggestionType === type && showSuggestions) {
      setShowSuggestions(false)
      setSuggestionType(null)
    } else {
      setSuggestionType(type)
      setShowSuggestions(true)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Bar with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Main Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Search: title, club, position..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-10 pr-4 py-3 text-base
              bg-white/5 backdrop-blur-sm
              border border-white/20 rounded-lg
              text-white placeholder-white/50
              focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
              hover:border-white/30
              transition-all duration-200
            "
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button
              onClick={() => handleSuggestionToggle('position')}
              className={`px-3 py-2 rounded-lg border backdrop-blur-sm transition-all duration-200 text-sm font-medium ${
                suggestionType === 'position' && showSuggestions
                  ? 'bg-green-500/20 text-green-300 border-green-400/30'
                  : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 inline mr-1" />
              Position
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => handleSuggestionToggle('window')}
              className={`px-3 py-2 rounded-lg border backdrop-blur-sm transition-all duration-200 text-sm font-medium ${
                suggestionType === 'window' && showSuggestions
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                  : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Window
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => handleSuggestionToggle('loan')}
              className={`px-3 py-2 rounded-lg border backdrop-blur-sm transition-all duration-200 text-sm font-medium ${
                suggestionType === 'loan' && showSuggestions
                  ? 'bg-orange-500/20 text-orange-300 border-orange-400/30'
                  : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              🔄 Loan
            </button>
          </div>

          {onAdvancedFilters && (
            <button
              onClick={onAdvancedFilters}
              className="px-3 py-2 rounded-lg border bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all duration-200 text-sm font-medium"
            >
              <Filter className="w-4 h-4 inline mr-1" />
              More
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Suggestions */}
      {showSuggestions && suggestionType && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 p-4">
          <div className="flex flex-wrap gap-2">
            {suggestionType === 'position' && POSITION_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => addQuickChip('position', option)}
                className="px-3 py-1.5 text-sm bg-green-500/10 text-green-300 border border-green-400/30 rounded-lg hover:bg-green-500/20 transition-colors"
              >
                {option.label}
              </button>
            ))}

            {suggestionType === 'window' && WINDOW_STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => addQuickChip('window', option)}
                className="px-3 py-1.5 text-sm bg-yellow-500/10 text-yellow-300 border border-yellow-400/30 rounded-lg hover:bg-yellow-500/20 transition-colors"
              >
                {option.emoji} {option.label}
              </button>
            ))}

            {suggestionType === 'loan' && LOAN_TYPE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => addQuickChip('loan', option)}
                className="px-3 py-1.5 text-sm bg-orange-500/10 text-orange-300 border border-orange-400/30 rounded-lg hover:bg-orange-500/20 transition-colors"
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/60">Filters:</span>
          {activeChips.map(chip => (
            <div
              key={chip.id}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium backdrop-blur-sm ${getChipColor(chip.type)}`}
            >
              {getChipIcon(chip.type)}
              <span>{chip.label}</span>
              <button
                onClick={() => onChipRemove(chip.id)}
                className="p-0.5 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {activeChips.length > 1 && (
            <button
              onClick={() => activeChips.forEach(chip => onChipRemove(chip.id))}
              className="text-xs text-white/50 hover:text-white/80 px-2 py-1 hover:bg-white/10 rounded transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}