'use client'

import { useState, useRef, useEffect } from 'react'
import { Building2, Search, ChevronDown, MapPin } from 'lucide-react'
import { getClubsByCountry, searchClubs, type ClubCountryMapping } from '@/lib/club-country-mapping'

interface SmartClubSelectorProps {
  value: string
  onChange: (club: string, country?: string, league?: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
}

export function SmartClubSelector({
  value,
  onChange,
  placeholder = "Select club...",
  required = false,
  error,
  className = ''
}: SmartClubSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const clubsByCountry = getClubsByCountry()
  const countries = Object.keys(clubsByCountry).sort()

  // Get filtered clubs based on search and selected country
  const getFilteredClubs = (): ClubCountryMapping[] => {
    if (searchQuery.length >= 2) {
      // Show search results
      return searchClubs(searchQuery, 20)
    }

    if (selectedCountry) {
      // Show clubs from selected country
      return clubsByCountry[selectedCountry] || []
    }

    // Show notable clubs from all countries
    const notableClubs: ClubCountryMapping[] = []
    countries.forEach(country => {
      const countryClubs = clubsByCountry[country].filter(club => club.notable)
      notableClubs.push(...countryClubs.slice(0, 3)) // Max 3 per country
    })

    return notableClubs
  }

  const filteredClubs = getFilteredClubs()

  // Handle club selection
  const handleClubSelect = (club: ClubCountryMapping) => {
    onChange(club.club, club.country, club.league)
    setIsOpen(false)
    setSearchQuery('')
    setSelectedCountry(null)
  }

  // Handle country selection
  const handleCountrySelect = (country: string) => {
    setSelectedCountry(selectedCountry === country ? null : country)
    setSearchQuery('')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setSelectedCountry(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input - Display only, click to open dropdown */}
      <div className="relative">
        <Building2 className="absolute left-3 top-3 w-5 h-5 text-white/60" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          readOnly
          onClick={() => setIsOpen(true)}
          className={`w-full bg-white/10 border rounded-lg pl-11 pr-10 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 cursor-pointer ${
            error
              ? 'border-red-400/50 focus:ring-red-400/20'
              : 'border-white/20 hover:border-white/30'
          }`}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-3 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-96 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/60" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedCountry(null)
                }}
                placeholder="Search clubs or cities..."
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {searchQuery.length >= 2 ? (
              /* Search Results */
              <div className="p-2">
                <div className="text-xs text-white/60 px-2 py-1 mb-2">
                  Search Results ({filteredClubs.length})
                </div>
                {filteredClubs.length > 0 ? (
                  filteredClubs.map((club, index) => (
                    <button
                      key={index}
                      onClick={() => handleClubSelect(club)}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-medium">{club.club}</div>
                          <div className="text-white/60 text-xs">{club.city}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/50">
                          <MapPin className="w-3 h-3" />
                          {club.country}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-white/50 text-sm">
                    No clubs found for "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              /* Country + Club Browser */
              <>
                {/* Country Selector */}
                <div className="p-2 border-b border-white/10">
                  <div className="text-xs text-white/60 px-2 py-1 mb-2">Select by Country</div>
                  <div className="grid grid-cols-2 gap-1">
                    {countries.slice(0, 8).map(country => {
                      const clubCount = clubsByCountry[country].length
                      const isSelected = selectedCountry === country

                      return (
                        <button
                          key={country}
                          onClick={() => handleCountrySelect(country)}
                          className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                            isSelected
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                              : 'hover:bg-white/10 text-white/80'
                          }`}
                        >
                          <div className="font-medium">{country}</div>
                          <div className="text-white/50">{clubCount} clubs</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Club List */}
                <div className="p-2">
                  {selectedCountry ? (
                    <>
                      <div className="text-xs text-white/60 px-2 py-1 mb-2">
                        {selectedCountry} ({clubsByCountry[selectedCountry].length} clubs)
                      </div>
                      {clubsByCountry[selectedCountry].map((club, index) => (
                        <button
                          key={index}
                          onClick={() => handleClubSelect(club)}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white text-sm font-medium flex items-center gap-2">
                                {club.club}
                                {club.notable && (
                                  <span className="text-yellow-400 text-xs">⭐</span>
                                )}
                              </div>
                              <div className="text-white/60 text-xs">{club.city} • {club.league}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-white/60 px-2 py-1 mb-2">
                        Popular Clubs ⭐
                      </div>
                      {filteredClubs.map((club, index) => (
                        <button
                          key={index}
                          onClick={() => handleClubSelect(club)}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white text-sm font-medium">{club.club}</div>
                              <div className="text-white/60 text-xs">{club.city}</div>
                            </div>
                            <div className="text-xs text-white/50">{club.country}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}