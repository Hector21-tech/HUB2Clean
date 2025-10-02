'use client'

import { useState } from 'react'
import { X, Edit, Star, TrendingUp, Calendar, MapPin, Mail, Phone, Globe, Trash2, FileText, Loader2, Share, Bot, Save, RefreshCw, FileCheck } from 'lucide-react'
import { Player } from '../types/player'
import { formatPositionsDisplay } from '@/lib/positions'
import { generateAndSharePDFWithGesture, isMobileDevice, isShareSupported } from '@/lib/sharePdf'
import { useAvatarUrl } from '../hooks/useAvatarUrl'
import { getPlayerInitials } from '@/lib/formatters'

interface PlayerDetailDrawerProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
  onScheduleTrial?: (player: Player) => void
}

export function PlayerDetailDrawer({ player, isOpen, onClose, onEdit, onDelete, onScheduleTrial }: PlayerDetailDrawerProps) {
  // Early return MUST be before all hooks
  if (!player || !isOpen) return null

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState('')

  // Notes editing states
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState(player?.notes || '')
  const [isEnhancingNotes, setIsEnhancingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)


  // Get the best avatar URL (new system with fallback to legacy)
  const { url: avatarUrl, isLoading: avatarLoading } = useAvatarUrl({
    avatarPath: player?.avatarPath,
    avatarUrl: player?.avatarUrl,
    tenantId: player?.tenantId || '',
    playerName: player ? `${player.firstName} ${player.lastName}` : undefined
  })

  const calculateAge = (dateOfBirth?: Date) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    if (amount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}K`
    return `€${amount}`
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getSkillLevel = (rating?: number) => {
    if (!rating) return { label: 'N/A', color: 'bg-white/20' }
    if (rating >= 9) return { label: 'Elite', color: 'bg-gradient-to-r from-blue-400 to-blue-600' }
    if (rating >= 8) return { label: 'Excellent', color: 'bg-gradient-to-r from-blue-400/80 to-blue-600/80' }
    if (rating >= 7) return { label: 'Good', color: 'bg-gradient-to-r from-blue-400/60 to-blue-600/60' }
    if (rating >= 6) return { label: 'Average', color: 'bg-white/20' }
    return { label: 'Below Avg', color: 'bg-white/20' }
  }

  const technicalSkills = [
    { name: 'Shooting', value: player.shooting },
    { name: 'Passing', value: player.passing },
    { name: 'Dribbling', value: player.dribbling },
    { name: 'Crossing', value: player.crossing },
    { name: 'Finishing', value: player.finishing },
    { name: 'First Touch', value: player.firstTouch }
  ]

  const physicalAttributes = [
    { name: 'Pace', value: player.pace },
    { name: 'Acceleration', value: player.acceleration },
    { name: 'Strength', value: player.strength },
    { name: 'Stamina', value: player.stamina },
    { name: 'Agility', value: player.agility },
    { name: 'Jumping', value: player.jumping }
  ]

  const mentalAttributes = [
    { name: 'Vision', value: player.vision },
    { name: 'Decisions', value: player.decisions },
    { name: 'Composure', value: player.composure },
    { name: 'Leadership', value: player.leadership },
    { name: 'Work Rate', value: player.workRate },
    { name: 'Determination', value: player.determination }
  ]

  const formatAIText = (text: string) => {
    if (!text) return text

    // Remove all ** symbols
    let formattedText = text.replace(/\*\*/g, '')

    // Convert "Styrkor:" and "Svagheter:" to HTML strong tags
    formattedText = formattedText.replace(/^Styrkor:/gm, '<strong>Styrkor:</strong>')
    formattedText = formattedText.replace(/^Svagheter:/gm, '<strong>Svagheter:</strong>')

    // Convert newlines to HTML line breaks
    formattedText = formattedText.replace(/\n/g, '<br>')

    return formattedText
  }



  const handleExportPDF = async () => {
    if (!player) return

    setIsGeneratingPDF(true)

    try {
      // Use Notes as primary source for PDF content
      const notesForPDF = player.notes || 'Ingen information finns tillgänglig'

      // Get absolute avatar URL for PDF generation
      let absoluteAvatarUrl = null
      if (avatarUrl && avatarUrl.startsWith('/api/')) {
        // Convert relative proxy URL to absolute URL
        const baseUrl = window.location.origin
        absoluteAvatarUrl = `${baseUrl}${avatarUrl}`
      } else if (avatarUrl) {
        // Use avatarUrl as-is if it's already absolute
        absoluteAvatarUrl = avatarUrl
      }

      // Use new gesture-preserving PDF helper
      await generateAndSharePDFWithGesture({
        playerData: { ...player, avatarUrl: absoluteAvatarUrl },
        aiImprovedNotes: notesForPDF,
        fileName: `${player.firstName}_${player.lastName}_Scout_Report.pdf`,
        title: `Scout Report - ${player.firstName} ${player.lastName}`,
        tenantId: player.tenantId,
        onProgress: setPdfProgress
      })

    } catch (error) {
      console.error('Error generating PDF:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('Ett fel uppstod vid generering av PDF. Försök igen.')
      }
    } finally {
      setIsGeneratingPDF(false)
      setPdfProgress('')
    }
  }

  const generatePDFContent = (player: Player, notesContent: string | null) => {
    const currentDate = new Date().toLocaleDateString('en-US')
    const age = calculateAge(player.dateOfBirth)
    const positions = formatPositionsDisplay(player.positions || []) || 'Player'

    const formatDate = (date?: Date) => {
      if (!date) return 'Not specified'
      return new Date(date).toLocaleDateString('en-US')
    }

    return `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spelarprofil - ${player.firstName} ${player.lastName}</title>
    <style>
        @media print {
            @page {
                margin: 15mm 10mm 10mm 10mm;
                size: A4;
            }
            body {
                -webkit-print-color-adjust: exact;
                margin: 0 !important;
                padding: 0 !important;
            }

            .player-header {
                margin-top: 0 !important;
                padding-top: 0 !important;
            }
        }

        * { box-sizing: border-box; }

        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
            background: white;
        }

        .player-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 10px;
            margin-top: 20px;
        }

        .player-photo-pdf {
            width: 120px;
            height: 120px;
            border-radius: 10px;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: #666;
            flex-shrink: 0;
        }

        .player-basic-info h1 {
            margin: 0 0 10px 0;
            font-size: 2rem;
            color: #333;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .info-section {
            background: white;
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 20px;
        }

        .info-section h3 {
            margin: 0 0 15px 0;
            color: #d4af37;
            font-size: 1.2rem;
            border-bottom: 2px solid #d4af37;
            padding-bottom: 5px;
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .info-item:last-child {
            border-bottom: none;
        }

        .info-label {
            font-weight: 600;
            color: #666;
        }

        .info-value {
            font-weight: 500;
            color: #333;
        }

        .notes-section {
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 10px;
            border-left: 5px solid #d4af37;
        }

        .notes-section h3 {
            margin: 0 0 15px 0;
            color: #d4af37;
        }

        .notes-content {
            color: #666;
            line-height: 1.6;
        }

        .pdf-footer {
            margin-top: 80px;
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 0.9rem;
        }

        .contact-info {
            margin-top: 20px;
            padding: 15px;
            background: #d4af37;
            color: white;
            border-radius: 5px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="player-header">
        <div class="player-photo-pdf">
            ${avatarUrl ?
                `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" alt="${player.firstName} ${player.lastName}">` :
                `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8, #1e40af); border-radius: 10px;"></div>`}
        </div>
        <div class="player-basic-info">
            <h1>${player.firstName} ${player.lastName}</h1>
            <div style="font-size: 1.1rem; color: #666; margin-top: 10px;">
                ${positions} | ${age || 'Okänd ålder'} år | ${player.nationality || 'Okänd'}
            </div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h3>Personal Information</h3>
            <div class="info-item">
                <span class="info-label">Age:</span>
                <span class="info-value">${age || 'Not specified'} years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Height:</span>
                <span class="info-value">${player.height ? player.height + ' cm' : 'Not specified'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date of Birth:</span>
                <span class="info-value">${player.dateOfBirth ? formatDate(player.dateOfBirth) : 'Not specified'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Nationality:</span>
                <span class="info-value">${player.nationality || 'Not specified'}</span>
            </div>
        </div>

        <div class="info-section">
            <h3>Club & Contract</h3>
            <div class="info-item">
                <span class="info-label">Current club:</span>
                <span class="info-value">${player.club || 'Not specified'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Contract start:</span>
                <span class="info-value">Not specified</span>
            </div>
            <div class="info-item">
                <span class="info-label">Contract end:</span>
                <span class="info-value">${player.contractExpiry ? formatDate(player.contractExpiry) : 'Not specified'}</span>
            </div>
        </div>
    </div>

    ${notesContent ? `
        <div class="notes-section">
            <h3>Scoutanteckningar</h3>
            <div class="notes-content">${notesContent}</div>
        </div>
    ` : ''}

    <div class="pdf-footer">
        <div>Genererad: ${currentDate}</div>
        <div class="contact-info">
            <strong>Elite Sports Group AB</strong><br>
            Professional Football Agents
        </div>
    </div>
</body>
</html>`
  }

  // Notes editing functions
  const handleSaveNotes = async () => {
    if (!player) return

    setIsSavingNotes(true)

    try {
      const { apiFetch } = await import('@/lib/api-config')
      const response = await apiFetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          notes: editedNotes.trim() || null
        })
      })

      if (response.ok) {
        // Update local player object
        player.notes = editedNotes.trim() || undefined
        setIsEditingNotes(false)
        alert('Anteckningar sparade!')
      } else {
        alert('Kunde inte spara anteckningar.')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Ett fel uppstod vid sparning av anteckningar.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleEnhanceNotes = async () => {
    if (!editedNotes.trim()) return

    setIsEnhancingNotes(true)

    try {
      const { apiFetch } = await import('@/lib/api-config')
      const response = await apiFetch('/api/enhance-player-notes', {
        method: 'POST',
        body: JSON.stringify({
          notes: editedNotes.trim(),
          playerInfo: {
            firstName: player.firstName,
            lastName: player.lastName,
            position: player.positions?.[0] || 'Spelare',
            club: player.club || 'Okänd klubb',
            nationality: player.nationality || 'Okänd nationalitet',
            age: calculateAge(player.dateOfBirth) || 'Okänd ålder'
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.enhancedNotes) {
          setEditedNotes(result.enhancedNotes)
        } else {
          alert('AI-förbättring misslyckades. Försök igen.')
        }
      } else {
        alert('AI-förbättring misslyckades. Försök igen.')
      }
    } catch (error) {
      console.error('Error enhancing notes:', error)
      alert('Ett fel uppstod vid AI-förbättring.')
    } finally {
      setIsEnhancingNotes(false)
    }
  }

  return (
    <div className={`
      fixed inset-0 z-50 transition-opacity duration-300 ease-out
      ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`
        absolute top-0 right-0 h-full w-full sm:max-w-2xl
        bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510]
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        overflow-y-auto backdrop-blur-sm
      `}>
        {/* Hero Header */}
        <div className="relative h-48 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
          {/* Player Avatar Background */}
          {avatarUrl && !avatarLoading ? (
            <img
              src={avatarUrl}
              alt={`${player.firstName} ${player.lastName}`}
              className="absolute inset-0 w-full h-full object-cover object-top filter sepia-[5%] contrast-105 brightness-98"
              loading="lazy"
              onError={(e) => {
                // More robust fallback - try loading once more, then hide
                const target = e.target as HTMLImageElement
                if (!target.dataset.retried) {
                  target.dataset.retried = 'true'
                  // Force reload the image
                  target.src = target.src + '?retry=' + Date.now()
                } else {
                  target.style.display = 'none'
                }
              }}
              onLoad={(e) => {
                // Ensure image is visible when loaded successfully
                const target = e.target as HTMLImageElement
                target.style.display = 'block'
              }}
            />
          ) : (
            // Fallback background without initials
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800" />
          )}

          {/* Enhanced Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 backdrop-blur-sm z-10 touch-none"
          >
            <X className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>

          {/* Player Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl sm:text-3xl font-semibold text-white mb-2 leading-tight" translate="no" lang="en">
                  {player.firstName} {player.lastName}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-white/90">
                  <span className="font-medium">{player.club || 'Free Agent'}</span>
                  <span>•</span>
                  <span className="font-medium">{formatPositionsDisplay(player.positions || []) || 'Player'}</span>
                  {player.rating && (
                    <>
                      <span>•</span>
                      <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold">
                        {player.rating.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => onEdit(player)}
                  className="p-2 sm:p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-lg touch-none"
                >
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 sm:p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-lg touch-none"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Contract & Mandate Section */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-400" />
              Contract & Mandate
            </h3>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Club Contract Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <h4 className="text-base font-semibold text-white">Club Contract</h4>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Current club</label>
                    <p className="text-lg font-semibold text-white">
                      {player.club || '🟡 Free Agent'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Contract expiry</label>
                    {player.contractExpiry ? (
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {formatDate(player.contractExpiry)}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          Player's contract with club
                        </p>
                      </div>
                    ) : (
                      <p className="text-base text-white/60">Not specified</p>
                    )}
                  </div>
                </div>

                {/* Agency Contract Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck className="w-5 h-5 text-green-400" />
                    <h4 className="text-base font-semibold text-white">Agency Contract</h4>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Status</label>
                    {player.agencyContractExpiry ? (
                      <p className="text-lg font-semibold text-green-400">
                        ✅ Active contract
                      </p>
                    ) : (
                      <p className="text-base text-white/60">
                        No agency contract registered
                      </p>
                    )}
                  </div>
                  {player.agencyContractExpiry && (
                    <div>
                      <label className="text-sm font-medium text-white/60">Contract expiry</label>
                      {(() => {
                        const today = new Date()
                        const agencyContractDate = new Date(player.agencyContractExpiry)
                        const sixMonthsFromNow = new Date()
                        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

                        const daysUntilExpiry = Math.floor((agencyContractDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        const monthsUntilExpiry = Math.floor(daysUntilExpiry / 30)

                        let statusColor = 'text-green-400'
                        let statusText = `${monthsUntilExpiry} months remaining`
                        let statusIcon = '🟢'

                        if (agencyContractDate < today) {
                          statusColor = 'text-red-400'
                          statusText = 'Expired'
                          statusIcon = '🔴'
                        } else if (agencyContractDate < sixMonthsFromNow) {
                          statusColor = 'text-yellow-400'
                          statusText = `${daysUntilExpiry} days remaining`
                          statusIcon = '🟡'
                        }

                        return (
                          <div>
                            <p className={`text-lg font-semibold ${statusColor}`}>
                              {formatDate(player.agencyContractExpiry)}
                            </p>
                            <p className={`text-sm ${statusColor} mt-1 flex items-center gap-1`}>
                              {statusIcon} {statusText} (FIFA max 2 years)
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {/* Mandate Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck className="w-5 h-5 text-purple-400" />
                    <h4 className="text-base font-semibold text-white">Mandate</h4>
                  </div>
                  {player.hasMandate ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-white/60">Status</label>
                        <p className="text-lg font-semibold text-purple-400">
                          ✅ We have mandate
                        </p>
                      </div>
                      {player.mandateClubs && (
                        <div>
                          <label className="text-sm font-medium text-white/60">Clubs</label>
                          <p className="text-base text-white">
                            {player.mandateClubs}
                          </p>
                        </div>
                      )}
                      {player.mandateExpiry && (
                        <div>
                          <label className="text-sm font-medium text-white/60">Valid until</label>
                          <p className="text-base text-white">
                            {new Date(player.mandateExpiry).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      )}
                      {player.mandateNotes && (
                        <div>
                          <label className="text-sm font-medium text-white/60">Description</label>
                          <p className="text-sm text-white/80">
                            {player.mandateNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-white/60">Status</label>
                      <p className="text-base text-white/60">
                        No mandate registered
                      </p>
                      <p className="text-xs text-white/40 mt-2">
                        Add mandate via "Edit player"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-400" />
              Basic Information
            </h3>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/60">Age</label>
                    <p className="text-lg font-semibold text-white">
                      {calculateAge(player.dateOfBirth) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Nationality</label>
                    <p className="text-lg font-semibold text-white">
                      {player.nationality || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/60">Height</label>
                    <p className="text-lg font-semibold text-white">
                      {player.height ? `${player.height}cm` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Market Value</label>
                    <p className="text-lg font-semibold text-blue-400 drop-shadow-sm">
                      {formatCurrency(player.marketValue)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Jersey Number</label>
                    <p className="text-lg font-semibold text-white">
                      {player.jerseyNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Stats */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Season Performance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Goals', value: player.goalsThisSeason || 0 },
                { label: 'Assists', value: player.assistsThisSeason || 0 },
                { label: 'Matches', value: player.appearances || 0 },
                { label: 'Minutes', value: player.minutesPlayed || 0 }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 text-center"
                >
                  <div className="text-xl sm:text-2xl font-bold text-blue-400 drop-shadow-sm mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Technical Skills */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">Technical Skills</h3>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {technicalSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#1e3a8a]/30 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-300 shadow-sm"
                          style={{ width: `${((skill.value || 0) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-400 w-8">
                        {skill.value?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Physical Attributes */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">Physical Attributes</h3>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {physicalAttributes.map((attr) => (
                  <div key={attr.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{attr.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#1e3a8a]/30 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-300 shadow-sm"
                          style={{ width: `${((attr.value || 0) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-400 w-8">
                        {attr.value?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mental Attributes */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">Mental Attributes</h3>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {mentalAttributes.map((attr) => (
                  <div key={attr.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{attr.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#1e3a8a]/30 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-300 shadow-sm"
                          style={{ width: `${((attr.value || 0) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-400 w-8">
                        {attr.value?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>


          {/* Notes & Tags - Editable */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">📝 Scout Notes</h3>
              <div className="flex gap-2">
                {!isEditingNotes ? (
                  <button
                    onClick={() => {
                      setIsEditingNotes(true)
                      setEditedNotes(player.notes || '')
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleEnhanceNotes}
                      disabled={isEnhancingNotes || !editedNotes.trim()}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200"
                      title="Enhance text with AI - corrects grammar and structure without adding new information"
                    >
                      {isEnhancingNotes ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI working...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4" />
                          Rewrite with AI
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                      {isSavingNotes ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNotes(false)
                        setEditedNotes(player.notes || '')
                      }}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 space-y-4">
              {/* Notes Section */}
              <div>
                <label className="text-sm font-medium text-white/60 block mb-2">
                  Scout Notes {isEditingNotes && <span className="text-purple-400">(AI can enhance your text)</span>}
                </label>
                {isEditingNotes ? (
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-vertical"
                    placeholder="Write your scout notes here... (e.g. fast player, good technique, needs to improve finishing)"
                  />
                ) : (
                  <div className="min-h-[100px] p-4 bg-white/5 rounded-lg border border-white/10">
                    {player.notes ? (
                      <p className="text-white leading-relaxed whitespace-pre-wrap">{player.notes}</p>
                    ) : (
                      <p className="text-white/40 italic">No notes yet. Click "Edit" to add.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              {player.tags?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-white/60 block mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {player.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full border border-blue-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Text */}
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-blue-400 text-xs">
                  💡 Tip: Write keywords and press "Rewrite with AI" for professional notes. AI uses ONLY your information - no fabrication.
                </p>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-white/20">
            <button
              onClick={() => onScheduleTrial?.(player)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 sm:py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-none disabled:opacity-50"
              disabled={!onScheduleTrial}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Schedule Trial
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="flex-1 bg-white/10 border-2 border-white/20 text-white hover:bg-white/15 font-semibold py-4 sm:py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-sm touch-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {pdfProgress || 'Genererar PDF...'}
                </>
              ) : (
                <>
                  {isMobileDevice() && isShareSupported() ? (
                    <Share className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  {isMobileDevice() && isShareSupported() ? 'Share PDF' : 'Export PDF'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Player</h3>
            <p className="text-white/80 mb-6">
              Are you sure you want to delete <strong translate="no" lang="en">{player.firstName} {player.lastName}</strong>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 sm:py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/15 transition-colors duration-200 disabled:opacity-50 touch-none"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true)
                  try {
                    await onDelete(player)
                    setShowDeleteConfirm(false)
                    onClose() // Close drawer after successful delete
                  } catch (error) {
                    console.error('Delete failed:', error)
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 touch-none"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}