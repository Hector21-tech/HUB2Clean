'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, RefreshCw, LogOut, Target, Shield, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'

export default function VerifyEmailPage() {
  const { user, isEmailVerified, signOut, resendVerificationEmail, initializing } = useAuth()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Redirect if not logged in or already verified
  useEffect(() => {
    if (initializing) return

    if (!user) {
      router.push('/login')
      return
    }

    if (isEmailVerified) {
      router.push('/dashboard')
    }
  }, [user, isEmailVerified, initializing, router])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setMessage(null)

    const { error } = await resendVerificationEmail()

    setIsResending(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Verification email sent! Check your inbox.' })
      setResendCooldown(60)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  // Don't render if no user or already verified
  if (!user || isEmailVerified) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Target className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Scout Hub</h1>
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl shadow-blue-100/50">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
            Verify Your Email
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-center mb-2">
            We sent a verification link to:
          </p>
          <p className="text-blue-600 font-semibold text-center mb-6">
            {user.email}
          </p>

          {/* Instructions */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-slate-700 text-sm leading-relaxed">
              1. Check your inbox (and spam folder)<br />
              2. Click the verification link in the email<br />
              3. Return here and sign in again
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className={`p-3 rounded-lg mb-4 flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />}
              <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50 mb-3"
          >
            {isResending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </>
            )}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>

          {/* Help text */}
          <p className="text-slate-500 text-xs text-center mt-6">
            After verifying your email, sign out and sign in again to access your account.
          </p>
        </div>

        {/* Security Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-2">
            <Shield className="w-4 h-4" />
            <span>Secure Verification</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2025 Scout Hub. Enterprise Football Scouting Platform.
          </p>
        </div>
      </div>
    </div>
  )
}
