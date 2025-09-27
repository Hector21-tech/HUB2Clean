'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'
import { Plus, Building2, Target, Calendar, ChevronRight, Clock, AlertCircle, CheckCircle2, Search, Filter, Download, Grid, List, Menu, X, MapPin } from 'lucide-react'
import { WindowBadge } from '@/components/ui/WindowBadge'
import { AdvancedFilters } from '@/components/ui/AdvancedFilters'
import { KanbanBoard } from '@/components/ui/KanbanBoard'
import { SwimlaneBoardView } from '@/components/ui/SwimlaneBoardView'
import { CompactListView } from '@/components/ui/CompactListView'
import { SmartClubSelector } from '@/components/ui/SmartClubSelector'
import { SavedViewsSidebar, type SavedView } from '@/components/ui/SavedViewsSidebar'
import { FilterChipsBar, type FilterChip } from '@/components/ui/FilterChipsBar'
import { RequestExporter } from '@/lib/export/request-export'

interface Request {
  id: string
  title: string
  description: string
  club: string
  country?: string
  league?: string
  position: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  windowOpenAt?: string | null
  windowCloseAt?: string | null
  deadline?: string | null
  graceDays?: number
}

export function RequestsPage() {
  const params = useParams()
  const tenant = params.tenant as string
  const { tenantId } = useTenantSlug()

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creatingTestData, setCreatingTestData] = useState(false)
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState<SavedView>('board')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filterChips, setFilterChips] = useState<FilterChip[]>([])
  const [advancedFilters, setAdvancedFilters] = useState({
    search: '',
    status: [] as string[],
    priority: [] as string[],
    positions: [] as string[],
    clubs: [] as string[],
    countries: [] as string[],
    dateRange: { from: '', to: '' },
    windowStatus: [] as string[]
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    club: '',
    country: '',
    league: '',
    position: ''
  })

  // Show loading if tenantId is not yet available - AFTER all hooks
  if (!tenantId) {
    return (
      <div className="flex-1 bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] relative">
        {/* Ultra-deep ocean effect with radial gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 to-transparent pointer-events-none"></div>
        <div className="relative p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate request counts for sidebar
  const requestCounts = {
    total: requests.length,
    inbox: requests.filter(r => ['OPEN', 'IN_PROGRESS'].includes(r.status)).length,
    openNow: requests.filter(r => r.windowOpenAt && new Date(r.windowOpenAt) <= new Date()).length,
    closesSoon: requests.filter(r => r.windowCloseAt && new Date(r.windowCloseAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
    opensSoon: requests.filter(r => r.windowOpenAt && new Date(r.windowOpenAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(r.windowOpenAt) > new Date()).length,
    expired: requests.filter(r => r.windowCloseAt && new Date(r.windowCloseAt) < new Date()).length,
    archived: requests.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status)).length
  }

  // Advanced filtering logic
  const filteredRequests = requests.filter(request => {
    // Debug logging
    console.log('Filtering request:', request.title, 'Status:', request.status, 'Priority:', request.priority, 'Active View:', activeView)

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
        console.log('Filtered out by search:', request.title)
        return false
      }
    }

    // Filter chips
    for (const chip of filterChips) {
      switch (chip.type) {
        case 'position':
          if (request.position !== chip.value) {
            console.log('Filtered out by position chip:', request.title)
            return false
          }
          break
        case 'club':
          if (request.club.toLowerCase() !== chip.value.toLowerCase()) {
            console.log('Filtered out by club chip:', request.title)
            return false
          }
          break
        case 'country':
          // This would need additional data in the request model
          break
        case 'window':
          // Window status filtering logic would go here
          break
      }
    }

    // View-specific filtering - FIXED: Board and List views show all requests
    switch (activeView) {
      case 'board':
      case 'list':
        console.log('Board/List view - showing all requests:', request.title)
        return true
      case 'inbox':
        const isInbox = ['OPEN', 'IN_PROGRESS'].includes(request.status)
        if (!isInbox) console.log('Filtered out by inbox view:', request.title, request.status)
        return isInbox
      case 'archive':
        const isArchive = ['COMPLETED', 'CANCELLED'].includes(request.status)
        if (!isArchive) console.log('Filtered out by archive view:', request.title, request.status)
        return isArchive
      case 'open-now':
        const isOpenNow = request.windowOpenAt && new Date(request.windowOpenAt) <= new Date()
        if (!isOpenNow) console.log('Filtered out by open-now view:', request.title)
        return isOpenNow
      case 'closes-soon':
        const isClosesSoon = request.windowCloseAt && new Date(request.windowCloseAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        if (!isClosesSoon) console.log('Filtered out by closes-soon view:', request.title)
        return isClosesSoon
      case 'opens-soon':
        const isOpensSoon = request.windowOpenAt && new Date(request.windowOpenAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(request.windowOpenAt) > new Date()
        if (!isOpensSoon) console.log('Filtered out by opens-soon view:', request.title)
        return isOpensSoon
      case 'expired':
        const isExpired = request.windowCloseAt && new Date(request.windowCloseAt) < new Date()
        if (!isExpired) console.log('Filtered out by expired view:', request.title)
        return isExpired
      default:
        console.log('Default view - showing request:', request.title)
        return true
    }
  })

  // Debug: Log final results
  console.log('Total requests:', requests.length)
  console.log('Filtered requests:', filteredRequests.length)
  console.log('Active view:', activeView)
  console.log('Search term:', searchTerm)
  console.log('Filter chips:', filterChips)

  // Fetch requests
  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const { apiFetch } = await import('@/lib/api-config')
      const response = await apiFetch(`/api/requests?tenant=${tenantId}`)
      const result = await response.json()

      if (result.success) {
        setRequests(result.data)
      } else {
        console.error('Failed to fetch requests')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Guard: Ensure tenant is available before submitting
    if (!tenantId) {
      alert('Tenant information is missing. Please refresh the page.')
      return
    }

    try {
      const { apiFetch } = await import('@/lib/api-config')
      const response = await apiFetch(`/api/requests?tenant=${tenantId}`, {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setRequests([result.data, ...requests])
        setFormData({ title: '', description: '', club: '', country: '', league: '', position: '' })
        setShowForm(false)
        alert('Request created successfully!')
      } else {
        alert('Failed to create request: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Error creating request')
    }
  }

  const createTestData = async () => {
    try {
      setCreatingTestData(true)

      const { apiFetch } = await import('@/lib/api-config')
      const response = await apiFetch('/api/test-window-data', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        alert(`Test data created! ${result.data.requestsCreated} requests with different window scenarios added.`)
        fetchRequests() // Refresh the list
      } else {
        alert('Failed to create test data: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating test data:', error)
      alert('Error creating test data')
    } finally {
      setCreatingTestData(false)
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
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAllRequests = () => {
    const allIds = new Set(requests.map(r => r.id))
    setSelectedRequests(allIds)
    setShowBulkActions(true)
  }

  const clearSelection = () => {
    setSelectedRequests(new Set())
    setShowBulkActions(false)
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedRequests.size === 0) return

    try {
      const updatePromises = Array.from(selectedRequests).map(requestId =>
        (async () => {
          const { apiFetch } = await import('@/lib/api-config')
          return apiFetch(`/api/requests/${requestId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          })
        })()
      )

      await Promise.all(updatePromises)

      // Update local state
      setRequests(requests.map(request =>
        selectedRequests.has(request.id)
          ? { ...request, status: newStatus }
          : request
      ))

      clearSelection()
      alert(`Updated ${selectedRequests.size} requests to ${newStatus}`)
    } catch (error) {
      console.error('Error updating requests:', error)
      alert('Failed to update requests')
    }
  }

  const bulkDelete = async () => {
    if (selectedRequests.size === 0) return

    const confirmed = confirm(`Delete ${selectedRequests.size} selected requests? This cannot be undone.`)
    if (!confirmed) return

    try {
      const deletePromises = Array.from(selectedRequests).map(requestId =>
        (async () => {
          const { apiFetch } = await import('@/lib/api-config')
          return apiFetch(`/api/requests/${requestId}`, { method: 'DELETE' })
        })()
      )

      await Promise.all(deletePromises)

      // Update local state
      setRequests(requests.filter(request => !selectedRequests.has(request.id)))
      clearSelection()
      alert(`Deleted ${selectedRequests.size} requests`)
    } catch (error) {
      console.error('Error deleting requests:', error)
      alert('Failed to delete requests')
    }
  }

  // Export functions
  const exportSelected = (format: 'csv' | 'json' | 'summary') => {
    const selectedRequestsData = requests.filter(r => selectedRequests.has(r.id))
    const timestamp = new Date().toISOString().split('T')[0]

    switch (format) {
      case 'csv':
        RequestExporter.exportToCSV(selectedRequestsData, `scout-requests-${timestamp}.csv`)
        break
      case 'json':
        RequestExporter.exportToJSON(selectedRequestsData, `scout-requests-${timestamp}.json`)
        break
      case 'summary':
        RequestExporter.exportSummaryReport(selectedRequestsData, `scout-requests-summary-${timestamp}.txt`)
        break
    }

    clearSelection()
  }

  const exportAll = (format: 'csv' | 'json' | 'summary') => {
    const timestamp = new Date().toISOString().split('T')[0]

    switch (format) {
      case 'csv':
        RequestExporter.exportToCSV(requests, `all-scout-requests-${timestamp}.csv`)
        break
      case 'json':
        RequestExporter.exportToJSON(requests, `all-scout-requests-${timestamp}.json`)
        break
      case 'summary':
        RequestExporter.exportSummaryReport(requests, `all-scout-requests-summary-${timestamp}.txt`)
        break
    }
  }

  // Filter chip management
  const handleChipAdd = (chip: FilterChip) => {
    setFilterChips(prev => [...prev, chip])
  }

  const handleChipRemove = (chipId: string) => {
    setFilterChips(prev => prev.filter(chip => chip.id !== chipId))
  }

  // View change handler
  const handleViewChange = (view: SavedView) => {
    setActiveView(view)
    // Clear selection when changing views
    clearSelection()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] relative">
        {/* Ultra-deep ocean effect with radial gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 to-transparent pointer-events-none"></div>
        <div className="relative flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading requests...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] relative">
      {/* Ultra-deep ocean effect with radial gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 to-transparent pointer-events-none"></div>
      <div className="relative">
        {/* Three-Panel Layout */}
        <div className="flex min-h-screen">
          {/* Left Sidebar */}
          <SavedViewsSidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            requestCounts={requestCounts}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 lg:relative absolute z-50 ${
              sidebarCollapsed ? 'lg:block hidden' : 'lg:block'
            }`}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with Search and Actions */}
            <div className="border-b border-white/10 bg-gradient-to-r from-[#020617]/60 via-[#0c1532]/50 to-[#1e3a8a]/40 backdrop-blur-xl">
              <div className="p-4 space-y-4">
                {/* Mobile sidebar toggle */}
                <div className="flex items-center justify-between lg:hidden">
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {sidebarCollapsed ? <Menu className="w-5 h-5 text-white" /> : <X className="w-5 h-5 text-white" />}
                  </button>
                </div>

                {/* Title and Stats */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                      {activeView === 'board' ? 'Board (CRM)' :
                       activeView === 'list' ? 'List View' :
                       activeView === 'calendar' ? 'Calendar' :
                       activeView === 'archive' ? 'Archive' :
                       activeView === 'inbox' ? 'Inbox' :
                       'Scout Requests'}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{filteredRequests.length} requests</span>
                        {(searchTerm || filterChips.length > 0) && filteredRequests.length !== requests.length && (
                          <span className="text-xs text-white/50">of {requests.length}</span>
                        )}
                      </div>
                      {selectedRequests.size > 0 && (
                        <div className="flex items-center gap-2 text-blue-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{selectedRequests.size} selected</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={createTestData}
                      disabled={creatingTestData}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm"
                    >
                      {creatingTestData ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span>🧪</span>
                      )}
                      Test Data
                    </button>

                    <div className="relative group">
                      <button className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm">
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                        <button
                          onClick={() => exportAll('csv')}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg whitespace-nowrap text-sm"
                        >
                          CSV File ({requests.length} requests)
                        </button>
                        <button
                          onClick={() => exportAll('json')}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 whitespace-nowrap text-sm"
                        >
                          JSON File ({requests.length} requests)
                        </button>
                        <button
                          onClick={() => exportAll('summary')}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg whitespace-nowrap text-sm"
                        >
                          Summary Report ({requests.length} requests)
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {showForm ? 'Cancel' : 'Add'}
                    </button>
                  </div>
                </div>

                {/* Filter Chips Bar */}
                <FilterChipsBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  activeChips={filterChips}
                  onChipAdd={handleChipAdd}
                  onChipRemove={handleChipRemove}
                  onAdvancedFilters={() => setShowAdvancedFilters(true)}
                  suggestions={{
                    countries: [],
                    positions: Array.from(new Set(requests.map(r => r.position).filter((p): p is string => Boolean(p)))),
                    clubs: Array.from(new Set(requests.map(r => r.club))),
                    windowStatuses: []
                  }}
                />
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {/* Add Request Form */}
              {showForm && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Create New Request</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Title *</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                          placeholder="e.g., Young striker for academy"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Club *</label>
                        <SmartClubSelector
                          value={formData.club}
                          onChange={(club, country, league) => {
                            console.log('Club selected:', { club, country, league })
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
                        {/* Show auto-populated country */}
                        {formData.country && (
                          <div className="mt-2 text-xs text-white/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>Country: {formData.country}</span>
                            {formData.league && <span>• League: {formData.league}</span>}
                          </div>
                        )}
                      </div>
                    </div>
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
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Create Request
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Bulk Actions Toolbar */}
              {showBulkActions && (
                <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl border border-blue-400/30 p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-medium">
                        {selectedRequests.size} request{selectedRequests.size !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-blue-300 hover:text-white text-sm transition-colors"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        onChange={(e) => e.target.value && bulkUpdateStatus(e.target.value)}
                        className="bg-blue-700/50 border border-blue-400/30 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        defaultValue=""
                      >
                        <option value="">Change status...</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <button
                        onClick={bulkDelete}
                        className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content Based on Active View */}
              {activeView === 'board' ? (
                <SwimlaneBoardView
                  requests={filteredRequests}
                  onRequestUpdate={async (requestId, newStatus, newPriority) => {
                    console.log('Main page - onRequestUpdate:', { requestId, newStatus, newPriority })

                    try {
                      // Prepare update data
                      const updateData: any = { status: newStatus }
                      if (newPriority) {
                        updateData.priority = newPriority
                      }

                      console.log('Sending API update:', updateData)

                      const { apiFetch } = await import('@/lib/api-config')
                      const response = await apiFetch(`/api/requests/${requestId}`, {
                        method: 'PATCH',
                        body: JSON.stringify(updateData)
                      })

                      if (response.ok) {
                        // Update local state with new status and priority
                        setRequests(requests.map(request =>
                          request.id === requestId
                            ? {
                                ...request,
                                status: newStatus,
                                ...(newPriority && { priority: newPriority })
                              }
                            : request
                        ))
                        console.log('Local state updated successfully')
                      } else {
                        console.error('API update failed:', response.status, response.statusText)
                      }
                    } catch (error) {
                      console.error('Error updating request:', error)
                    }
                  }}
                  onRequestSelect={toggleRequestSelection}
                  selectedRequests={selectedRequests}
                />
              ) : activeView === 'list' ? (
                <CompactListView
                  requests={filteredRequests}
                  onRequestSelect={toggleRequestSelection}
                  selectedRequests={selectedRequests}
                />
              ) : activeView === 'calendar' ? (
                <div className="flex items-center justify-center h-96 text-white/60">
                  <div className="text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Calendar View</p>
                    <p className="text-sm text-white/40">Coming soon - Timeline view of requests</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-white/60">
                  <div className="text-center">
                    <Target className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      {activeView === 'archive' ? 'Archive' :
                       activeView === 'inbox' ? 'Inbox' :
                       'Scout Requests'}
                    </p>
                    <p className="text-sm text-white/40">
                      {filteredRequests.length === 0 ? 'No requests found' : `${filteredRequests.length} requests`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters Modal */}
        {showAdvancedFilters && (
          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={(newFilters) => {
              setAdvancedFilters(newFilters)
              // TODO: Apply filters to requests
            }}
            onClose={() => setShowAdvancedFilters(false)}
            availableClubs={Array.from(new Set(requests.map(r => r.club).filter(Boolean)))}
            availableCountries={[]}
          />
        )}
      </div>
    </div>
  )
}