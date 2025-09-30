'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Building2, UserPlus, Mail, Lock, User, Loader2, AlertCircle, CheckCircle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface InvitationData {
  id: string
  email: string
  role: string
  tenant: {
    id: string
    name: string
    slug: string
  }
  expiresAt: string
  createdAt: string
}

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const router = useRouter()

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided')
      setLoading(false)
      return
    }

    async function init() {
      try {
        setLoading(true)
        setError(null)

        // Check current session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          setCurrentUser({ email: session.user.email })
        }

        // Validate invitation
        const response = await fetch(`/api/invitations/accept/${token}`)
        const result = await response.json()
        if (!result.success) {
          if (result.errorCode === 'EXPIRED') {
            setError('This invitation has expired.')
          } else if (result.errorCode === 'INVALID_TOKEN') {
            setError('This invitation link is invalid.')
          } else {
            setError(result.error || 'Failed to validate invitation')
          }
          return
        }
        setInvitation(result.invitation)
      } catch (err) {
        setError('Network error.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [token])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Reload page to show registration form
      window.location.reload()
    } catch (err) {
      console.error('Logout error:', err)
      setError('Failed to logout. Please try again.')
    }
  }

  const handleJoinOrganization = async () => {
    // For logged-in users with matching email - just add membership
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinExisting: true,
          firstName: firstName || 'User',
          lastName: lastName || 'Member'
        })
      })
      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Failed to join organization')
        return
      }
      setSuccess(true)
      setTimeout(() => {
        window.location.href = result.data.redirectUrl
      }, 2000)
    } catch (err) {
      setError('Network error.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setSubmitting(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setSubmitting(false)
      return
    }
    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, password })
      })
      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Failed to accept invitation')
        return
      }

      // Auto-login after successful account creation with retry logic
      console.log('✅ Account created, attempting auto-login...')

      // CRITICAL: Clear any existing session first (e.g., admin logged in same browser)
      console.log('🧹 Clearing existing session before auto-login...')
      await supabase.auth.signOut({ scope: 'global' })
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for signOut to complete

      let loginSuccess = false
      let lastError = null

      // Retry up to 3 times with 1 second delay between attempts
      for (let attempt = 1; attempt <= 3 && !loginSuccess; attempt++) {
        // Wait 1 second before each attempt to allow Supabase Auth to propagate user creation
        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log(`🔄 Auto-login attempt ${attempt}/3...`)

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation?.email || '',
          password: password
        })

        if (!signInError) {
          // Force session refresh to ensure it's properly established
          await supabase.auth.getSession()
          loginSuccess = true
          console.log('✅ Auto-login successful!')
          break
        } else {
          lastError = signInError
          if (attempt < 3) {
            console.log(`⚠️ Auto-login attempt ${attempt} failed: ${signInError.message}, retrying...`)
          }
        }
      }

      if (!loginSuccess) {
        console.error('❌ Auto-login failed after 3 attempts:', lastError)
        setError('Account created! Please login manually at /login')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = result.data.redirectUrl
      }, 2000)
    } catch (err) {
      setError('Network error.')
    } finally {
      setSubmitting(false)
    }
  }

  // Check if user email matches invitation
  const isEmailMatch = currentUser && invitation && currentUser.email.toLowerCase() === invitation.email.toLowerCase()
  const isEmailMismatch = currentUser && invitation && currentUser.email.toLowerCase() !== invitation.email.toLowerCase()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-3">Invalid Invitation</h2>
            <p className="text-slate-600 text-center mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome!</h2>
            <p className="text-slate-700 mb-2 font-medium">
              You have successfully joined {invitation?.tenant.name}!
            </p>
            <p className="text-slate-600 mb-6">Redirecting...</p>
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Scout Hub</h1>
          </div>
          <p className="text-slate-600 text-lg font-medium">Accept Your Invitation</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-blue-900 font-medium">You have been invited to join</p>
              <p className="text-lg font-bold text-blue-900">{invitation?.tenant.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                  {invitation?.role}
                </span>
                <span className="text-xs text-blue-700">{invitation?.email}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Email Mismatch Warning */}
        {isEmailMismatch && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 mb-1">Email Mismatch</p>
                <p className="text-sm text-yellow-800 mb-3">
                  You're logged in as <strong>{currentUser?.email}</strong>, but this invitation is for <strong>{invitation?.email}</strong>.
                </p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout & Accept Invitation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Match - Simple Join */}
        {isEmailMatch && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Welcome Back!</h2>
            <p className="text-slate-600 mb-6">
              You're already logged in. Click below to join <strong>{invitation?.tenant.name}</strong> as a {invitation?.role}.
            </p>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={handleJoinOrganization}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Join Organization
                </>
              )}
            </button>
          </div>
        )}

        {/* No Session - Regular Registration */}
        {!currentUser && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Create Your Account</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full bg-white/90 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full bg-white/90 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={invitation?.email || ''}
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/90 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-white/90 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm password"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Accept Invitation
                </>
              )}
            </button>
          </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}