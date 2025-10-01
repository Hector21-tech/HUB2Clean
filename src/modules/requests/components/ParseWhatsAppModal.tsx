'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { ParsedRequestsPreview, ParsedRequest } from './ParsedRequestsPreview'

interface ParseWhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRequests: (requests: ParsedRequest[]) => Promise<void>
  existingRequests?: any[] // For duplicate detection
}

const EXAMPLE_TEXT = `🇹🇷 open till 12/09/25

⚽️ Süper Lig

Beşiktaş
Right winger

Başakşehir
Defensive Midfield
Winger

Antalyaspor
Right-Back
Right-Winger (can play Striker)`

export function ParseWhatsAppModal({
  isOpen,
  onClose,
  onCreateRequests,
  existingRequests = []
}: ParseWhatsAppModalProps) {
  const [inputText, setInputText] = useState('')
  const [parsedRequests, setParsedRequests] = useState<ParsedRequest[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isParsing, setIsParsing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  if (!isOpen) return null

  // Parse WhatsApp text with AI
  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('Please paste WhatsApp text')
      return
    }

    setIsParsing(true)
    setError('')

    try {
      const response = await fetch('/api/requests/parse-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse text')
      }

      // Check for duplicates
      const requestsWithDuplicateCheck = result.data.map((req: ParsedRequest) => {
        const isDuplicate = existingRequests.some(
          existing =>
            existing.club.toLowerCase() === req.club.toLowerCase() &&
            existing.position === req.position &&
            existing.status !== 'COMPLETED' &&
            existing.status !== 'CANCELLED'
        )
        return { ...req, isDuplicate }
      })

      setParsedRequests(requestsWithDuplicateCheck)
      setSelectedIds(new Set(requestsWithDuplicateCheck.map((r: ParsedRequest) => r.id)))
      setShowPreview(true)
    } catch (err) {
      console.error('Parse error:', err)
      setError(err instanceof Error ? err.message : 'Failed to parse text')
    } finally {
      setIsParsing(false)
    }
  }

  // Toggle select single request
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedIds.size === parsedRequests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(parsedRequests.map(r => r.id)))
    }
  }

  // Edit parsed request
  const handleEdit = (id: string, field: keyof ParsedRequest, value: any) => {
    setParsedRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, [field]: value } : req))
    )
  }

  // Remove parsed request
  const handleRemove = (id: string) => {
    setParsedRequests(prev => prev.filter(req => req.id !== id))
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  // Create selected requests
  const handleCreate = async () => {
    const requestsToCreate = parsedRequests.filter(r => selectedIds.has(r.id))

    if (requestsToCreate.length === 0) {
      setError('Please select at least one request to create')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      await onCreateRequests(requestsToCreate)
      // Success - close modal
      handleReset()
      onClose()
    } catch (err) {
      console.error('Create error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create requests')
    } finally {
      setIsCreating(false)
    }
  }

  // Reset modal state
  const handleReset = () => {
    setInputText('')
    setParsedRequests([])
    setSelectedIds(new Set())
    setShowPreview(false)
    setError('')
  }

  // Load example
  const handleLoadExample = () => {
    setInputText(EXAMPLE_TEXT)
  }

  const selectedCount = Array.from(selectedIds).length

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Parse WhatsApp Request</h2>
              <p className="text-sm text-white/60">
                AI-powered parsing of scout requests from WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!showPreview ? (
            /* Input view */
            <div className="space-y-4">
              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white/80">
                    Paste WhatsApp Text
                  </label>
                  <button
                    onClick={handleLoadExample}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Load Example
                  </button>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="🇹🇷 open till 12/09/25

⚽️ Süper Lig

Beşiktaş
Right winger
Striker

Başakşehir
Defensive Midfield
..."
                  rows={16}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Info box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-sm text-blue-200 space-y-2">
                  <p className="font-semibold">✨ AI will extract:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                    <li>Country & League from emoji/text</li>
                    <li>Club names and positions</li>
                    <li>Age requirements (max. 23y., born 2002)</li>
                    <li>Transfer window dates</li>
                    <li>Multiple requests per club</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Preview view */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Review Parsed Requests
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  ← Back to edit
                </button>
              </div>

              <ParsedRequestsPreview
                requests={parsedRequests}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onEdit={handleEdit}
                onRemove={handleRemove}
              />

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={isParsing || isCreating}
            className="px-6 py-2.5 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!showPreview ? (
              <button
                onClick={handleParse}
                disabled={isParsing || !inputText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Parse with AI
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating || selectedCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create {selectedCount > 0 ? `Selected (${selectedCount})` : 'All'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
