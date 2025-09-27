'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, FileText, Clock, Type } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useCreateEvent } from '../hooks/useCalendarEvents'
import { CreateEventInput, EventType, EVENT_TYPE_CONFIG } from '../types/calendar'
import { apiFetch } from '@/lib/api-config'

interface CreateEventModalProps {
  tenantId: string
  initialDate?: Date | null
  onClose: () => void
}

export function CreateEventModal({
  tenantId,
  initialDate,
  onClose
}: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'OTHER' as EventType,
    isAllDay: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createEvent = useCreateEvent(tenantId)

  // Initialize form with default values
  useEffect(() => {
    if (initialDate) {
      // Set default start time to the initial date at current hour
      const start = new Date(initialDate)
      start.setMinutes(0, 0, 0) // Round to hour

      // Set default end time to 1 hour later
      const end = new Date(start)
      end.setHours(end.getHours() + 1)

      setFormData(prev => ({
        ...prev,
        startTime: start.toISOString().slice(0, 16), // Format for datetime-local
        endTime: end.toISOString().slice(0, 16)
      }))
    }
  }, [initialDate])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAllDayChange = (isAllDay: boolean) => {
    setFormData(prev => {
      if (isAllDay) {
        // For all-day events, set to start of day and next day
        const start = new Date(prev.startTime || new Date())
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)

        return {
          ...prev,
          isAllDay,
          startTime: start.toISOString().slice(0, 16),
          endTime: end.toISOString().slice(0, 16)
        }
      } else {
        // For timed events, set reasonable default times
        const start = new Date(prev.startTime || new Date())
        start.setHours(9, 0, 0, 0) // 9:00 AM
        const end = new Date(start)
        end.setHours(10, 0, 0, 0) // 10:00 AM

        return {
          ...prev,
          isAllDay,
          startTime: start.toISOString().slice(0, 16),
          endTime: end.toISOString().slice(0, 16)
        }
      }
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime)
      const end = new Date(formData.endTime)

      // Validate dates are not NaN
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        newErrors.startTime = 'Please enter valid dates'
      } else {
        // Validate year range (prevent "åååååå" input)
        const startYear = start.getFullYear()
        const endYear = end.getFullYear()

        if (startYear < 2000 || startYear > 2100) {
          newErrors.startTime = 'Year must be between 2000 and 2100'
        }

        if (endYear < 2000 || endYear > 2100) {
          newErrors.endTime = 'Year must be between 2000 and 2100'
        }

        // Validate time order
        if (start >= end) {
          newErrors.endTime = 'End time must be after start time'
        }

        // Validate not too far in the past
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        if (start < oneDayAgo) {
          newErrors.startTime = 'Event cannot be more than 1 day in the past'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const eventData: CreateEventInput = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        location: formData.location.trim() || undefined,
        type: formData.type,
        isAllDay: formData.isAllDay
      }

      const result = await createEvent.mutateAsync(eventData)

      // Show success message if there are conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        console.log('Event created with conflicts:', result.conflicts)
        // Could show a toast notification here
      }

      onClose()
    } catch (error) {
      console.error('Failed to create event:', error)
      setErrors({ submit: 'Failed to create event. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prepare event type options for SearchableSelect
  const eventTypeOptions = Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => ({
    value: type,
    label: config.label,
    icon: config.icon
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Create Event</h2>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white/80 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Type className="w-4 h-4" />
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="Enter event title"
                disabled={isSubmitting}
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Event Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Calendar className="w-4 h-4" />
                Event Type *
              </label>
              <SearchableSelect
                options={eventTypeOptions}
                value={formData.type}
                onChange={(value) => handleInputChange('type', value || 'OTHER')}
                placeholder="Select event type"
                disabled={isSubmitting}
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.isAllDay}
                onChange={(e) => handleAllDayChange(e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-white/5 border border-white/20 rounded focus:ring-blue-500/50"
                disabled={isSubmitting}
              />
              <label htmlFor="allDay" className="text-sm text-white/80">
                All day event
              </label>
            </div>

            {/* Start Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Clock className="w-4 h-4" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                min="2000-01-01T00:00"
                max="2100-12-31T23:59"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                disabled={isSubmitting}
              />
              {errors.startTime && <p className="text-red-400 text-sm mt-1">{errors.startTime}</p>}
            </div>

            {/* End Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Clock className="w-4 h-4" />
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                min="2000-01-01T00:00"
                max="2100-12-31T23:59"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                disabled={isSubmitting}
              />
              {errors.endTime && <p className="text-red-400 text-sm mt-1">{errors.endTime}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="Enter location (optional)"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <FileText className="w-4 h-4" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                placeholder="Enter event description (optional)"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}