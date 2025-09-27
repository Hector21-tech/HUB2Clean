'use client'

import { useState } from 'react'
import { X, Star, FileText } from 'lucide-react'
import { Trial, TrialEvaluationInput } from '../types/trial'
import { useEvaluateTrial } from '../hooks/useTrialMutations'

interface EvaluateTrialModalProps {
  trial: Trial | null
  isOpen: boolean
  onClose: () => void
}

export function EvaluateTrialModal({ trial, isOpen, onClose }: EvaluateTrialModalProps) {
  const [formData, setFormData] = useState({
    rating: 5,
    feedback: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const evaluateTrial = useEvaluateTrial(trial?.tenantId || '')

  if (!trial || !isOpen) return null

  const playerName = trial.player
    ? `${trial.player.firstName} ${trial.player.lastName}`
    : 'Unknown Player'

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.rating < 1 || formData.rating > 10) {
      newErrors.rating = 'Rating must be between 1 and 10'
    }

    if (!formData.feedback.trim()) {
      newErrors.feedback = 'Feedback is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Guard: Ensure trial and tenant are available before submitting
    if (!trial?.tenantId) {
      setErrors({ submit: 'Trial or tenant information is missing. Please refresh the page.' })
      return
    }

    setIsSubmitting(true)

    try {
      const evaluationData: TrialEvaluationInput = {
        rating: formData.rating,
        feedback: formData.feedback.trim(),
        notes: formData.notes.trim() || null
      }

      await evaluateTrial.mutateAsync({
        trialId: trial.id,
        evaluation: evaluationData
      })

      // Reset form and close modal
      setFormData({ rating: 5, feedback: '', notes: '' })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to evaluate trial:', error)
      setErrors({ submit: 'Failed to submit evaluation. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ rating: 5, feedback: '', notes: '' })
      setErrors({})
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-xl font-bold text-white">Evaluate Trial</h2>
            <p className="text-sm text-white/70 mt-1">
              Provide rating and feedback for {playerName}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-white/40 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Rating (1-10)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex items-center gap-1 min-w-[60px]">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-lg font-bold text-white">{formData.rating}</span>
              </div>
            </div>
            {/* Rating scale reference */}
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>1 - Poor</span>
              <span>5 - Average</span>
              <span>10 - Excellent</span>
            </div>
            {errors.rating && (
              <p className="text-red-400 text-sm">{errors.rating}</p>
            )}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Feedback <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => handleInputChange('feedback', e.target.value)}
              placeholder="Provide detailed feedback on the player's performance..."
              rows={4}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
            />
            {errors.feedback && (
              <p className="text-red-400 text-sm">{errors.feedback}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional observations or recommendations..."
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-red-400 text-sm">{errors.submit}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
            >
              <FileText className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}