'use client'

import { Users, FileText, Calendar, TrendingUp, AlertTriangle, Clock, Target, Building2 } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { RecentActivityFeed } from './RecentActivityFeed'
import { Skeleton } from '@/components/ui/skeleton'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'

interface DashboardContentProps {
  tenant: string
}

export function DashboardContent({ tenant }: DashboardContentProps) {
  const { tenantId } = useTenantSlug()
  const { data: stats, isLoading, error } = useDashboardStats(tenantId || tenant || '')

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-white/60">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-400/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-lg font-medium mb-2 text-white">Failed to load dashboard</p>
          <p className="text-sm text-white/40">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border backdrop-blur-sm flex items-center gap-3 ${
                alert.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-400/20 text-yellow-300'
                  : alert.type === 'error'
                  ? 'bg-red-500/10 border-red-400/20 text-red-300'
                  : 'bg-blue-500/10 border-blue-400/20 text-blue-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Players */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-white/80">Total Players</h3>
            </div>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-white/10" />
            ) : (
              <div className="text-3xl font-bold text-white">{stats?.players.total || 0}</div>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-24 bg-white/10" />
            ) : (
              <p className="text-xs text-white/60">
                {stats?.players.growth !== undefined && stats.players.growth > 0 ? '+' : ''}
                {stats?.players.growth || 0}% from last month
              </p>
            )}
          </div>
        </div>

        {/* Active Requests */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-sm font-medium text-white/80">Active Requests</h3>
            </div>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-white/10" />
            ) : (
              <div className="text-3xl font-bold text-white">{stats?.requests.active || 0}</div>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-32 bg-white/10" />
            ) : (
              <p className="text-xs text-white/60">
                {stats?.requests.total || 0} total requests
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Trials */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-sm font-medium text-white/80">Upcoming Trials</h3>
            </div>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-white/10" />
            ) : (
              <div className="text-3xl font-bold text-white">{stats?.trials.next7Days || 0}</div>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-24 bg-white/10" />
            ) : (
              <p className="text-xs text-white/60">Next 7 days</p>
            )}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-white/80">Success Rate</h3>
            </div>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-white/10" />
            ) : (
              <div className="text-3xl font-bold text-white">{stats?.trials.successRate || 0}%</div>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-28 bg-white/10" />
            ) : (
              <p className="text-xs text-white/60">
                {stats?.trials.completed || 0} completed trials
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Transfer Windows */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-medium text-white/80">Transfer Windows</h3>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Active</span>
                <span className="text-white font-medium">{stats?.transferWindows.active || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Upcoming</span>
                <span className="text-white font-medium">{stats?.transferWindows.upcoming || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Expiring (7d)</span>
                <span className="text-yellow-400 font-medium">{stats?.transferWindows.expiring || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-sm font-medium text-white/80">Pending Tasks</h3>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-2/3 bg-white/10" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Trial Evaluations</span>
                <span className="text-white font-medium">{stats?.trials.pendingEvaluations || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Open Requests</span>
                <span className="text-white font-medium">{stats?.requests.byStatus?.OPEN || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-sm font-medium text-white/80">Top Countries</h3>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats?.requests.byCountry || {})
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([country, count]) => (
                  <div key={country} className="flex justify-between text-sm">
                    <span className="text-white/70">{country}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Activity + Welcome */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Feed */}
        <RecentActivityFeed tenantId={tenantId || tenant || ''} />

        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to {tenant} Scout Hub</h3>
            <p className="text-white/70">
              Your comprehensive scouting platform with real-time analytics and insights.
            </p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Player Management</h4>
                  <p className="text-xs text-white/60">Track and evaluate your scouted players</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Request Workflow</h4>
                  <p className="text-xs text-white/60">Manage incoming requests from clubs worldwide</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Trial Scheduling</h4>
                  <p className="text-xs text-white/60">Organize and evaluate player trials</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/50 text-center">
                Multi-tenant • Role-based access • Real-time analytics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}