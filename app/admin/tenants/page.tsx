'use client'

import { useState, useEffect } from 'react'
import { Trash2, Users, FileText, Calendar, Target, Shield } from 'lucide-react'

interface TenantStats {
  users: number
  players: number
  requests: number
  trials: number
  events: number
}

interface TenantMember {
  userId: string
  role: string
  joinedAt: string
  user: {
    email: string
    firstName?: string
    lastName?: string
  }
}

interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
  updatedAt: string
  stats: TenantStats
  members: TenantMember[]
}

interface ApiResponse {
  success: boolean
  tenants: Tenant[]
  totalTenants: number
  timestamp: string
  error?: string
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingTenant, setDeletingTenant] = useState<string | null>(null)

  // Fetch tenants on component mount
  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/tenants')
      const data: ApiResponse = await response.json()

      if (data.success) {
        setTenants(data.tenants)
        console.log('✅ Loaded tenants:', data.tenants.length)
      } else {
        setError(data.error || 'Failed to fetch tenants')
      }
    } catch (err) {
      console.error('❌ Error fetching tenants:', err)
      setError('Network error - check console')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTenant = async (tenant: Tenant) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tenant.name}"?\n\n` +
      `This will permanently delete:\n` +
      `- ${tenant.stats.players} players\n` +
      `- ${tenant.stats.requests} requests\n` +
      `- ${tenant.stats.trials} trials\n` +
      `- ${tenant.stats.events} events\n` +
      `- ${tenant.stats.users} user memberships\n\n` +
      `This action CANNOT be undone!`
    )

    if (!confirmed) return

    try {
      setDeletingTenant(tenant.id)

      const response = await fetch(`/api/admin/tenants?id=${tenant.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Tenant deleted:', result.deletedTenant.name)
        alert(`✅ Successfully deleted "${result.deletedTenant.name}"`)

        // Refresh tenant list
        await fetchTenants()
      } else {
        console.error('❌ Delete failed:', result.error)
        alert(`❌ Failed to delete tenant: ${result.error}`)
      }
    } catch (err) {
      console.error('❌ Delete error:', err)
      alert('❌ Network error during deletion')
    } finally {
      setDeletingTenant(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-800'
      case 'ADMIN': return 'bg-blue-100 text-blue-800'
      case 'MANAGER': return 'bg-green-100 text-green-800'
      case 'SCOUT': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage organizations and their settings</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800 font-medium">Error loading tenants</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={fetchTenants}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Calculate totals
  const totalStats = tenants.reduce((acc, tenant) => ({
    users: acc.users + tenant.stats.users,
    players: acc.players + tenant.stats.players,
    requests: acc.requests + tenant.stats.requests,
    trials: acc.trials + tenant.stats.trials,
    events: acc.events + tenant.stats.events
  }), { users: 0, players: 0, requests: 0, trials: 0, events: 0 })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">
            Manage organizations and their settings • {tenants.length} total tenants
          </p>
        </div>
        <button
          onClick={fetchTenants}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-gray-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Total Tenants</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {tenants.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Total Users</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {totalStats.users}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <Target className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Total Players</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {totalStats.players}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-orange-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Total Requests</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {totalStats.requests}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-purple-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Total Events</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {totalStats.events}
          </p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Tenants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      {tenant.description && (
                        <div className="text-sm text-gray-500">{tenant.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 font-mono">{tenant.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{tenant.stats.users}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tenant.members.slice(0, 3).map((member, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}
                        >
                          {member.role}
                        </span>
                      ))}
                      {tenant.members.length > 3 && (
                        <span className="text-xs text-gray-500">+{tenant.members.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>👥 {tenant.stats.players} players</div>
                      <div>📋 {tenant.stats.requests} requests</div>
                      <div>🎯 {tenant.stats.trials} trials</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(tenant.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteTenant(tenant)}
                      disabled={deletingTenant === tenant.id}
                      className="text-red-600 hover:text-red-700 disabled:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingTenant === tenant.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tenants.length === 0 && (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No tenants found</p>
          </div>
        )}
      </div>
    </div>
  )
}