'use client'

import { useTenantSlug } from '@/lib/hooks/useTenantSlug'
import { DashboardContent } from '@/modules/dashboard/components/dashboard-content'

export default function TenantDashboard() {
  const { tenantSlug, tenantId } = useTenantSlug()

  // Show loading if tenant info is not available yet
  if (!tenantSlug) {
    return (
      <div className="flex-1 bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 to-transparent pointer-events-none"></div>
        <div className="relative p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/10 rounded w-1/4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] relative">
      {/* Ultra-deep ocean effect with radial gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 to-transparent pointer-events-none"></div>

      <div className="relative p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {tenantSlug} Dashboard
                </h1>
                <p className="text-white/70">
                  Welcome to your comprehensive scouting platform
                  {tenantId && <span className="text-sm text-white/50 ml-2">({tenantId})</span>}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Dashboard Content */}
          <DashboardContent tenant={tenantSlug} />
        </div>
      </div>
    </div>
  )
}