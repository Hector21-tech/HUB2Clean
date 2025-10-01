'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Mail, Shield, Users, Building2, Trash2, Eye, Edit, X, Clock, Copy, RefreshCw } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

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

interface Invitation {
  id: string
  email: string
  tenantId: string
  role: string
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expiresAt: string
  createdAt: string
  acceptedAt: string | null
  tenant: {
    name: string
    slug: string
  }
}

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    tenantId: '',
    role: 'SCOUT'
  })
  const [inviting, setInviting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch users, invitations and tenants in parallel
      const [usersResponse, invitationsResponse, tenantsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/invitations'),
        fetch('/api/admin/tenants')
      ])

      const usersData = await usersResponse.json()
      const invitationsData = await invitationsResponse.json()
      const tenantsData = await tenantsResponse.json()

      if (usersData.success) {
        setUsers(usersData.users || [])
      } else {
        console.warn('Users API failed:', usersData.error)
        setUsers([])
      }

      if (invitationsData.success) {
        setInvitations(invitationsData.invitations || [])
      } else {
        console.warn('Invitations API failed:', invitationsData.error)
        setInvitations([])
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
        const inviteLink = result.data?.inviteLink || ''

        // Copy invite link to clipboard
        if (inviteLink) {
          navigator.clipboard.writeText(inviteLink).catch(err => {
            console.warn('Failed to copy to clipboard:', err)
          })
        }

        // Show success toast
        toast.success(
          `Successfully invited ${inviteForm.email} to ${result.data?.tenantName}! Link copied to clipboard.`,
          {
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#10B981',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
          }
        )

        setShowInviteModal(false)
        setInviteForm({ email: '', tenantId: inviteForm.tenantId, role: 'SCOUT' })

        // Refresh data
        await fetchData()
      } else {
        toast.error(`Failed to invite user: ${result.error}`, {
          duration: 4000,
          position: 'top-center',
        })
      }
    } catch (err) {
      console.error('❌ Invite error:', err)
      toast.error('Network error during invitation', {
        duration: 4000,
        position: 'top-center',
      })
    } finally {
      setInviting(false)
    }
  }

  const handleViewUser = async (user: User) => {
    try {
      setActionLoading(`view-${user.id}`)

      const response = await fetch(`/api/admin/users/${user.id}`)
      const result = await response.json()

      if (result.success) {
        setSelectedUser(result.user)
        setShowUserModal(true)
      } else {
        alert(`❌ Failed to load user details: ${result.error}`)
      }
    } catch (err) {
      console.error('❌ View user error:', err)
      alert('❌ Network error loading user details')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveUser = async (user: User, membership: any) => {
    const confirmed = window.confirm(
      `Remove ${user.email} from ${membership.tenant.name}?\n\n` +
      `Role: ${membership.role}\n` +
      `This action cannot be undone!`
    )

    if (!confirmed) return

    try {
      setActionLoading(`remove-${user.id}`)

      const response = await fetch(
        `/api/admin/users/membership?userId=${user.id}&tenantId=${membership.tenantId}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.message}`)
        await fetchData() // Refresh data
      } else {
        alert(`❌ Failed to remove user: ${result.error}`)
      }
    } catch (err) {
      console.error('❌ Remove user error:', err)
      alert('❌ Network error during removal')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (user: User) => {
    const userName = getUserDisplayName(user)
    const membershipInfo = user.memberships.length > 0
      ? `\n\nMemberships: ${user.memberships.map(m => `${m.tenant.name} (${m.role})`).join(', ')}`
      : '\n\nNo memberships'

    const confirmed = window.confirm(
      `🗑️ PERMANENTLY DELETE USER?\n\n` +
      `User: ${userName} (${user.email})${membershipInfo}\n\n` +
      `⚠️ This will delete:\n` +
      `- User account from database\n` +
      `- All memberships (${user.memberships.length})\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Type user's email to confirm or Cancel to abort.`
    )

    if (!confirmed) return

    // Extra confirmation for safety
    const emailConfirm = window.prompt(
      `⚠️ FINAL CONFIRMATION\n\nType the user's email exactly to confirm deletion:\n\n${user.email}`
    )

    if (emailConfirm !== user.email) {
      alert('❌ Email did not match. Deletion cancelled.')
      return
    }

    try {
      setActionLoading(`delete-${user.id}`)

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        alert(
          `✅ User deleted successfully!\n\n` +
          `Deleted: ${result.deleted.email}\n` +
          `Memberships removed: ${result.deleted.membershipCount}\n` +
          `Tenants affected: ${result.deleted.tenants.join(', ') || 'None'}`
        )
        await fetchData() // Refresh data
      } else {
        // Show detailed error message with all available information
        let errorMessage = `❌ Failed to delete user: ${result.error}`

        if (result.details) {
          errorMessage += `\n\nDetails: ${result.details}`
        }

        if (result.hint) {
          errorMessage += `\n\n💡 Hint: ${result.hint}`
        }

        console.error('❌ Delete user error response:', result)
        alert(errorMessage)
      }
    } catch (err) {
      console.error('❌ Delete user error:', err)
      alert('❌ Network error during deletion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (user: User, membership: any, newRole: string) => {
    if (newRole === membership.role) return // No change

    try {
      setActionLoading(`role-${user.id}`)

      const response = await fetch('/api/admin/users/membership', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tenantId: membership.tenantId,
          newRole: newRole
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.message}`)
        await fetchData() // Refresh data
      } else {
        alert(`❌ Failed to update role: ${result.error}`)
      }
    } catch (err) {
      console.error('❌ Change role error:', err)
      alert('❌ Network error during role change')
    } finally {
      setActionLoading(null)
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

  const handleDeleteInvitation = async (invitation: Invitation) => {
    const confirmed = window.confirm(
      `Delete invitation for ${invitation.email}?\n\n` +
      `Organization: ${invitation.tenant.name}\n` +
      `Role: ${invitation.role}\n` +
      `Status: ${invitation.status}`
    )

    if (!confirmed) return

    try {
      setActionLoading(`delete-invite-${invitation.id}`)

      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Invitation for ${invitation.email} deleted!`, {
          duration: 3000,
          position: 'top-center'
        })
        await fetchData()
      } else {
        toast.error(`Failed to delete: ${result.error}`, {
          duration: 4000,
          position: 'top-center'
        })
      }
    } catch (err) {
      console.error('❌ Delete invitation error:', err)
      toast.error('Network error during deletion', {
        duration: 4000,
        position: 'top-center'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      setActionLoading(`resend-${invitation.id}`)

      const response = await fetch(`/api/invitations/${invitation.id}/resend`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Invitation resent to ${invitation.email}!`, {
          duration: 3000,
          position: 'top-center'
        })
      } else {
        toast.error(`Failed to resend: ${result.error}`, {
          duration: 4000,
          position: 'top-center'
        })
      }
    } catch (err) {
      console.error('❌ Resend invitation error:', err)
      toast.error('Network error during resend', {
        duration: 4000,
        position: 'top-center'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCopyInviteLink = (invitation: Invitation) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const inviteLink = `${siteUrl}/accept-invite?token=${invitation.token}`

    navigator.clipboard.writeText(inviteLink)
    toast.success('Invite link copied to clipboard!', {
      duration: 2000,
      position: 'top-center'
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isInvitationExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
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

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING')

  return (
    <div className="space-y-6">
      <Toaster />
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users and team invitations • {users.length} users • {pendingInvitations.length} pending invites
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({users.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'invitations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invitations ({invitations.length})
              {pendingInvitations.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {pendingInvitations.length} pending
                </span>
              )}
            </div>
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
      {activeTab === 'users' && (
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
                          <select
                            value={membership.role}
                            onChange={(e) => handleChangeRole(user, membership, e.target.value)}
                            disabled={actionLoading === `role-${user.id}`}
                            className={`inline-flex px-2 py-1 text-xs rounded-full border-0 cursor-pointer ${getRoleColor(membership.role)}`}
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="SCOUT">SCOUT</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        disabled={actionLoading === `view-${user.id}`}
                        className="text-blue-600 hover:text-blue-700 disabled:text-blue-400 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        {actionLoading === `view-${user.id}` ? 'Loading...' : 'View'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={actionLoading === `delete-${user.id}`}
                        className="text-red-600 hover:text-red-700 disabled:text-red-400 flex items-center gap-1 font-medium"
                        title="Permanently delete user from database"
                      >
                        <Trash2 className="w-4 h-4" />
                        {actionLoading === `delete-${user.id}` ? 'Deleting...' : 'Delete User'}
                      </button>
                    </div>
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
      )}

      {/* Invitations Table */}
      {activeTab === 'invitations' && (
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Invitations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invitations.length > 0 ? (
                  invitations.map((invitation) => {
                    const expired = isInvitationExpired(invitation.expiresAt)
                    const displayStatus = expired && invitation.status === 'PENDING' ? 'EXPIRED' : invitation.status

                    return (
                      <tr key={invitation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{invitation.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{invitation.tenant.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(invitation.role)}`}>
                            {invitation.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(displayStatus)}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(invitation.expiresAt)}
                          </div>
                          {expired && invitation.status === 'PENDING' && (
                            <span className="text-xs text-red-600 mt-1 block">Expired</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {invitation.status === 'PENDING' && !expired && (
                              <>
                                <button
                                  onClick={() => handleCopyInviteLink(invitation)}
                                  className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                                  title="Copy invite link"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleResendInvitation(invitation)}
                                  disabled={actionLoading === `resend-${invitation.id}`}
                                  className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded disabled:opacity-50"
                                  title="Resend email"
                                >
                                  <RefreshCw className={`w-4 h-4 ${actionLoading === `resend-${invitation.id}` ? 'animate-spin' : ''}`} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteInvitation(invitation)}
                              disabled={actionLoading === `delete-invite-${invitation.id}`}
                              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Delete invitation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No invitations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <div className="font-medium">
                      {selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.email.split('@')[0]
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <div className="font-medium">{selectedUser.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <div className="font-medium">{formatDate(selectedUser.createdAt)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <div className="font-medium">{formatDate(selectedUser.updatedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.summary.totalMemberships}</div>
                    <div className="text-gray-600">Organizations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedUser.summary.roles.length}</div>
                    <div className="text-gray-600">Different Roles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedUser.summary.roles.includes('OWNER') ? '👑' :
                       selectedUser.summary.roles.includes('ADMIN') ? '🛡️' :
                       selectedUser.summary.roles.includes('MANAGER') ? '📋' : '🔍'}
                    </div>
                    <div className="text-gray-600">Highest Role</div>
                  </div>
                </div>
              </div>

              {/* Memberships */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Organization Memberships</h4>
                <div className="space-y-3">
                  {selectedUser.memberships.map((membership: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium">{membership.tenant.name}</div>
                            <div className="text-sm text-gray-500">/{membership.tenant.slug}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(membership.role)}`}>
                          {membership.role}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 mt-3">
                        <div>
                          <span className="font-medium">Players:</span> {membership.stats?.totalPlayers || 0}
                        </div>
                        <div>
                          <span className="font-medium">Requests:</span> {membership.stats?.totalRequests || 0}
                        </div>
                        <div>
                          <span className="font-medium">Trials:</span> {membership.stats?.totalTrials || 0}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        Joined: {formatDate(membership.joinedAt)}
                      </div>

                      {membership.tenant.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {membership.tenant.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}