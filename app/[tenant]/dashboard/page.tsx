'use client'

import { useTenantSlug } from '@/lib/hooks/useTenantSlug'

export default function TenantDashboard() {
  const { tenantSlug, tenantId } = useTenantSlug()

  // Show loading if tenant info is not available yet
  if (!tenantSlug) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6 pt-0">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            {tenantSlug} Dashboard
          </h3>
        </div>
        <div className="p-6 pt-0">
          <p className="text-lg">
            Welcome to <span className="font-bold text-blue-600">{tenantSlug}</span> organization!
            {tenantId && <span className="text-sm text-gray-500 ml-2">({tenantId})</span>}
          </p>
          <p className="text-muted-foreground mt-2">
            Use the navigation above to access Players, Requests, Trials, and Calendar.
          </p>
        </div>
      </div>
    </div>
  )
}