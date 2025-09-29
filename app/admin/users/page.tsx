'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Mail, Shield, Users, Building2, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
  memberships: Array<{
    tenantId: string
    role: string
    joinedAt: string
    tenant: {
      name: string
      slug: string
    }
  }>
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface InviteForm {
  email: string
  tenantId: string
  role: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    tenantId: '',
    role: 'SCOUT'
  })
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch users and tenants in parallel
      const [usersResponse, tenantsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/tenants')
      ])

      const usersData = await usersResponse.json()
      const tenantsData = await tenantsResponse.json()

      if (usersData.success) {
        setUsers(usersData.users || [])
      } else {
        console.warn('Users API failed:', usersData.error)
        setUsers([])
      }

      if (tenantsData.success) {
        setTenants(tenantsData.tenants || [])
        // Set Elite Sports Group as default
        const eliteGroup = tenantsData.tenants.find((t: Tenant) =>
          t.name.includes('Elite') || t.slug.includes('elite')
        )
        if (eliteGroup) {
          setInviteForm(prev => ({ ...prev, tenantId: eliteGroup.id }))
        }
      }

    } catch (err) {
      console.error('❌ Error fetching data:', err)
      setError('Network error - check console')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteForm.email || !inviteForm.tenantId) {
      alert('Email and organization are required')
      return
    }

    try {
      setInviting(true)

      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Successfully invited ${inviteForm.email} to ${result.tenantName}`)
        setShowInviteModal(false)
        setInviteForm({ email: '', tenantId: inviteForm.tenantId, role: 'SCOUT' })
        // Refresh data
        await fetchData()
      } else {
        alert(`❌ Failed to invite user: ${result.error}`)
      }
    } catch (err) {
      console.error('❌ Invite error:', err)
      alert('❌ Network error during invitation')
    } finally {
      setInviting(false)
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

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.email.split('@')[0]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users and team invitations</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800 font-medium">Error loading data</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users and team invitations • {users.length} total users
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Total Users</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {users.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Organizations</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {tenants.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-purple-600 mr-2" />
            <p className="text-sm font-medium text-gray-600">Active Memberships</p>
          </div>
          <p className="text-2xl font-mono font-medium text-gray-900 mt-1">
            {users.reduce((acc, user) => acc + user.memberships.length, 0)}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Memberships
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{getUserDisplayName(user)}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.memberships.map((membership, idx) => (
                        <div key={idx} className="flex flex-col">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getRoleColor(membership.role)}`}>
                            {membership.role}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {membership.tenant.name}
                          </span>
                        </div>
                      ))}
                      {user.memberships.length === 0 && (
                        <span className="text-sm text-gray-400">No memberships</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-gray-600 hover:text-gray-900 mr-4">View</button>
                    <button className="text-gray-600 hover:text-gray-900 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-700">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="colleague@example.com"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <select
                  value={inviteForm.tenantId}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, tenantId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Select organization...</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="SCOUT">Scout</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}