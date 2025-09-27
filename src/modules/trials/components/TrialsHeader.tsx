'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Calendar, Users, TrendingUp, Grid, List } from 'lucide-react'
import { TrialFilters, TrialStatus } from '../types/trial'

interface TrialsHeaderProps {
  onAddTrial: () => void
  onFiltersChange: (filters: TrialFilters) => void
  trialsCount: number
  upcomingCount: number
  completedCount: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

const statusOptions: { value: TrialStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' }
]

export function TrialsHeader({
  onAddTrial,
  onFiltersChange,
  trialsCount,
  upcomingCount,
  completedCount,
  viewMode,
  onViewModeChange
}: TrialsHeaderProps) {
  const [search, setSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<TrialStatus[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFiltersChange({
      search: value || undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined
    })
  }

  const handleStatusChange = (status: TrialStatus, checked: boolean) => {
    let newStatuses: TrialStatus[]

    if (checked) {
      newStatuses = [...selectedStatuses, status]
    } else {
      newStatuses = selectedStatuses.filter(s => s !== status)
    }

    setSelectedStatuses(newStatuses)
    onFiltersChange({
      search: search || undefined,
      status: newStatuses.length > 0 ? newStatuses : undefined
    })
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedStatuses([])
    onFiltersChange({})
  }

  const hasActiveFilters = search.length > 0 || selectedStatuses.length > 0

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Trials</h1>
          <p className="text-white/70 mt-1">
            Manage player trials and evaluations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onAddTrial}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Schedule Trial
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Total Trials</p>
              <p className="text-xl font-bold text-white">{trialsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Upcoming</p>
              <p className="text-xl font-bold text-white">{upcomingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Completed</p>
              <p className="text-xl font-bold text-white">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search trials, players, locations..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 outline-none transition-all duration-200"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors
              ${hasActiveFilters
                ? 'bg-blue-600/20 border-blue-400/30 text-blue-300'
                : 'border-white/20 text-white/60 hover:bg-white/10'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {selectedStatuses.length + (search ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(option.value)}
                        onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                        className="rounded border-white/30 bg-white/10 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-white/70">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}