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

async function fetchDashboardStats(tenantId: string, fast = true): Promise<DashboardStats> {
  const startTime = Date.now()

  try {
    // Use fast mode by default for instant loading
    const url = `/api/dashboard/stats?tenant=${tenantId}${fast ? '&fast=1' : ''}`

    const response = await fetch(url)

    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime
      console.log(`⚡ Dashboard API: ${fast ? 'Fast' : 'Full'} mode took ${duration}ms`)
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
    queryFn: () => fetchDashboardStats(tenantId, true), // Use fast mode
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes (longer)
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