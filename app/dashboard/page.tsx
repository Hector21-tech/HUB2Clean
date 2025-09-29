'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Building2, Users, ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { UserNav } from '@/components/user-nav'

export default function RootDashboard() {
  const { user, userTenants, loading, initializing } = useAuth()
  const router = useRouter()
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showRetryOption, setShowRetryOption] = useState(false)

  // Show retry option after 8 seconds of loading
  React.useEffect(() => {
    if (loading && user) {
      const timer = setTimeout(() => {
        setShowRetryOption(true)
      }, 8000)
      return () => clearTimeout(timer)
    } else {
      setShowRetryOption(false)
    }
  }, [loading, user])


  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setOrgName(name)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setOrgSlug(slug)
  }

  const handleSetupUserData = async () => {
    setSetupStatus('loading')
    try {
      const { apiFetch } = await import('@/lib/api-config')
      const response = await apiFetch('/api/setup-user-data', {
        method: 'POST'
      })

      const result = await response.json()
      if (result.success) {
        setSetupStatus('success')
        // Refresh the page to load new tenant data
        window.location.reload()
      } else {
        setSetupStatus('error')
        alert('Error setting up user data: ' + result.error)
      }
    } catch (error) {
      setSetupStatus('error')
      console.error('Setup error:', error)
      alert('Failed to setup user data')
    }
  }

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || !orgSlug.trim()) return

    setCreatingOrg(true)
    try {
      const { apiFetch } = await import('@/lib/api-config')
      const response = await apiFetch('/api/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: orgName.trim(),
          slug: orgSlug.trim(),
          description: `${orgName.trim()} scouting organization`
        })
      })

      const result = await response.json()
      if (result.success) {
        // Redirect to new organization dashboard
        router.push(`/${result.data.slug}/dashboard`)
      } else {
        alert('Error creating organization: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create organization')
    } finally {
      setCreatingOrg(false)
    }
  }

  // Show initial loading while auth is initializing - prevents redirect loops
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Initializing...
        </div>
      </div>
    )
  }

  // Redirect to login if no user after initialization is complete
  if (!initializing && !user) {
    router.push('/login')
    return null
  }

  // Enhanced loading state with timeout recovery
  if (user && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Loading your organizations...
          </div>
          <p className="text-white/60 text-sm mb-6">This should only take a moment...</p>

          {/* Show retry option only after timeout */}
          {showRetryOption && (
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Retry Loading
              </button>
              <p className="text-white/50 text-xs">
                If this keeps happening, try refreshing your browser or contact support.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Final safety check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/scout-hub-logo.svg"
                alt="Scout Hub"
                width={140}
                height={42}
                className="h-9 w-auto filter brightness-0 invert"
              />
            </div>
            <UserNav />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Scout Hub, {user.user_metadata?.firstName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-xl text-white/70 mb-8">
            Get started by creating your scouting organization or joining an existing one.
          </p>
        </div>

        {/* Existing Organizations */}
        {userTenants.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Your Organizations</h2>
            <div className="grid gap-4">
              {userTenants.map((membership) => (
                <div
                  key={membership.tenantId}
                  onClick={() => router.push(`/${membership.tenant.slug}/dashboard`)}
                  className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{membership.tenant.name}</h3>
                        <p className="text-white/60 capitalize">{membership.role.toLowerCase()}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup User Data (only show if no tenants) */}
        {userTenants.length === 0 && (
          <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-xl p-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Setup Your Organizations</h3>
              <p className="text-white/70 mb-4 text-sm">
                Click below to create your Test1 and Elite Sports Group organizations in the database.
              </p>
              <button
                onClick={handleSetupUserData}
                disabled={setupStatus === 'loading'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                {setupStatus === 'loading' ? 'Setting up...' : 'Setup Organizations'}
              </button>
            </div>
          </div>
        )}

        {/* Create Organization */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Create New Organization</h2>
            <p className="text-white/70">Start your own scouting organization and invite team members.</p>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Manchester United Scouts"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                URL Slug
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-white/60 text-sm">scout-hub.com/</span>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="manchester-united"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                />
              </div>
              <p className="text-xs text-white/50 mt-1">This will be your organization's unique URL</p>
            </div>

            <button
              onClick={handleCreateOrganization}
              disabled={!orgName.trim() || !orgSlug.trim() || creatingOrg}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {creatingOrg ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  Create Organization
                </>
              )}
            </button>
          </div>
        </div>

        {/* Join Organization */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-br from-white/5 via-white/2 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <Mail className="w-8 h-8 text-white/60 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Join Existing Organization</h3>
            <p className="text-white/70 text-sm">
              Ask an admin from your organization to invite you via email,
              or contact support if you need help finding your organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Metadata is handled by layout.tsx for client components