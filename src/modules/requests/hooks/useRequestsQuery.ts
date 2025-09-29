'use client'

import { useQuery } from '@tanstack/react-query'

export interface Request {
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

// Mock data fallback for when API fails
function getMockRequests(): Request[] {
  return [{
    id: 'mock-1',
    title: 'Demo Request',
    description: 'This is a demo request while loading real data...',
    club: 'Demo FC',
    country: 'Demo Country',
    league: 'Demo League',
    position: 'Forward',
    status: 'OPEN',
    priority: 'MEDIUM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    windowOpenAt: new Date().toISOString(),
    windowCloseAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    graceDays: 3
  }]
}

async function fetchRequests(tenantId: string): Promise<Request[]> {
  const startTime = Date.now()

  try {
    const { apiFetch } = await import('@/lib/api-config')
    const response = await apiFetch(`/api/requests?tenant=${tenantId}`)

    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime
      console.log(`⚡ Requests API: Took ${duration}ms`)
    }

    if (!response.ok) {
      console.warn('🚨 Requests API failed:', response.status)
      return getMockRequests()
    }

    const result = await response.json()
    if (!result.success) {
      console.warn('Requests API returned error, using fallback data:', result.error)
      return getMockRequests()
    }

    return result.data || []
  } catch (error) {
    console.warn('Requests API fetch failed, using fallback data:', error)
    return getMockRequests()
  }
}

export function useRequestsQuery(tenantId: string) {
  return useQuery({
    queryKey: ['requests', tenantId],
    queryFn: () => fetchRequests(tenantId),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes (same as dashboard)
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 0, // No retries - use fallback immediately for speed
    enabled: !!tenantId,
    throwOnError: false, // Don't throw errors, let fallback handle it
    refetchOnWindowFocus: false, // Avoid unnecessary refetches
    refetchOnReconnect: false, // Don't refetch when reconnecting
    refetchOnMount: false, // Use cache if available
  })
}

// Helper hook for filtered requests
export function useFilteredRequests(
  tenantId: string,
  filters: {
    search?: string
    status?: string[]
    priority?: string[]
    activeView?: string
  } = {}
) {
  const { data: requests, ...rest } = useRequestsQuery(tenantId)

  const filteredRequests = (requests || []).filter(request => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableText = `${request.title} ${request.description} ${request.club} ${request.position || ''}`.toLowerCase()
      if (!searchableText.includes(searchLower)) return false
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(request.status)) return false
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(request.priority)) return false
    }

    // View-specific filters
    if (filters.activeView) {
      switch (filters.activeView) {
        case 'inbox':
          return ['OPEN', 'IN_PROGRESS'].includes(request.status)
        case 'archived':
          return ['COMPLETED', 'CANCELLED'].includes(request.status)
        case 'expired':
          return request.windowCloseAt && new Date(request.windowCloseAt) < new Date()
        default:
          return true
      }
    }

    return true
  })

  return {
    data: filteredRequests,
    totalCount: requests?.length || 0,
    filteredCount: filteredRequests.length,
    ...rest
  }
}