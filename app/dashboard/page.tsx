'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, Users, ArrowRight, Mail, Target } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Target className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Scout Hub</h1>
          </div>
          <p className="text-slate-600 text-lg font-medium">
            Welcome, {user.user_metadata?.firstName || user.email?.split('@')[0]}!
          </p>
          <p className="text-slate-500 text-sm mt-1">Choose your scouting organization</p>
        </div>

        {/* Existing Organizations */}
        {userTenants.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl shadow-blue-100/50 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Your Organizations</h2>
              <p className="text-slate-600 text-sm">Select an organization to continue</p>
            </div>
            <div className="space-y-3">
              {userTenants.map((membership) => (
                <button
                  key={membership.tenantId}
                  onClick={() => router.push(`/${membership.tenant.slug}/dashboard`)}
                  className="w-full bg-white/50 hover:bg-white/70 border border-slate-200 rounded-lg p-4 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">{membership.tenant.name}</h3>
                        <p className="text-xs text-slate-500 capitalize">{membership.role.toLowerCase()}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Setup User Data (only show if no tenants) */}
        {userTenants.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl shadow-blue-100/50 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Setup Your Organizations</h3>
              <p className="text-slate-600 mb-4 text-sm">
                Click below to create your Test1 and Elite Sports Group organizations in the database.
              </p>
              <button
                onClick={handleSetupUserData}
                disabled={setupStatus === 'loading'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm shadow-lg shadow-green-200/50"
              >
                {setupStatus === 'loading' ? 'Setting up...' : 'Setup Organizations'}
              </button>
            </div>
          </div>
        )}

        {/* Create Organization */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl shadow-blue-100/50">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Create New Organization</h2>
            <p className="text-slate-600 text-sm">Start your own scouting organization and invite team members</p>
          </div>

          <div className="max-w-sm mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Manchester United Scouts"
                className="w-full bg-white/90 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL Slug
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 text-sm">scout-hub.com/</span>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="manchester-united"
                  className="flex-1 bg-white/90 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">This will be your organization's unique URL</p>
            </div>

            <button
              onClick={handleCreateOrganization}
              disabled={!orgName.trim() || !orgSlug.trim() || creatingOrg}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50"
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
        <div className="mt-6 text-center">
          <div className="bg-white/50 border border-white/40 rounded-xl p-6">
            <Mail className="w-6 h-6 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-800 mb-2">Join Existing Organization</h3>
            <p className="text-slate-600 text-sm">
              Ask an admin from your organization to invite you via email
            </p>
          </div>
        </div>

        {/* UserNav positioned absolutely */}
        <div className="fixed top-4 right-4">
          <UserNav />
        </div>

        {/* Security Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-2">
            <Shield className="w-4 h-4" />
            <span>Secure Login</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2025 Scout Hub. Enterprise Football Scouting Platform.
          </p>
        </div>
      </div>
    </div>
  )
}

// Metadata is handled by layout.tsx for client components