'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, User, MapPin, Calendar, Users } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { searchCountries, getAllCountryNames } from '@/lib/countries'
import { searchClubs, getAllClubNames } from '@/lib/football-clubs'
import { useAvatarUrl } from '../hooks/useAvatarUrl'
import { POSITION_MAPPINGS } from '@/lib/positions'

interface AddPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (playerData: any) => void
  tenantId: string // Actually tenant slug for API calls
  editingPlayer?: any // Player data when editing
}

export function AddPlayerModal({ isOpen, onClose, onSave, tenantId, editingPlayer }: AddPlayerModalProps) {
  // Early return MUST be before all hooks
  if (!isOpen) return null

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    positions: [] as string[],
    club: '',
    contractExpiry: '',
    agencyContractExpiry: '',
    height: '',
    notes: '',
    rating: '',
    avatarPath: '',
    hasMandate: false,
    mandateExpiry: '',
    mandateClubs: '',
    mandateNotes: ''
  })
  const [showCustomClubInput, setShowCustomClubInput] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadError, setUploadError] = useState<string>('')
  const [submitError, setSubmitError] = useState<string>('')

  // Get current avatar URL for preview - ensure hook always gets consistent values
  const { url: currentAvatarUrl } = useAvatarUrl({
    avatarPath: formData.avatarPath || '',
    avatarUrl: editingPlayer?.avatarUrl || '',
    tenantId: tenantId || ''
  })

  // Smart club options that include current player's club when editing
  const clubOptions = useMemo(() => {
    const baseOptions = [
      { value: 'Free Agent', label: '🟡 Free Agent' },
      ...getAllClubNames().map(name => ({
        value: name,
        label: name
      }))
    ]

    // If editing and current club is not already in the list, add it at the top
    if (editingPlayer?.club &&
        editingPlayer.club !== 'Free Agent' &&
        !baseOptions.find(opt => opt.value === editingPlayer.club)) {
      baseOptions.splice(1, 0, {
        value: editingPlayer.club,
        label: `${editingPlayer.club} (Current)`
      })
    }

    return baseOptions
  }, [editingPlayer?.club])

  // Generate position options from centralized POSITION_MAPPINGS
  const POSITION_OPTIONS = Object.entries(POSITION_MAPPINGS).map(([abbr, full]) => ({
    value: abbr,
    label: `${abbr} (${full})`
  }))

  // Populate form when editing a player
  useEffect(() => {
    if (editingPlayer) {
      console.log('🔄 Populating edit form with player data:', {
        id: editingPlayer.id,
        club: editingPlayer.club,
        positions: editingPlayer.positions,
        firstName: editingPlayer.firstName,
        lastName: editingPlayer.lastName
      })

      // Parse notes to extract mandate info if it exists
      const notes = editingPlayer.notes || ''
      const mandateMatch = notes.match(/MANDATE:\s*Clubs:\s*([^\n]*)\s*Valid until:\s*([^\n]*)\s*Description:\s*([\s\S]*)/)

      setFormData({
        firstName: editingPlayer.firstName || '',
        lastName: editingPlayer.lastName || '',
        dateOfBirth: editingPlayer.dateOfBirth ?
          new Date(editingPlayer.dateOfBirth).toISOString().split('T')[0] : '',
        nationality: editingPlayer.nationality || '',
        positions: editingPlayer.positions || [],
        club: editingPlayer.club || '',
        contractExpiry: editingPlayer.contractExpiry ?
          new Date(editingPlayer.contractExpiry).toISOString().split('T')[0] : '',
        agencyContractExpiry: editingPlayer.agencyContractExpiry ?
          new Date(editingPlayer.agencyContractExpiry).toISOString().split('T')[0] : '',
        height: editingPlayer.height ? String(editingPlayer.height) : '',
        notes: mandateMatch ? notes.replace(/MANDAT:[\s\S]*$/, '').trim() : notes,
        rating: editingPlayer.rating ? String(editingPlayer.rating) : '',
        avatarPath: editingPlayer.avatarPath || '',
        hasMandate: !!mandateMatch,
        mandateExpiry: mandateMatch?.[2]?.trim() || '',
        mandateClubs: mandateMatch?.[1]?.trim() || '',
        mandateNotes: mandateMatch?.[3]?.trim() || ''
      })
    } else {
      // Reset form for new player
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        positions: [],
        club: '',
        contractExpiry: '',
        agencyContractExpiry: '',
        height: '',
        notes: '',
        rating: '',
        avatarPath: '',
        hasMandate: false,
        mandateExpiry: '',
        mandateClubs: '',
        mandateNotes: ''
      })
    }
    setErrors({})
    setSubmitError('')
  }, [editingPlayer, isOpen])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle avatar upload
  const handleAvatarUploadComplete = (avatarPath: string) => {
    setFormData(prev => ({ ...prev, avatarPath }))
    setUploadError('')
  }

  const handleAvatarUploadError = (error: string) => {
    setUploadError(error)
  }

  const handlePositionToggle = (position: string) => {
    setFormData(prev => {
      const currentPositions = prev.positions
      const isSelected = currentPositions.includes(position)

      if (isSelected) {
        // Remove position
        return {
          ...prev,
          positions: currentPositions.filter(p => p !== position)
        }
      } else {
        // Add position (if less than 2)
        if (currentPositions.length < 2) {
          return {
            ...prev,
            positions: [...currentPositions, position]
          }
        }
      }

      return prev
    })

    // Clear position error when user makes changes
    if (errors.positions) {
      setErrors(prev => ({ ...prev, positions: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    }
    if (!formData.nationality?.trim()) {
      newErrors.nationality = 'Nationality is required'
    }
    if (!formData.club?.trim()) {
      newErrors.club = 'Club is required'
    }
    if (formData.positions.length === 0) {
      newErrors.positions = 'At least one position is required'
    }
    if (!formData.height.trim()) {
      newErrors.height = 'Height is required'
    } else if (isNaN(Number(formData.height)) || Number(formData.height) < 150 || Number(formData.height) > 220) {
      newErrors.height = 'Height must be between 150-220 cm'
    }
    if (formData.rating && (isNaN(Number(formData.rating)) || Number(formData.rating) < 1 || Number(formData.rating) > 10)) {
      newErrors.rating = 'Rating must be between 1-10'
    }

    // Validate club contract expiry date (no FIFA limit, but max 10 years is reasonable)
    if (formData.club && formData.club !== 'Free Agent' && formData.contractExpiry) {
      const contractDate = new Date(formData.contractExpiry)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (contractDate < today) {
        newErrors.contractExpiry = 'Club contract must be in the future'
      }

      // Reasonable max: 10 years
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 10)
      if (contractDate > maxDate) {
        newErrors.contractExpiry = 'Club contract can be max 10 years (reasonable limit)'
      }
    }

    // Validate agency contract expiry date (FIFA: max 2 years)
    if (formData.agencyContractExpiry) {
      const agencyContractDate = new Date(formData.agencyContractExpiry)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (agencyContractDate < today) {
        newErrors.agencyContractExpiry = 'Agency contract must be in the future'
      }

      // FIFA Rule: Maximum 2 years for agency contracts
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 2)
      if (agencyContractDate > maxDate) {
        newErrors.agencyContractExpiry = 'Agency contract can be max 2 years according to FIFA rules'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Guard: Ensure tenant is available before submitting
    if (!tenantId) {
      setSubmitError('Tenant information is missing. Please refresh the page.')
      return
    }

    setIsSubmitting(true)
    try {
      // Build notes with mandate info if applicable
      let finalNotes = formData.notes.trim()
      if (formData.hasMandate && formData.mandateClubs && formData.mandateExpiry) {
        const mandateSection = `\n\nMANDATE:\nClubs: ${formData.mandateClubs}\nValid until: ${formData.mandateExpiry}\nDescription: ${formData.mandateNotes || 'Not specified'}`
        finalNotes = finalNotes + mandateSection
      }

      const playerData = {
        ...formData,
        tenantId,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        contractExpiry: formData.contractExpiry ? new Date(formData.contractExpiry) : undefined,
        agencyContractExpiry: formData.agencyContractExpiry ? new Date(formData.agencyContractExpiry) : undefined,
        height: Number(formData.height),
        rating: formData.rating ? Number(formData.rating) : undefined,
        tags: [], // Default empty tags
        notes: finalNotes || undefined,
        // Clear club if Free Agent is selected (use null for consistency)
        club: formData.club === 'Free Agent' ? null : formData.club,
        // Convert positions array to single position string for Prisma compatibility
        position: formData.positions && formData.positions.length > 0 ? formData.positions[0] : undefined,
        // Keep hasMandate field for filtering, but remove internal mandate fields
        positions: undefined,
        hasMandate: formData.hasMandate, // Keep this so filter works!
        mandateExpiry: formData.mandateExpiry ? new Date(formData.mandateExpiry) : undefined,
        mandateClubs: formData.mandateClubs || undefined,
        mandateNotes: formData.mandateNotes || undefined
      }

      await onSave(playerData)

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        positions: [],
        club: '',
        contractExpiry: '',
        agencyContractExpiry: '',
        height: '',
        notes: '',
        rating: '',
        avatarPath: '',
        hasMandate: false,
        mandateExpiry: '',
        mandateClubs: '',
        mandateNotes: ''
      })
      setShowCustomClubInput(false)

      onClose()
    } catch (error) {
      console.error('Error saving player:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to save player')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] rounded-lg sm:rounded-xl shadow-2xl border border-white/20">

          {/* Header */}
          <div className="relative h-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-t-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 backdrop-blur-sm touch-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6">
              <h2 className="text-lg sm:text-2xl font-semibold text-white flex items-center gap-2 sm:gap-3">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
                {editingPlayer ? 'Redigera spelare' : 'Add New Player'}
              </h2>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">

            {/* Basic Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Basic Information</h3>

              {/* Avatar Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/60 mb-3">
                  Player Avatar
                </label>
                <AvatarUpload
                  currentAvatarUrl={currentAvatarUrl}
                  onUploadComplete={handleAvatarUploadComplete}
                  onUploadError={handleAvatarUploadError}
                  tenantId={tenantId}
                  playerId={editingPlayer?.id}
                  playerName={`${formData.firstName} ${formData.lastName}`.trim()}
                  disabled={isSubmitting}
                />
                {uploadError && (
                  <p className="text-red-400 text-sm mt-2">{uploadError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`
                      w-full px-3 sm:px-4 py-3 sm:py-3
                      bg-white/5 backdrop-blur-sm
                      border rounded-lg text-base
                      text-white placeholder-white/50
                      focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                      transition-all duration-200
                      ${errors.firstName ? 'border-red-400' : 'border-white/20 hover:border-white/30'}
                    `}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`
                      w-full px-3 sm:px-4 py-3 sm:py-3
                      bg-white/5 backdrop-blur-sm
                      border rounded-lg text-base
                      text-white placeholder-white/50
                      focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                      transition-all duration-200
                      ${errors.lastName ? 'border-red-400' : 'border-white/20 hover:border-white/30'}
                    `}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date of Birth (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    min="1950-01-01"
                    max="2010-12-31"
                    className={`
                      w-full px-3 sm:px-4 py-3
                      bg-white/5 backdrop-blur-sm
                      border rounded-lg
                      text-white text-base
                      focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                      hover:border-white/30
                      transition-all duration-200
                      ${errors.dateOfBirth ? 'border-red-400' : 'border-white/20'}
                    `}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Nationality *
                  </label>
                  <SearchableSelect
                    options={getAllCountryNames().map(name => ({
                      value: name,
                      label: name
                    }))}
                    value={formData.nationality}
                    onChange={(value) => handleInputChange('nationality', value || '')}
                    placeholder="Search for a country..."
                    searchPlaceholder="Type to search countries..."
                    onSearch={(query) =>
                      searchCountries(query).map(country => ({
                        value: country.name,
                        label: country.name
                      }))
                    }
                  />
                  {errors.nationality && (
                    <p className="text-red-400 text-sm mt-1">{errors.nationality}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    min="150"
                    max="220"
                    className={`
                      w-full px-3 sm:px-4 py-3
                      bg-white/5 backdrop-blur-sm
                      border rounded-lg text-base
                      text-white placeholder-white/50
                      focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                      transition-all duration-200
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                      ${errors.height ? 'border-red-400' : 'border-white/20 hover:border-white/30'}
                    `}
                    placeholder="Enter height in cm"
                  />
                  {errors.height && (
                    <p className="text-red-400 text-sm mt-1">{errors.height}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Club *
                  </label>

                  {showCustomClubInput ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.club}
                        onChange={(e) => handleInputChange('club', e.target.value)}
                        className={`
                          w-full px-3 sm:px-4 py-3
                          bg-white/5 backdrop-blur-sm
                          border rounded-lg
                          text-white placeholder-white/50 text-base
                          focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                          hover:border-white/30
                          transition-all duration-200
                          ${errors.club ? 'border-red-400' : 'border-white/20'}
                        `}
                        placeholder="Enter club name manually..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomClubInput(false)
                          handleInputChange('club', '')
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        ← Back to club search
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <SearchableSelect
                        key={editingPlayer?.id || 'new-player'}
                        options={clubOptions}
                        value={formData.club}
                        onChange={(value) => handleInputChange('club', value || '')}
                        placeholder="Search for a club or select Free Agent..."
                        searchPlaceholder="Type to search clubs..."
                        onSearch={(query) => {
                          const clubResults = searchClubs(query).map(club => ({
                            value: club.name,
                            label: `${club.name} (${club.city})`
                          }))

                          // Include Free Agent if query matches
                          const freeAgentMatch = 'Free Agent'.toLowerCase().includes(query.toLowerCase())
                          return freeAgentMatch
                            ? [{ value: 'Free Agent', label: '🟡 Free Agent' }, ...clubResults]
                            : clubResults
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomClubInput(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Club not found? Enter manually →
                      </button>
                    </div>
                  )}
                  {errors.club && (
                    <p className="text-red-400 text-sm mt-1">{errors.club}</p>
                  )}
                </div>

              </div>

              {/* Club Contract Expiry Date - Only show if club is selected and not Free Agent */}
              {formData.club && formData.club !== 'Free Agent' && (
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Club Contract Expiry (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.contractExpiry}
                    onChange={(e) => handleInputChange('contractExpiry', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={(() => {
                      const maxDate = new Date()
                      maxDate.setFullYear(maxDate.getFullYear() + 10)
                      return maxDate.toISOString().split('T')[0]
                    })()}
                    className={`
                      w-full px-3 sm:px-4 py-3
                      bg-white/5 backdrop-blur-sm
                      border rounded-lg text-base
                      text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                      hover:border-white/30
                      transition-all duration-200
                      ${errors.contractExpiry ? 'border-red-400' : 'border-white/20'}
                    `}
                  />
                  <p className="text-xs text-white/50 mt-1">
                    When does player's contract with {formData.club} expire? (Max 10 years)
                  </p>
                  {errors.contractExpiry && (
                    <p className="text-red-400 text-sm mt-1">{errors.contractExpiry}</p>
                  )}
                </div>
              )}

              {/* Agency Contract Expiry Date - FIFA 2 year rule */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Agency Contract Expiry (Optional)
                </label>
                <input
                  type="date"
                  value={formData.agencyContractExpiry}
                  onChange={(e) => handleInputChange('agencyContractExpiry', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  max={(() => {
                    const maxDate = new Date()
                    maxDate.setFullYear(maxDate.getFullYear() + 2)
                    return maxDate.toISOString().split('T')[0]
                  })()} // FIFA: Maximum 2 years
                  className={`
                    w-full px-3 sm:px-4 py-3
                    bg-white/5 backdrop-blur-sm
                    border rounded-lg text-base
                    text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                    hover:border-white/30
                    transition-all duration-200
                    ${errors.agencyContractExpiry ? 'border-red-400' : 'border-white/20'}
                  `}
                />
                {/* Agency Contract Feedback */}
                {formData.agencyContractExpiry && !errors.agencyContractExpiry && (
                  (() => {
                    const selectedDate = new Date(formData.agencyContractExpiry)
                    const today = new Date()
                    const twoYearsFromNow = new Date()
                    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)

                    const monthsUntilExpiry = Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
                    const isValid = selectedDate <= twoYearsFromNow && selectedDate > today

                    return isValid ? (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        ✅ Valid agency contract ({monthsUntilExpiry} months, within FIFA 2-year rule)
                      </p>
                    ) : null
                  })()
                )}
                <p className="text-xs text-white/50 mt-1">
                  When does your contract with the player expire? (Max 2 years per FIFA)
                </p>
                {errors.agencyContractExpiry && (
                  <p className="text-red-400 text-sm mt-1">{errors.agencyContractExpiry}</p>
                )}
              </div>

              {/* Multi-Position Selection */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-3">
                  <Users className="w-4 h-4 inline mr-1" />
                  Positions * (Select max 2 positions)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {POSITION_OPTIONS.map((option) => {
                    const isSelected = formData.positions.includes(option.value)
                    const canSelect = formData.positions.length < 2 || isSelected

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => canSelect && handlePositionToggle(option.value)}
                        className={`
                          p-2 sm:p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 h-10 sm:h-12
                          flex items-center justify-center text-center leading-tight touch-none
                          ${isSelected
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : canSelect
                              ? 'bg-white/5 border-white/20 text-white/90 hover:bg-white/10 hover:border-white/30'
                              : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                          }
                        `}
                        disabled={!canSelect}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                {formData.positions.length === 2 && (
                  <p className="text-blue-400 text-sm mt-2">Maximum positions selected</p>
                )}
                {errors.positions && (
                  <p className="text-red-400 text-sm mt-2">{errors.positions}</p>
                )}
              </div>
            </div>

            {/* Club & Physical */}
            <div className="space-y-4">


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div></div>
              </div>
            </div>


            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Scout Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="
                  w-full px-3 sm:px-4 py-3
                  bg-white/5 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-white placeholder-white/50 text-base
                  focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                  hover:border-white/30
                  transition-all duration-200 resize-none
                "
                placeholder="Add any scouting notes or observations..."
              />
            </div>

            {/* Mandate Section */}
            <div className="space-y-4 border-t border-white/20 pt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasMandate"
                  checked={formData.hasMandate}
                  onChange={(e) => handleInputChange('hasMandate', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-400/20"
                />
                <label htmlFor="hasMandate" className="text-base font-medium text-white">
                  📋 We have mandate for this player
                </label>
              </div>

              {formData.hasMandate && (
                <div className="space-y-4 pl-7 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Mandate Valid Until *
                      </label>
                      <input
                        type="date"
                        value={formData.mandateExpiry}
                        onChange={(e) => handleInputChange('mandateExpiry', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={(() => {
                          const maxDate = new Date()
                          maxDate.setFullYear(maxDate.getFullYear() + 2)
                          return maxDate.toISOString().split('T')[0]
                        })()}
                        className="
                          w-full px-3 sm:px-4 py-3
                          bg-white/5 backdrop-blur-sm
                          border border-white/20 rounded-lg
                          text-white text-base
                          focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                          hover:border-white/30
                          transition-all duration-200
                        "
                      />
                      <p className="text-xs text-white/50 mt-1">Max 2 years per FIFA</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">
                        Clubs the mandate applies to *
                      </label>
                      <input
                        type="text"
                        value={formData.mandateClubs}
                        onChange={(e) => handleInputChange('mandateClubs', e.target.value)}
                        placeholder="e.g. Real Madrid, Barcelona, Bayern München"
                        className="
                          w-full px-3 sm:px-4 py-3
                          bg-white/5 backdrop-blur-sm
                          border border-white/20 rounded-lg
                          text-white placeholder-white/50 text-base
                          focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                          hover:border-white/30
                          transition-all duration-200
                        "
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Mandate Description (Optional)
                    </label>
                    <textarea
                      value={formData.mandateNotes}
                      onChange={(e) => handleInputChange('mandateNotes', e.target.value)}
                      rows={2}
                      placeholder="e.g. Exclusive mandate for sale, representation rights, etc."
                      className="
                        w-full px-3 sm:px-4 py-3
                        bg-white/5 backdrop-blur-sm
                        border border-white/20 rounded-lg
                        text-white placeholder-white/50 text-base
                        focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400
                        hover:border-white/30
                        transition-all duration-200 resize-none
                      "
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-blue-400 text-xs">
                      💡 Mandatinformationen sparas i spelarens anteckningar och visas i spelarprofilen.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-4 bg-red-500/20 rounded-lg border border-red-400/30">
                <p className="text-red-300 text-sm">{submitError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/10 border-2 border-white/20 text-white hover:bg-white/15 font-semibold py-4 sm:py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-sm touch-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-4 sm:py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed touch-none"
              >
                {isSubmitting
                  ? (editingPlayer ? 'Uppdaterar...' : 'Adding Player...')
                  : (editingPlayer ? 'Uppdatera spelare' : 'Add Player')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}