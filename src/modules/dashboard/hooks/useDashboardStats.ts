'use client'

import { useQuery } from '@tanstack/react-query'

export interface DashboardStats {
  overview: {
    totalPlayers: number
    totalRequests: number
    totalTrials: number
    successRate: number
  }
  players: {
    total: number
    thisMonth: number
    growth: number
    byPosition: Record<string, number>
    recent: Array<{
      id: string
      firstName: string
      lastName: string
      position: string | null
      club: string | null
      rating: number | null
      createdAt: string
    }>
  }
  requests: {
    total: number
    active: number
    byStatus: Record<string, number>
    byCountry: Record<string, number>
    recent: Array<{
      id: string
      title: string
      club: string
      country: string | null
      status: string
      priority: string
      createdAt: string
    }>
  }
  trials: {
    total: number
    upcoming: number
    completed: number
    pendingEvaluations: number
    next7Days: number
    successRate: number
    recent: Array<{
      id: string
      scheduledAt: string
      location: string | null
      status: string
      rating: number | null
      createdAt: string
      player: {
        firstName: string
        lastName: string
        position: string | null
      } | null
    }>
  }
  transferWindows: {
    active: number
    upcoming: number
    expiring: number
  }
  alerts: Array<{
    type: 'info' | 'warning' | 'error'
    message: string
  }>
  lastUpdated: string
}

// Mock data fallback for when API fails
function getMockDashboardStats(): DashboardStats {
  return {
    overview: {
      totalPlayers: 0,
      totalRequests: 0,
      totalTrials: 0,
      successRate: 0
    },
    players: {
      total: 0,
      thisMonth: 0,
      growth: 0,
      byPosition: {},
      recent: []
    },
    requests: {
      total: 0,
      active: 0,
      byStatus: {},
      byCountry: {},
      recent: []
    },
    trials: {
      total: 0,
      upcoming: 0,
      completed: 0,
      pendingEvaluations: 0,
      next7Days: 0,
      successRate: 0,
      recent: []
    },
    transferWindows: {
      active: 0,
      upcoming: 0,
      expiring: 0
    },
    alerts: [{
      type: 'info',
      message: 'Dashboard in demo mode - create test data to see real statistics'
    }],
    lastUpdated: new Date().toISOString()
  }
}

async function fetchDashboardStats(tenantId: string): Promise<DashboardStats> {
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DASHBOARD === '1') {
    console.log('🔍 Dashboard API: Fetching stats for tenant:', tenantId)
  }
  try {
    const url = `/api/dashboard/stats?tenant=${tenantId}`

    const response = await fetch(url)

    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DASHBOARD === '1') {
      console.log('🔍 Dashboard API: Response status:', response.status, response.statusText)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('🚨 Dashboard API failed:', response.status, errorText)
      return getMockDashboardStats()
    }

    const result = await response.json()
    if (!result.success) {
      console.warn('Dashboard API returned error, using fallback data:', result.error)
      return getMockDashboardStats()
    }

    return result.data
  } catch (error) {
    console.warn('Dashboard API fetch failed, using fallback data:', error)
    return getMockDashboardStats()
  }
}

export function useDashboardStats(tenantId: string) {
  return useQuery({
    queryKey: ['dashboard-stats', tenantId],
    queryFn: () => fetchDashboardStats(tenantId),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 20000, // Consider data stale after 20 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Reduce retry attempts to fail faster and use fallback
    retryDelay: 1000, // Quick retry then fallback
    enabled: !!tenantId,
    throwOnError: false, // Don't throw errors, let fallback handle it
    refetchOnWindowFocus: false, // Avoid unnecessary refetches
  })
}

// Helper hook for specific dashboard sections
export function useDashboardSection(tenantId: string, section: keyof DashboardStats) {
  const { data, ...rest } = useDashboardStats(tenantId)
  return {
    data: data?.[section],
    ...rest
  }
}

// Hook for alerts specifically
export function useDashboardAlerts(tenantId: string) {
  const { data, ...rest } = useDashboardStats(tenantId)
  return {
    alerts: data?.alerts || [],
    hasAlerts: (data?.alerts?.length || 0) > 0,
    ...rest
  }
}