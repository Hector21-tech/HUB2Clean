'use client'

import { Server, Database, Activity, Zap, HardDrive, Wifi } from 'lucide-react'

export default function SystemPage() {
  const systemMetrics = [
    {
      label: 'Server Uptime',
      value: '99.9%',
      icon: Server,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Database Performance',
      value: 'Optimal',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'API Response Time',
      value: '< 200ms',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'Active Connections',
      value: '--',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Storage Usage',
      value: '--',
      icon: HardDrive,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Network Status',
      value: 'Healthy',
      icon: Wifi,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ]

  const systemLogs = [
    { timestamp: '2025-10-01 20:30:15', event: 'System boot completed', level: 'info' },
    { timestamp: '2025-10-01 20:28:45', event: 'Database connection pool initialized', level: 'info' },
    { timestamp: '2025-10-01 20:25:12', event: 'Cache warming completed', level: 'success' }
  ]

  const services = [
    { name: 'API Gateway', status: 'operational', uptime: '99.98%' },
    { name: 'Database Cluster', status: 'operational', uptime: '99.99%' },
    { name: 'Cache Layer', status: 'operational', uptime: '99.95%' },
    { name: 'File Storage', status: 'operational', uptime: '99.97%' },
    { name: 'Authentication Service', status: 'operational', uptime: '99.96%' },
    { name: 'Email Service', status: 'operational', uptime: '99.92%' }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-gray-900">System Monitor</h1>
        <p className="text-gray-600 mt-1">Real-time system health and performance metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-white border border-gray-200 rounded p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-mono font-medium text-gray-900 mt-2">
                    {metric.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Service Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">{service.uptime}</span>
                    <span className="text-xs text-green-600 font-medium capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">All systems operational</p>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Logs</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {systemLogs.map((log, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                  <p className="text-xs font-mono text-gray-500">{log.timestamp}</p>
                  <p className="text-sm text-gray-900 mt-1">{log.event}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                    log.level === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {log.level}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Real-time log streaming coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Server className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Advanced System Monitoring</h3>
            <p className="text-gray-600 mt-1">
              Comprehensive system monitoring with real-time alerts, performance graphs,
              resource usage tracking, and automated diagnostics will be available in the next release.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Performance Graphs
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Alert System
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Resource Tracking
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Automated Diagnostics
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
