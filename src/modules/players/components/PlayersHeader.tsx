'use client'

import { Search, Filter, Users, Grid, List } from 'lucide-react'
import { PlayerFilters } from '../types/player'
import { Player } from '../types/player'
import { POSITION_MAPPINGS } from '@/lib/positions'

interface PlayersHeaderProps {
  filters: PlayerFilters
  onFiltersChange: (filters: PlayerFilters) => void
  totalPlayers: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onAddPlayer: () => void
  players: Player[]
}

export function PlayersHeader({
  filters,
  onFiltersChange,
  totalPlayers,
  viewMode,
  onViewModeChange,
  onAddPlayer,
  players
}: PlayersHeaderProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }

  const handleFilterChange = (key: keyof PlayerFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof PlayerFilters]
    // Exclude undefined, empty strings, and zero values
    return value !== undefined && value !== '' && value !== 0
  }).length

  // Get unique nationalities from existing players only
  const getUsedNationalities = (players: Player[]): string[] => {
    const nationalities = new Set<string>()
    players.forEach(player => {
      if (player.nationality && player.nationality.trim()) {
        nationalities.add(player.nationality.trim())
      }
    })
    return Array.from(nationalities).sort()
  }

  const usedNationalities = getUsedNationalities(players)

  return (
    <div className="relative z-40 bg-gradient-to-r from-[#020617]/60 via-[#0c1532]/50 via-[#1e3a8a]/40 to-[#0f1b3e]/60 border-b border-[#3B82F6]/40 backdrop-blur-xl">
      <div className="p-4 sm:p-6">
        {/* Stats and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{totalPlayers} players</span>
            </div>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 text-blue-400">
                <Filter className="w-4 h-4" />
                <span>{activeFiltersCount} filters active</span>
              </div>
            )}
          </div>

        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4">
          {/* Search Field with Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            {/* Search Field */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search players by name, club, position, or 'free agent'..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="
                  w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 text-base
                  bg-white/5 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-white placeholder-white/50
                  focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                  hover:border-white/30
                  transition-all duration-200
                "
              />
            </div>

            {/* Actions moved here */}
            <div className="flex items-center gap-3">
              {/* Add Player Button */}
              <button
                onClick={onAddPlayer}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Add Player</span>
                <span className="sm:hidden">Add</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
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
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Position Filter */}
            <div className="relative flex-1 min-w-[140px] sm:flex-none">
              <select
                value={filters.position || ''}
                onChange={(e) => handleFilterChange('position', e.target.value || undefined)}
                className="
                  px-3 sm:px-4 py-3 pr-8 sm:pr-10 text-sm sm:text-sm
                  bg-white/5 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                  hover:border-white/30
                  transition-all duration-200 cursor-pointer
                  appearance-none w-full
                "
              >
                <option value="" className="bg-slate-800 text-white">All Positions</option>
                {Object.entries(POSITION_MAPPINGS).map(([abbr, full]) => (
                  <option key={abbr} value={abbr} className="bg-slate-800 text-white">
                    {abbr} - {full}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Age Filter */}
            <div className="flex gap-2 flex-1 sm:flex-none">
              <input
                type="number"
                placeholder="Min (14)"
                min="14"
                max="40"
                value={filters.ageMin || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined
                  handleFilterChange('ageMin', value)
                }}
                onBlur={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined
                  if (value !== undefined && (value < 14 || value > 40)) {
                    // Reset to closest valid value
                    const correctedValue = value < 14 ? 14 : 40
                    handleFilterChange('ageMin', correctedValue)
                  }
                }}
                className="
                  w-20 sm:w-24 px-2 sm:px-3 py-3 text-sm
                  bg-white/5 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-white placeholder-white/50
                  focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                  hover:border-white/30
                  transition-all duration-200
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
              <input
                type="number"
                placeholder="Max (40)"
                min="14"
                max="40"
                value={filters.ageMax || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined
                  handleFilterChange('ageMax', value)
                }}
                onBlur={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined
                  if (value !== undefined && (value < 14 || value > 40)) {
                    // Reset to closest valid value
                    const correctedValue = value < 14 ? 14 : 40
                    handleFilterChange('ageMax', correctedValue)
                  }
                }}
                className="
                  w-20 sm:w-24 px-2 sm:px-3 py-3 text-sm
                  bg-white/5 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-white placeholder-white/50
                  focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                  hover:border-white/30
                  transition-all duration-200
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>

            {/* Nationality Filter */}
            <div className="relative flex-1 min-w-[160px] sm:flex-none">
              <select
                value={filters.nationality || ''}
                onChange={(e) => handleFilterChange('nationality', e.target.value || undefined)}
                className="
                  px-3 sm:px-4 py-3 pr-8 sm:pr-10 text-sm sm:text-sm
                  bg-white/5 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                  hover:border-white/30
                  transition-all duration-200 cursor-pointer
                  appearance-none w-full
                "
              >
                <option value="" className="bg-slate-800 text-white">All Nationalities</option>
                {usedNationalities.map(nationality => (
                  <option key={nationality} value={nationality} className="bg-slate-800 text-white">
                    {nationality}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Contract Status Filter */}
            <div className="relative flex-1 min-w-[160px] sm:flex-none">
              <select
                value={filters.contractStatus || 'all'}
                onChange={(e) => handleFilterChange('contractStatus', e.target.value === 'all' ? undefined : e.target.value)}
                className="
                  px-3 sm:px-4 py-3 pr-8 sm:pr-10 text-sm sm:text-sm
                  bg-white/5 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                  hover:border-white/30
                  transition-all duration-200 cursor-pointer
                  appearance-none w-full
                "
              >
                <option value="all" className="bg-slate-800 text-white">All Contract Status</option>
                <option value="expiring" className="bg-slate-800 text-white">⚠️ Expiring Soon</option>
                <option value="active" className="bg-slate-800 text-white">✅ Active Contract</option>
                <option value="free_agent" className="bg-slate-800 text-white">🟡 Free Agent</option>
                <option value="mandate" className="bg-slate-800 text-white">📄 Has Mandate</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="
                  px-3 sm:px-4 py-3 whitespace-nowrap
                  bg-white/10 backdrop-blur-sm
                  border border-white/20 text-white text-sm rounded-lg
                  hover:bg-white/15 hover:border-white/30
                  transition-all duration-200 cursor-pointer touch-none
                "
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
            {filters.search && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                Search: &quot;{filters.search}&quot;
                <button
                  onClick={() => handleFilterChange('search', undefined)}
                  className="text-blue-400/70 hover:text-blue-400 transition-colors duration-200 touch-none"
                >
                  ×
                </button>
              </span>
            )}
            {filters.position && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                Position: {filters.position}
                <button
                  onClick={() => handleFilterChange('position', undefined)}
                  className="text-blue-400/70 hover:text-blue-400 transition-colors duration-200 touch-none"
                >
                  ×
                </button>
              </span>
            )}
            {filters.nationality && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                Nationality: {filters.nationality}
                <button
                  onClick={() => handleFilterChange('nationality', undefined)}
                  className="text-blue-400/70 hover:text-blue-400 transition-colors duration-200 touch-none"
                >
                  ×
                </button>
              </span>
            )}
            {((filters.ageMin && filters.ageMin > 0) || (filters.ageMax && filters.ageMax > 0)) && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                Age: {filters.ageMin && filters.ageMin > 0 ? filters.ageMin : '14'}-{filters.ageMax && filters.ageMax > 0 ? filters.ageMax : '40'}
                <button
                  onClick={() => {
                    handleFilterChange('ageMin', undefined)
                    handleFilterChange('ageMax', undefined)
                  }}
                  className="text-blue-400/70 hover:text-blue-400 transition-colors duration-200 touch-none"
                >
                  ×
                </button>
              </span>
            )}
            {filters.contractStatus && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                Contract: {
                  filters.contractStatus === 'expiring' ? '⚠️ Expiring Soon' :
                  filters.contractStatus === 'active' ? '✅ Active' :
                  filters.contractStatus === 'free_agent' ? '🟡 Free Agent' :
                  filters.contractStatus === 'mandate' ? '📄 Has Mandate' : ''
                }
                <button
                  onClick={() => handleFilterChange('contractStatus', undefined)}
                  className="text-blue-400/70 hover:text-blue-400 transition-colors duration-200 touch-none"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}