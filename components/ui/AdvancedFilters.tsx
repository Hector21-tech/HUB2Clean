'use client'

import { useState } from 'react'
import { Filter, X, Calendar, MapPin, Building2, Target } from 'lucide-react'

interface FilterState {
  search: string
  status: string[]
  priority: string[]
  positions: string[]
  clubs: string[]
  countries: string[]
  dateRange: {
    from: string
    to: string
  }
  windowStatus: string[]
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClose: () => void
  availableClubs?: string[]
  availableCountries?: string[]
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open', color: 'bg-blue-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-500' },
  { value: 'EXPIRED', label: 'Expired', color: 'bg-red-500' }
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-500' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-500' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-500' }
]

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
  { value: 'OPEN', label: '🟢 Open', description: 'Transfer window is open' },
  { value: 'CLOSES_SOON', label: '🟡 Closing Soon', description: 'Window closing within days' },
  { value: 'GRACE_PERIOD', label: '⚠️ Grace Period', description: 'Limited time after close' },
  { value: 'OPENS_SOON', label: '🔵 Opens Soon', description: 'Future window opening' },
  { value: 'EXPIRED', label: '⚫ Expired', description: 'Window closed' },
  { value: 'NO_WINDOW', label: '➖ No Window', description: 'Free agents' }
]

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClose,
  availableClubs = [],
  availableCountries = []
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const toggleArrayFilter = (key: 'status' | 'priority' | 'positions' | 'clubs' | 'countries' | 'windowStatus', value: string) => {
    const currentArray = localFilters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const clearAllFilters = () => {
    const emptyFilters: FilterState = {
      search: '',
      status: [],
      priority: [],
      positions: [],
      clubs: [],
      countries: [],
      dateRange: { from: '', to: '' },
      windowStatus: []
    }
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = () => {
    return localFilters.search ||
           localFilters.status.length > 0 ||
           localFilters.priority.length > 0 ||
           localFilters.positions.length > 0 ||
           localFilters.clubs.length > 0 ||
           localFilters.countries.length > 0 ||
           localFilters.windowStatus.length > 0 ||
           localFilters.dateRange.from ||
           localFilters.dateRange.to
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] rounded-xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Advanced Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Note: Search moved to main header */}
          <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-3 mb-4">
            <p className="text-blue-200 text-sm">
              💡 Search functionality is now available in the main header above
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Status</label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={localFilters.status.includes(option.value)}
                      onChange={() => toggleArrayFilter('status', option.value)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600"
                    />
                    <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                    <span className="text-white/80">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Priority</label>
              <div className="space-y-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={localFilters.priority.includes(option.value)}
                      onChange={() => toggleArrayFilter('priority', option.value)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600"
                    />
                    <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                    <span className="text-white/80">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                <Target className="w-4 h-4 inline mr-2" />
                Positions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITION_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={localFilters.positions.includes(option.value)}
                      onChange={() => toggleArrayFilter('positions', option.value)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600"
                    />
                    <span className="text-white/80 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Window Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Transfer Window Status
              </label>
              <div className="space-y-2">
                {WINDOW_STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={localFilters.windowStatus.includes(option.value)}
                      onChange={() => toggleArrayFilter('windowStatus', option.value)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-white/80 text-sm">{option.label}</div>
                      <div className="text-white/50 text-xs">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1">From</label>
                <input
                  type="date"
                  value={localFilters.dateRange.from}
                  onChange={(e) => updateFilter('dateRange', { ...localFilters.dateRange, from: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">To</label>
                <input
                  type="date"
                  value={localFilters.dateRange.to}
                  onChange={(e) => updateFilter('dateRange', { ...localFilters.dateRange, to: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}