'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'
import { useRequestsQuery, type Request } from '../hooks/useRequestsQuery'
import { Plus, Building2, CheckCircle2, Download, Search, Filter, Sparkles } from 'lucide-react'
import { SmartClubSelector } from '@/components/ui/SmartClubSelector'
import { POSITION_MAPPINGS } from '@/lib/positions'
import { getActiveTransferWindow } from '@/lib/transfer-window/country-windows'
import dynamic from 'next/dynamic'
import { ParseWhatsAppModal } from './ParseWhatsAppModal'
import type { ParsedRequest } from './ParsedRequestsPreview'

// Lazy load CompactListView for better performance
const CompactListView = dynamic(() => import('@/components/ui/CompactListView').then(mod => ({ default: mod.CompactListView })), {
  loading: () => (
    <div className="space-y-2 animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
      ))}
    </div>
  )
})

export function RequestsPage() {
  const params = useParams()
  const tenant = params.tenant as string
  const { tenantId } = useTenantSlug()
  const queryClient = useQueryClient()

  // React Query for data fetching
  const { data: requests = [], isLoading: loading, error, refetch } = useRequestsQuery(tenantId || '')

  // Simplified state - only what we need
  const [showForm, setShowForm] = useState(false)
  const [showParseModal, setShowParseModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dealTypeFilter, setDealTypeFilter] = useState<string>('ALL')
  const [positionFilter, setPositionFilter] = useState<string>('ALL')
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [bulkStatusValue, setBulkStatusValue] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    club: '',
    country: '',
    league: '',
    position: '',
    status: 'OPEN' as 'OPEN' | 'IN_PROGRESS' | 'OFFER_SENT' | 'AGREEMENT' | 'COMPLETED' | 'CANCELLED',
    priority: 'MEDIUM' as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
    dealTypes: [] as string[],
    // Transfer fields (value + unit)
    transferFeeMin: { value: '', unit: 'MILLION' as 'THOUSAND' | 'MILLION' },
    transferFeeMax: { value: '', unit: 'MILLION' as 'THOUSAND' | 'MILLION' },
    // Loan fields (salary per week/month/year)
    loanSalary: { value: '', unit: 'WEEK' as 'WEEK' | 'MONTH' | 'YEAR' },
    // Free Agent fields (salary per week/month/year + bonus)
    freeAgentSalary: { value: '', unit: 'WEEK' as 'WEEK' | 'MONTH' | 'YEAR' },
    signOnBonus: { value: '', unit: 'MILLION' as 'THOUSAND' | 'MILLION' },
    // Transfer window dates
    windowOpenAt: '',
    windowCloseAt: ''
  })

  // Helper function to format and convert to EUR
  const formatAmountPreview = (value: string, unit: 'THOUSAND' | 'MILLION'): string => {
    if (!value || isNaN(parseFloat(value))) return ''

    const numValue = parseFloat(value)
    const multiplier = unit === 'MILLION' ? 1000000 : 1000
    const totalEUR = numValue * multiplier

    // Format with thousand separators
    return totalEUR.toLocaleString('sv-SE', { maximumFractionDigits: 0 })
  }

  // Helper to format salary preview (shows as EUR per selected period)
  const formatSalaryPreview = (value: string, unit: 'WEEK' | 'MONTH' | 'YEAR'): string => {
    if (!value || isNaN(parseFloat(value))) return ''

    const numValue = parseFloat(value)
    const period = unit === 'WEEK' ? '/week' : unit === 'MONTH' ? '/month' : '/year'

    return `${numValue.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} EUR${period}`
  }

  // Helper to convert to EUR for API
  const convertToEUR = (value: string, unit: 'THOUSAND' | 'MILLION'): number => {
    if (!value || isNaN(parseFloat(value))) return 0

    const numValue = parseFloat(value)
    const multiplier = unit === 'MILLION' ? 1000000 : 1000
    return numValue * multiplier
  }

  // Helper to convert salary to EUR per week for API (standardized storage)
  const convertSalaryToWeeklyEUR = (value: string, unit: 'WEEK' | 'MONTH' | 'YEAR'): number => {
    if (!value || isNaN(parseFloat(value))) return 0

    const numValue = parseFloat(value)

    // Convert everything to weekly salary
    if (unit === 'WEEK') return numValue
    if (unit === 'MONTH') return numValue * 12 / 52 // Monthly to weekly
    if (unit === 'YEAR') return numValue / 52 // Yearly to weekly

    return numValue
  }

  // Helper to convert EUR back to display format (for editing)
  const convertFromEUR = (eurValue: number | undefined): { value: string, unit: 'THOUSAND' | 'MILLION' } => {
    if (!eurValue || eurValue === 0) return { value: '', unit: 'MILLION' }

    // If value is >= 1M, show in millions
    if (eurValue >= 1000000) {
      return { value: (eurValue / 1000000).toString(), unit: 'MILLION' }
    }
    // Otherwise show in thousands
    return { value: (eurValue / 1000).toString(), unit: 'THOUSAND' }
  }

  // Helper to convert weekly EUR salary back to display format (for editing)
  const convertFromWeeklyEUR = (weeklyEUR: number | undefined): { value: string, unit: 'WEEK' | 'MONTH' | 'YEAR' } => {
    if (!weeklyEUR || weeklyEUR === 0) return { value: '', unit: 'WEEK' }

    // Always default to showing weekly
    return { value: weeklyEUR.toString(), unit: 'WEEK' }
  }

  // Automatically set transfer window when country is selected
  useEffect(() => {
    if (formData.country) {
      const activeWindow = getActiveTransferWindow(formData.country)

      if (activeWindow) {
        const { window } = activeWindow
        setFormData(prev => ({
          ...prev,
          windowOpenAt: window.openDate,
          windowCloseAt: window.closeDate
        }))

        console.log(`🗓️ Transfer window set for ${formData.country}:`, {
          type: window.name,
          open: window.openDate,
          close: window.closeDate,
          isActive: activeWindow.isActive
        })
      } else {
        console.warn(`⚠️ No transfer window found for ${formData.country}`)
      }
    }
  }, [formData.country])

  // Show loading if tenantId is not yet available
  if (!tenantId) {
    return (
      <div className="flex-1 relative">
        <div className="relative p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  // Simple filtering logic - search + status + dealType + position
  const filteredRequests = requests.filter(request => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = (
        request.title.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower) ||
        request.club.toLowerCase().includes(searchLower) ||
        (request.position && request.position.toLowerCase().includes(searchLower))
      )
      if (!matchesSearch) {
        return false
      }
    }

    // Status filter
    if (statusFilter !== 'ALL' && request.status !== statusFilter) {
      return false
    }

    // Deal Type filter (dealType can be comma-separated like "TRANSFER,LOAN")
    if (dealTypeFilter !== 'ALL') {
      const requestDealTypes = request.dealType?.split(',') || []
      if (!requestDealTypes.includes(dealTypeFilter)) {
        return false
      }
    }

    // Position filter
    if (positionFilter !== 'ALL' && request.position !== positionFilter) {
      return false
    }

    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tenantId) {
      alert('Tenant information is missing. Please refresh the page.')
      return
    }

    // Validate at least one deal type is selected
    if (formData.dealTypes.length === 0) {
      alert('Please select at least one deal type')
      return
    }

    // Validate deal type specific fields
    // Auto-generate title from position, deal types and club
    const positionName = POSITION_MAPPINGS[formData.position] || formData.position
    const dealTypeLabels = formData.dealTypes.map(dt =>
      dt === 'TRANSFER' ? 'Transfer' :
      dt === 'LOAN' ? 'Loan' : 'Free Agent'
    ).join('/')
    const autoTitle = `${positionName} (${dealTypeLabels}) - ${formData.club}`

    // Prepare data with converted EUR values
    const requestData: any = {
      title: autoTitle,
      description: formData.description,
      club: formData.club,
      country: formData.country,
      league: formData.league,
      position: formData.position,
      dealType: formData.dealTypes.join(','),
      windowOpenAt: formData.windowOpenAt,
      windowCloseAt: formData.windowCloseAt,
      // Convert amounts to EUR
      transferFeeMinEUR: convertToEUR(formData.transferFeeMin.value, formData.transferFeeMin.unit),
      transferFeeMaxEUR: convertToEUR(formData.transferFeeMax.value, formData.transferFeeMax.unit),
      loanSalaryEUR: convertSalaryToWeeklyEUR(formData.loanSalary.value, formData.loanSalary.unit),
      freeAgentSalaryEUR: convertSalaryToWeeklyEUR(formData.freeAgentSalary.value, formData.freeAgentSalary.unit),
      signOnBonusEUR: convertToEUR(formData.signOnBonus.value, formData.signOnBonus.unit)
    }

    // Include status and priority only when editing
    if (editingRequest) {
      requestData.status = formData.status
      requestData.priority = formData.priority
    }

    try {
      const { apiFetch } = await import('@/lib/api-config')

      // Determine if we're editing or creating
      const isEditing = !!editingRequest
      const url = isEditing
        ? `/api/requests/${editingRequest.id}?tenant=${tenantId}`
        : `/api/requests?tenant=${tenantId}`
      const method = isEditing ? 'PATCH' : 'POST'

      console.log('📤 Submitting request:', { url, method, requestData })

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(requestData)
      })

      console.log('📥 Response status:', response.status)

      const result = await response.json()
      console.log('📥 Response data:', result)

      if (result.success) {
        // Invalidate cache first (marks as stale), then refetch for instant UI update
        await queryClient.invalidateQueries({ queryKey: ['requests', tenantId] })
        await queryClient.refetchQueries({ queryKey: ['requests', tenantId] })

        // If editing and status was changed, reset filter to show all requests
        if (isEditing && editingRequest && formData.status !== editingRequest.status) {
          setStatusFilter('ALL')
        }

        setFormData({
          title: '',
          description: '',
          club: '',
          country: '',
          league: '',
          position: '',
          status: 'OPEN' as 'OPEN' | 'IN_PROGRESS' | 'OFFER_SENT' | 'AGREEMENT' | 'COMPLETED' | 'CANCELLED',
          priority: 'MEDIUM' as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
          dealTypes: [],
          transferFeeMin: { value: '', unit: 'MILLION' },
          transferFeeMax: { value: '', unit: 'MILLION' },
          loanSalary: { value: '', unit: 'WEEK' },
          freeAgentSalary: { value: '', unit: 'WEEK' },
          signOnBonus: { value: '', unit: 'MILLION' },
          windowOpenAt: '',
          windowCloseAt: ''
        })
        setEditingRequest(null)
        setShowForm(false)
        // ✅ NO ALERT NEEDED - form closes and request appears in list instantly
      } else {
        console.error('❌ Request failed:', result.error)
        alert(`Failed to ${isEditing ? 'update' : 'create'} request: ` + result.error)
      }
    } catch (error) {
      console.error('❌ Exception during request:', error)
      alert(`Error ${editingRequest ? 'updating' : 'creating'} request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Bulk selection functions
  const toggleRequestSelection = (requestId: string) => {
    const newSelected = new Set(selectedRequests)
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId)
    } else {
      newSelected.add(requestId)
    }
    setSelectedRequests(newSelected)
  }

  const clearSelection = () => {
    setSelectedRequests(new Set())
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedRequests.size === 0 || !tenantId) return

    console.log('🔄 Bulk update status:', { newStatus, count: selectedRequests.size, tenantId })

    try {
      const selectedIds = Array.from(selectedRequests)

      // INSTANT UI UPDATE: Update status in cache immediately (before API call)
      // DON'T invalidate before optimistic update - let it work on fresh cache
      queryClient.setQueryData(['requests', tenantId], (oldData: any) => {
        if (!oldData) return oldData
        return oldData.map((r: any) =>
          selectedIds.includes(r.id)
            ? { ...r, status: newStatus } // Keep all fields (windowCloseAt, etc), just update status
            : r
        )
      })
      console.log('✅ UI updated instantly (optimistic)')

      // Clear selection and reset UI immediately (user sees instant feedback)
      clearSelection()
      setStatusFilter('ALL')
      setBulkStatusValue('')

      // Use BULK endpoint (single API call instead of many)
      const response = await fetch(`/api/requests/bulk?tenant=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          requestIds: selectedIds,
          status: newStatus
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Bulk update failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Bulk backend update completed:', result.data)

      // Force fresh fetch from server (ignore stale cache)
      await queryClient.refetchQueries({
        queryKey: ['requests', tenantId],
        type: 'active'
      })
      console.log('✅ Fresh data loaded from server')

      // ✅ NO ALERT NEEDED - status changes visible instantly via optimistic update
    } catch (error) {
      console.error('❌ Bulk update failed:', error)
      // Revert optimistic update on error - force fresh fetch
      await queryClient.refetchQueries({
        queryKey: ['requests', tenantId],
        type: 'active'
      })
      alert(`Failed to update requests: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setBulkStatusValue('')
    }
  }

  const bulkDelete = async () => {
    if (selectedRequests.size === 0 || !tenantId) return

    const confirmed = confirm(`Delete ${selectedRequests.size} selected requests? This cannot be undone.`)
    if (!confirmed) return

    try {
      const selectedIds = Array.from(selectedRequests)

      // INSTANT UI UPDATE: Remove selected requests from cache immediately
      queryClient.setQueryData(['requests', tenantId], (oldData: any) => {
        if (!oldData) return oldData
        return oldData.filter((r: any) => !selectedIds.includes(r.id))
      })

      clearSelection()

      // Use BULK endpoint (single API call instead of many)
      const response = await fetch(`/api/requests/bulk?tenant=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          requestIds: selectedIds
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Bulk delete failed: ${response.status}`)
      }

      const result = await response.json()
      console.log(`✅ Bulk delete completed: ${selectedIds.length} requests (optimistic + backend)`)

      // ✅ NO REFETCH NEEDED - optimistic update is enough!
      // Cache stays updated since delete succeeded. No popup needed - UI already updated.
    } catch (error) {
      console.error('❌ Bulk delete failed:', error)

      // ROLLBACK: Refetch to restore if delete failed
      await queryClient.refetchQueries({
        queryKey: ['requests', tenantId],
        type: 'active'
      })

      alert('Failed to delete requests')
    }
  }

  const handleDeleteRequest = async (request: any) => {
    if (!tenantId) return

    const confirmed = confirm(`Delete "${request.title}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      // INSTANT UI UPDATE: Remove from cache immediately
      queryClient.setQueryData(['requests', tenantId], (oldData: any) => {
        if (!oldData) return oldData
        return oldData.filter((r: any) => r.id !== request.id)
      })

      // Make API call in background (no await needed - fire and forget)
      const { apiFetch } = await import('@/lib/api-config')
      await apiFetch(`/api/requests/${request.id}?tenant=${tenantId}`, { method: 'DELETE' })

      // ✅ NO REFETCH NEEDED - optimistic update is enough!
      // Cache stays updated since delete succeeded. No popup needed - UI already updated.
      console.log('✅ Request deleted (optimistic + backend)')
    } catch (error) {
      console.error('❌ Delete failed:', error)

      // ROLLBACK: Refetch to restore if delete failed
      await queryClient.refetchQueries({
        queryKey: ['requests', tenantId],
        type: 'active'
      })

      alert('Failed to delete request')
    }
  }

  const handleEditRequest = (request: Request) => {
    // Parse deal types from comma-separated string
    const dealTypes = request.dealType ? request.dealType.split(',') : []

    // Fill form with request data
    setFormData({
      title: request.title,
      description: request.description,
      club: request.club,
      country: request.country || '',
      league: request.league || '',
      position: request.position || '',
      status: request.status as any || 'OPEN',
      priority: request.priority as any || 'MEDIUM',
      dealTypes,
      transferFeeMin: convertFromEUR(request.transferFeeMinEUR),
      transferFeeMax: convertFromEUR(request.transferFeeMaxEUR),
      loanSalary: convertFromWeeklyEUR(request.loanSalaryEUR),
      freeAgentSalary: convertFromWeeklyEUR(request.freeAgentSalaryEUR),
      signOnBonus: convertFromEUR(request.signOnBonusEUR),
      windowOpenAt: request.windowOpenAt ? new Date(request.windowOpenAt).toISOString().split('T')[0] : '',
      windowCloseAt: request.windowCloseAt ? new Date(request.windowCloseAt).toISOString().split('T')[0] : ''
    })

    // Set editing mode and show form
    setEditingRequest(request)
    setShowForm(true)
  }

  // Bulk create requests from WhatsApp parsing
  const handleBulkCreateFromWhatsApp = async (parsedRequests: ParsedRequest[]) => {
    if (!tenantId || parsedRequests.length === 0) return

    console.log('🚀 Bulk creating', parsedRequests.length, 'requests from WhatsApp')

    const successfulCreates: Request[] = []
    const failedCreates: { request: ParsedRequest; error: string }[] = []

    // Create requests sequentially with progress
    for (let i = 0; i < parsedRequests.length; i++) {
      const parsed = parsedRequests[i]

      try {
        console.log(`📝 Creating request ${i + 1}/${parsedRequests.length}:`, parsed.club, parsed.position)

        const { apiFetch } = await import('@/lib/api-config')

        // Convert parsed request to API format
        const requestData = {
          title: `${parsed.club} - ${parsed.position}`,
          description: parsed.notes || '',
          club: parsed.club,
          country: parsed.country,
          league: parsed.league,
          position: parsed.position,
          status: parsed.status,
          priority: parsed.priority,
          dealType: parsed.dealType,
          windowCloseAt: parsed.windowCloseAt,
          // Add age requirements if present
          ...(parsed.ageMax && { ageMax: parsed.ageMax }),
          ...(parsed.birthYear && { birthYear: parsed.birthYear })
        }

        const response = await apiFetch(`/api/requests?tenant=${tenantId}`, {
          method: 'POST',
          body: JSON.stringify(requestData)
        })

        const result = await response.json()

        if (result.success) {
          successfulCreates.push(result.data)
          console.log(`✅ Request ${i + 1} created:`, result.data.id)
        } else {
          failedCreates.push({ request: parsed, error: result.error })
          console.error(`❌ Request ${i + 1} failed:`, result.error)
        }
      } catch (error) {
        failedCreates.push({
          request: parsed,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`❌ Request ${i + 1} exception:`, error)
      }
    }

    // Update cache with all successful creates
    if (successfulCreates.length > 0) {
      queryClient.setQueryData(['requests', tenantId], (oldData: Request[] | undefined) => {
        if (!oldData) return successfulCreates
        return [...successfulCreates, ...oldData]
      })
    }

    // Show results
    const message = `Created ${successfulCreates.length}/${parsedRequests.length} requests\n` +
      (failedCreates.length > 0 ? `Failed: ${failedCreates.length}` : '')

    if (failedCreates.length > 0) {
      console.error('Failed requests:', failedCreates)
      alert(message + '\n\nSee console for details.')
    } else {
      alert(message + ' ✅')
    }
  }

  // Export to CSV
  const exportToCSV = async () => {
    const timestamp = new Date().toISOString().split('T')[0]
    const { RequestExporter } = await import('@/lib/export/request-export')

    if (selectedRequests.size > 0) {
      const selectedData = requests.filter(r => selectedRequests.has(r.id))
      RequestExporter.exportToCSV(selectedData, `scout-requests-${timestamp}.csv`)
      clearSelection()
    } else {
      RequestExporter.exportToCSV(requests, `all-scout-requests-${timestamp}.csv`)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 relative">
        <div className="relative flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading requests...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <div className="relative p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Scout Requests</h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{filteredRequests.length} requests</span>
                    {(searchTerm || statusFilter !== 'ALL' || dealTypeFilter !== 'ALL' || positionFilter !== 'ALL') && filteredRequests.length !== requests.length && (
                      <span className="text-xs text-white/50">of {requests.length}</span>
                    )}
                  </div>
                  {selectedRequests.size > 0 && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{selectedRequests.size} selected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Mobile: Stack vertically, Desktop: Horizontal */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 md:px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-xs md:text-sm"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </button>
                <button
                  onClick={() => setShowParseModal(true)}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-xs md:text-sm"
                >
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Parse WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    if (showForm) {
                      setShowForm(false)
                      setEditingRequest(null)
                    } else {
                      setEditingRequest(null) // Reset editing mode when creating new
                      setShowForm(true)
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 md:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-xs md:text-sm"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  {showForm ? 'Cancel' : 'Add Request'}
                </button>
              </div>
            </div>

            {/* Filter Bar - Mobile: Stack vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <div className="flex-1 min-w-0 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search requests..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm md:text-base text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                />
              </div>

              {/* Filters - Mobile: Grid 2 columns, Desktop: Inline */}
              <div className="grid grid-cols-2 sm:flex gap-2 md:gap-3">
                {/* Deal Type Filter */}
                <select
                  value={dealTypeFilter}
                  onChange={(e) => setDealTypeFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-2 md:px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                >
                  <option value="ALL" className="bg-slate-800 text-white">All Deals</option>
                  <option value="TRANSFER" className="bg-slate-800 text-white">Transfer</option>
                  <option value="LOAN" className="bg-slate-800 text-white">Loan</option>
                  <option value="FREE_AGENT" className="bg-slate-800 text-white">Free</option>
                </select>

                {/* Position Filter */}
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-2 md:px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                >
                  <option value="ALL" className="bg-slate-800 text-white">All Pos</option>
                  {Object.entries(POSITION_MAPPINGS).map(([abbr, full]) => (
                    <option key={abbr} value={abbr} className="bg-slate-800 text-white">
                      {abbr} - {full}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="col-span-2 sm:col-span-1 bg-white/10 border border-white/20 rounded-lg px-2 md:px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                >
                  <option value="ALL" className="bg-slate-800 text-white">All Status</option>
                  <option value="OPEN" className="bg-slate-800 text-white">New</option>
                  <option value="IN_PROGRESS" className="bg-slate-800 text-white">In Progress</option>
                  <option value="OFFER_SENT" className="bg-slate-800 text-white">Offer Sent</option>
                  <option value="AGREEMENT" className="bg-slate-800 text-white">Agreement</option>
                  <option value="COMPLETED" className="bg-slate-800 text-white">Won</option>
                  <option value="CANCELLED" className="bg-slate-800 text-white">Lost</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add/Edit Request Form - Mobile Optimized */}
          {showForm && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  {editingRequest ? 'Edit Request' : 'Create New Request'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingRequest(null)
                  }}
                  className="text-white/60 hover:text-white transition-colors text-xl md:text-2xl"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                    required
                  >
                    <option value="" className="bg-slate-800 text-white">Select position...</option>
                    {Object.entries(POSITION_MAPPINGS).map(([abbr, full]) => (
                      <option key={abbr} value={abbr} className="bg-slate-800 text-white">
                        {abbr} - {full}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status & Priority - Only show when editing */}
                {editingRequest && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                      >
                        <option value="OPEN" className="bg-slate-800 text-white">New</option>
                        <option value="IN_PROGRESS" className="bg-slate-800 text-white">In Progress</option>
                        <option value="OFFER_SENT" className="bg-slate-800 text-white">Offer Sent</option>
                        <option value="AGREEMENT" className="bg-slate-800 text-white">Agreement</option>
                        <option value="COMPLETED" className="bg-slate-800 text-white">Won</option>
                        <option value="CANCELLED" className="bg-slate-800 text-white">Lost</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                      >
                        <option value="URGENT" className="bg-slate-800 text-white">Urgent</option>
                        <option value="HIGH" className="bg-slate-800 text-white">High</option>
                        <option value="MEDIUM" className="bg-slate-800 text-white">Medium</option>
                        <option value="LOW" className="bg-slate-800 text-white">Low</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Club */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Club *</label>
                  <SmartClubSelector
                    value={formData.club}
                    onChange={(club, country, league) => {
                      setFormData({
                        ...formData,
                        club,
                        country: country || '',
                        league: league || ''
                      })
                    }}
                    placeholder="Search for club..."
                    required
                  />
                </div>

                {/* Deal Type - Mobile: Stack vertically, Desktop: Horizontal */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Deal Type *</label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {[
                      { value: 'TRANSFER', label: 'Transfer' },
                      { value: 'LOAN', label: 'Loan' },
                      { value: 'FREE_AGENT', label: 'Free Agent' }
                    ].map((dealType) => (
                      <label
                        key={dealType.value}
                        className={`cursor-pointer transition-all duration-200 flex-1 text-center ${
                          formData.dealTypes.includes(dealType.value)
                            ? 'bg-blue-600/30 border-blue-400/50 text-white'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white'
                        } border rounded-lg px-3 md:px-4 py-2`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.dealTypes.includes(dealType.value)}
                          onChange={(e) => {
                            const newDealTypes = e.target.checked
                              ? [...formData.dealTypes, dealType.value]
                              : formData.dealTypes.filter(d => d !== dealType.value)
                            setFormData({ ...formData, dealTypes: newDealTypes })
                          }}
                          className="sr-only"
                        />
                        <span className="text-xs md:text-sm font-medium">{dealType.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.dealTypes.length === 0 && (
                    <p className="text-xs text-red-400 mt-1">Select at least one deal type</p>
                  )}
                </div>

                {/* Transfer-specific fields: Min-Max Fee - Mobile: Stack vertically */}
                {formData.dealTypes.includes('TRANSFER') && (
                  <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-semibold text-white mb-3">Transfer Details (all amounts in EUR)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Min Fee</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={formData.transferFeeMin.value}
                            onChange={(e) => setFormData({
                              ...formData,
                              transferFeeMin: { ...formData.transferFeeMin, value: e.target.value }
                            })}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                            placeholder="2.5"
                          />
                          <select
                            value={formData.transferFeeMin.unit}
                            onChange={(e) => setFormData({
                              ...formData,
                              transferFeeMin: { ...formData.transferFeeMin, unit: e.target.value as 'THOUSAND' | 'MILLION' }
                            })}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                          >
                            <option value="THOUSAND" className="bg-slate-800 text-white">Thousand</option>
                            <option value="MILLION" className="bg-slate-800 text-white">Million</option>
                          </select>
                        </div>
                        {formData.transferFeeMin.value && (
                          <p className="text-xs text-blue-300 mt-1">
                            = {formatAmountPreview(formData.transferFeeMin.value, formData.transferFeeMin.unit)} EUR
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Max Fee</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={formData.transferFeeMax.value}
                            onChange={(e) => setFormData({
                              ...formData,
                              transferFeeMax: { ...formData.transferFeeMax, value: e.target.value }
                            })}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                            placeholder="5"
                          />
                          <select
                            value={formData.transferFeeMax.unit}
                            onChange={(e) => setFormData({
                              ...formData,
                              transferFeeMax: { ...formData.transferFeeMax, unit: e.target.value as 'THOUSAND' | 'MILLION' }
                            })}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                          >
                            <option value="THOUSAND" className="bg-slate-800 text-white">Thousand</option>
                            <option value="MILLION" className="bg-slate-800 text-white">Million</option>
                          </select>
                        </div>
                        {formData.transferFeeMax.value && (
                          <p className="text-xs text-blue-300 mt-1">
                            = {formatAmountPreview(formData.transferFeeMax.value, formData.transferFeeMax.unit)} EUR
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loan-specific fields: Salary */}
                {formData.dealTypes.includes('LOAN') && (
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-semibold text-white mb-3">Loan Details (all amounts in EUR)</h3>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Salary</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="1"
                          value={formData.loanSalary.value}
                          onChange={(e) => setFormData({
                            ...formData,
                            loanSalary: { ...formData.loanSalary, value: e.target.value }
                          })}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-400 backdrop-blur-sm"
                          placeholder="50000"
                        />
                        <select
                          value={formData.loanSalary.unit}
                          onChange={(e) => setFormData({
                            ...formData,
                            loanSalary: { ...formData.loanSalary, unit: e.target.value as 'WEEK' | 'MONTH' | 'YEAR' }
                          })}
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400 backdrop-blur-sm"
                        >
                          <option value="WEEK" className="bg-slate-800 text-white">Week</option>
                          <option value="MONTH" className="bg-slate-800 text-white">Month</option>
                          <option value="YEAR" className="bg-slate-800 text-white">Year</option>
                        </select>
                      </div>
                      {formData.loanSalary.value && (
                        <p className="text-xs text-green-300 mt-1">
                          = {formatSalaryPreview(formData.loanSalary.value, formData.loanSalary.unit)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Free Agent-specific fields: Salary + Sign-on Bonus - Mobile: Stack vertically */}
                {formData.dealTypes.includes('FREE_AGENT') && (
                  <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-semibold text-white mb-3">Free Agent Details (all amounts in EUR)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Salary</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="1"
                            value={formData.freeAgentSalary.value}
                            onChange={(e) => setFormData({
                              ...formData,
                              freeAgentSalary: { ...formData.freeAgentSalary, value: e.target.value }
                            })}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
                            placeholder="80000"
                          />
                          <select
                            value={formData.freeAgentSalary.unit}
                            onChange={(e) => setFormData({
                              ...formData,
                              freeAgentSalary: { ...formData.freeAgentSalary, unit: e.target.value as 'WEEK' | 'MONTH' | 'YEAR' }
                            })}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
                          >
                            <option value="WEEK" className="bg-slate-800 text-white">Week</option>
                            <option value="MONTH" className="bg-slate-800 text-white">Month</option>
                            <option value="YEAR" className="bg-slate-800 text-white">Year</option>
                          </select>
                        </div>
                        {formData.freeAgentSalary.value && (
                          <p className="text-xs text-purple-300 mt-1">
                            = {formatSalaryPreview(formData.freeAgentSalary.value, formData.freeAgentSalary.unit)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Sign-on Bonus</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={formData.signOnBonus.value}
                            onChange={(e) => setFormData({
                              ...formData,
                              signOnBonus: { ...formData.signOnBonus, value: e.target.value }
                            })}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
                            placeholder="0.5"
                          />
                          <select
                            value={formData.signOnBonus.unit}
                            onChange={(e) => setFormData({
                              ...formData,
                              signOnBonus: { ...formData.signOnBonus, unit: e.target.value as 'THOUSAND' | 'MILLION' }
                            })}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
                          >
                            <option value="THOUSAND" className="bg-slate-800 text-white">Thousand</option>
                            <option value="MILLION" className="bg-slate-800 text-white">Million</option>
                          </select>
                        </div>
                        {formData.signOnBonus.value && (
                          <p className="text-xs text-purple-300 mt-1">
                            = {formatAmountPreview(formData.signOnBonus.value, formData.signOnBonus.unit)} EUR
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                    rows={3}
                    placeholder="Detailed requirements and preferences..."
                  />
                </div>
                {/* Submit Buttons - Mobile: Full width stack, Desktop: Inline */}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg text-sm md:text-base"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Create Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bulk Actions Toolbar - Mobile: Stack vertically, Desktop: Horizontal */}
          {selectedRequests.size > 0 && (
            <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl border border-blue-400/30 p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-white font-medium text-sm md:text-base">
                    {selectedRequests.size} request{selectedRequests.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <select
                    value={bulkStatusValue}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      console.log('📝 Dropdown changed:', newStatus)
                      setBulkStatusValue(newStatus)
                      if (newStatus) {
                        bulkUpdateStatus(newStatus)
                      }
                    }}
                    className="flex-1 sm:flex-none bg-blue-700/50 border border-blue-400/30 rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Change status...</option>
                    <option value="OPEN">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="OFFER_SENT">Offer Sent</option>
                    <option value="AGREEMENT">Agreement</option>
                    <option value="COMPLETED">Won</option>
                    <option value="CANCELLED">Lost</option>
                  </select>
                  <button
                    onClick={bulkDelete}
                    className="bg-red-600/80 hover:bg-red-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-colors whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List View */}
          <CompactListView
            requests={filteredRequests}
            onRequestSelect={toggleRequestSelection}
            selectedRequests={selectedRequests}
            onEdit={handleEditRequest}
            onDelete={handleDeleteRequest}
          />
        </div>
      </div>

      {/* Parse WhatsApp Modal */}
      <ParseWhatsAppModal
        isOpen={showParseModal}
        onClose={() => setShowParseModal(false)}
        onCreateRequests={handleBulkCreateFromWhatsApp}
        existingRequests={requests}
      />
    </div>
  )
}
