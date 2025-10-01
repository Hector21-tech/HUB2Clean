'use client'

import { MessageSquare, Users, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export default function SupportPage() {
  const supportMetrics = [
    {
      label: 'Open Tickets',
      value: '--',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Active Users',
      value: '--',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Avg Response Time',
      value: '< 2h',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Resolved Today',
      value: '--',
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      label: 'Critical Issues',
      value: '0',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Satisfaction Rate',
      value: '--',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const recentTickets = [
    {
      id: '#DEMO-001',
      user: 'Sample User',
      subject: 'Unable to upload player profile',
      status: 'pending',
      priority: 'high',
      time: 'Sample Data'
    },
    {
      id: '#DEMO-002',
      user: 'Sample User',
      subject: 'Request export not working',
      status: 'in-progress',
      priority: 'medium',
      time: 'Sample Data'
    },
    {
      id: '#DEMO-003',
      user: 'Sample User',
      subject: 'Calendar event duplication',
      status: 'resolved',
      priority: 'low',
      time: 'Sample Data'
    }
  ]

  const commonIssues = [
    { issue: 'Password reset requests', count: '--', trend: 'stable' },
    { issue: 'Upload errors', count: '--', trend: 'down' },
    { issue: 'Permission issues', count: '--', trend: 'stable' },
    { issue: 'Integration questions', count: '--', trend: 'up' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700'
      case 'resolved':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Support Center</h1>
        <p className="text-gray-600 mt-1">Manage user support tickets and inquiries</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportMetrics.map((metric, index) => {
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
        {/* Recent Tickets */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Tickets</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-500">{ticket.id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{ticket.user}</span>
                    <span className="text-xs text-gray-500">{ticket.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Live ticket system coming soon</p>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Common Issues</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {commonIssues.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.issue}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.count} reported this week
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    item.trend === 'up' ? 'bg-red-100 text-red-700' :
                    item.trend === 'down' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.trend}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Analytics dashboard coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Support Tools</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <MessageSquare className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Create Ticket</h3>
              <p className="text-sm text-gray-500 mt-1">New support request</p>
            </button>
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <Users className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">User Lookup</h3>
              <p className="text-sm text-gray-500 mt-1">Search user accounts</p>
            </button>
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <AlertCircle className="w-6 h-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900">Issue Tracker</h3>
              <p className="text-sm text-gray-500 mt-1">Monitor problems</p>
            </button>
            <button className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-left">
              <CheckCircle className="w-6 h-6 text-teal-600 mb-2" />
              <h3 className="font-medium text-gray-900">Knowledge Base</h3>
              <p className="text-sm text-gray-500 mt-1">Help documentation</p>
            </button>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Advanced Support Platform</h3>
            <p className="text-gray-600 mt-1">
              Full-featured support system with live chat, automated responses, ticket workflow,
              knowledge base integration, and customer satisfaction tracking will be available soon.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Live Chat
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Auto-Responses
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Ticket Workflow
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Satisfaction Tracking
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
