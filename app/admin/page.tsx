'use client'

export default function AdminDashboard() {
  // Placeholder metrics - will be replaced with real data later
  const metrics = [
    { label: 'Total Tenants', value: '--', description: 'Organizations using the platform' },
    { label: 'Active Users', value: '--', description: 'Users active in last 30 days' },
    { label: 'Total Players', value: '--', description: 'Player profiles across all tenants' },
    { label: 'API Calls Today', value: '--', description: 'Platform API usage today' },
    { label: 'Storage Used', value: '--', description: 'Total file storage consumption' },
    { label: 'System Health', value: 'OK', description: 'Overall platform status' }
  ]

  const recentActivity = [
    { type: 'tenant', message: 'New tenant registered', time: 'Coming Soon' },
    { type: 'user', message: 'User management logs', time: 'Coming Soon' },
    { type: 'system', message: 'System events tracking', time: 'Coming Soon' }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-gray-900">System Overview</h1>
        <p className="text-gray-600 mt-1">Monitor platform health and usage metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Activity tracking will be implemented in Phase 2</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">System Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Services</span>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">File Storage</span>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Real-time monitoring coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <h3 className="font-medium text-gray-900">View All Tenants</h3>
              <p className="text-sm text-gray-500 mt-1">Manage organizations</p>
            </button>
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <h3 className="font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-500 mt-1">Handle user accounts</p>
            </button>
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <h3 className="font-medium text-gray-900">Support Tools</h3>
              <p className="text-sm text-gray-500 mt-1">Debug and assist</p>
            </button>
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <h3 className="font-medium text-gray-900">System Health</h3>
              <p className="text-sm text-gray-500 mt-1">Monitor performance</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}