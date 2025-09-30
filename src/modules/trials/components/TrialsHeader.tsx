'use client'

import { useState } from 'react'
import { Plus, Search, Calendar, Users, TrendingUp, Grid, List, X } from 'lucide-react'
import { TrialFilters, TrialStatus, Trial } from '../types/trial'

interface TrialsHeaderProps {
  onAddTrial: () => void
  onFiltersChange: (filters: TrialFilters) => void
  trialsCount: number
  upcomingCount: number
  completedCount: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  allTrials: Trial[] // Need all trials to calculate counts per status
}

const statusOptions: { value: TrialStatus | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL', label: 'All', color: 'bg-white/10 text-white' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-blue-600/20 text-blue-300' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-600/20 text-yellow-300' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-600/20 text-green-300' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-600/20 text-red-300' },
  { value: 'NO_SHOW', label: 'No Show', color: 'bg-gray-600/20 text-gray-300' }
]

export function TrialsHeader({
  onAddTrial,
  onFiltersChange,
  trialsCount,
  upcomingCount,
  completedCount,
  viewMode,
  onViewModeChange,
  allTrials
}: TrialsHeaderProps) {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<TrialStatus | 'ALL'>('ALL')

  // Calculate count for each status
  const getStatusCount = (status: TrialStatus | 'ALL'): number => {
    if (status === 'ALL') return allTrials.length
    return allTrials.filter(t => t.status === status).length
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFiltersChange({
      search: value || undefined,
      status: selectedStatus !== 'ALL' ? [selectedStatus as TrialStatus] : undefined
    })
  }

  const handleStatusClick = (status: TrialStatus | 'ALL') => {
    setSelectedStatus(status)
    onFiltersChange({
      search: search || undefined,
      status: status !== 'ALL' ? [status as TrialStatus] : undefined
    })
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedStatus('ALL')
    onFiltersChange({})
  }

  const hasActiveFilters = search.length > 0 || selectedStatus !== 'ALL'

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
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 space-y-4">
        {/* Search Row */}
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

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors border border-white/20 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const count = getStatusCount(option.value)
            const isActive = selectedStatus === option.value

            return (
              <button
                key={option.value}
                onClick={() => handleStatusClick(option.value)}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                  ${isActive
                    ? `${option.color} border-current font-medium shadow-lg`
                    : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span className="text-sm">{option.label}</span>
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isActive ? 'bg-white/20' : 'bg-white/10'}
                `}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}