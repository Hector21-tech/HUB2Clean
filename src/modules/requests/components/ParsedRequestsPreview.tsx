'use client'

import { useState } from 'react'
import { Check, X, AlertTriangle, Edit2, Trash2 } from 'lucide-react'

export interface ParsedRequest {
  id: string
  club: string
  country: string
  league: string
  position: string
  windowCloseAt?: string
  dealType: string
  priority: string
  status: string
  ageMax?: number
  birthYear?: number
  notes?: string
  confidence: {
    club: number
    position: number
    overall: number
  }
  isDuplicate?: boolean
  hasWarnings?: boolean
}

interface ParsedRequestsPreviewProps {
  requests: ParsedRequest[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onEdit: (id: string, field: keyof ParsedRequest, value: any) => void
  onRemove: (id: string) => void
}

export function ParsedRequestsPreview({
  requests,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onRemove
}: ParsedRequestsPreviewProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)

  const allSelected = requests.length > 0 && requests.every(r => selectedIds.has(r.id))
  const selectedCount = requests.filter(r => selectedIds.has(r.id)).length

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  // Get confidence badge
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return '✓'
    if (confidence >= 0.5) return '⚠️'
    return '❌'
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-4">
          <div className="text-sm text-white/60">
            Parsed <span className="text-white font-semibold">{requests.length}</span> requests
          </div>
          <div className="text-sm text-white/60">
            Selected <span className="text-green-400 font-semibold">{selectedCount}</span>
          </div>
        </div>

        <button
          onClick={onToggleSelectAll}
          className="px-3 py-1.5 text-sm text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Preview table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider w-12">
                  Select
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Club
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  League
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Window
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {requests.map((request) => {
                const isSelected = selectedIds.has(request.id)
                const lowConfidence = request.confidence.overall < 0.6

                return (
                  <tr
                    key={request.id}
                    className={`
                      transition-colors
                      ${isSelected ? 'bg-blue-500/10' : 'hover:bg-white/5'}
                      ${request.isDuplicate ? 'bg-red-500/10' : ''}
                      ${lowConfidence ? 'bg-yellow-500/5' : ''}
                    `}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(request.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>

                    {/* Club - editable */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {editingCell?.id === request.id && editingCell?.field === 'club' ? (
                          <input
                            type="text"
                            defaultValue={request.club}
                            autoFocus
                            onBlur={(e) => {
                              onEdit(request.id, 'club', e.target.value)
                              setEditingCell(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onEdit(request.id, 'club', e.currentTarget.value)
                                setEditingCell(null)
                              }
                            }}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingCell({ id: request.id, field: 'club' })}
                            className="flex items-center gap-2 text-left hover:text-blue-400 transition-colors"
                          >
                            <span className={request.confidence.club < 0.6 ? 'text-yellow-400' : ''}>
                              {request.club}
                            </span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                        {request.isDuplicate && (
                          <span className="text-xs text-red-400 font-semibold">DUPLICATE</span>
                        )}
                      </div>
                    </td>

                    {/* Position - editable */}
                    <td className="px-4 py-3">
                      {editingCell?.id === request.id && editingCell?.field === 'position' ? (
                        <input
                          type="text"
                          defaultValue={request.position}
                          autoFocus
                          onBlur={(e) => {
                            onEdit(request.id, 'position', e.target.value)
                            setEditingCell(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onEdit(request.id, 'position', e.currentTarget.value)
                              setEditingCell(null)
                            }
                          }}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingCell({ id: request.id, field: 'position' })}
                          className={`flex items-center gap-2 hover:text-blue-400 transition-colors ${
                            request.confidence.position < 0.6 ? 'text-yellow-400' : ''
                          }`}
                        >
                          {request.position}
                        </button>
                      )}
                    </td>

                    {/* League */}
                    <td className="px-4 py-3 text-sm text-white/80">
                      {request.league || '-'}
                    </td>

                    {/* Age */}
                    <td className="px-4 py-3 text-sm text-white/80">
                      {request.ageMax ? `Max ${request.ageMax}` : request.birthYear ? `Born ${request.birthYear}` : '-'}
                    </td>

                    {/* Window */}
                    <td className="px-4 py-3 text-sm text-white/80">
                      {request.windowCloseAt || '-'}
                    </td>

                    {/* Confidence */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className={getConfidenceColor(request.confidence.overall)}>
                          {getConfidenceBadge(request.confidence.overall)}
                        </span>
                        <span className="text-xs text-white/60">
                          {Math.round(request.confidence.overall * 100)}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onRemove(request.id)}
                        className="p-1 text-white/60 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning for low confidence items */}
      {requests.some(r => r.confidence.overall < 0.6) && (
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            Some requests have low confidence scores. Please review them before creating.
          </div>
        </div>
      )}
    </div>
  )
}
