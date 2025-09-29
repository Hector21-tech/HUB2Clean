'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  initializing: boolean
  signOut: () => Promise<void>
  userTenants: TenantMembership[]
  currentTenant: string | null
  setCurrentTenant: (tenantId: string) => void
}

interface TenantMembership {
  tenantId: string
  role: string
  tenant: {
    id: string
    name: string
    slug: string
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false) // Changed to false, will be set by tenant loading
  const [initializing, setInitializing] = useState(true) // New state for initial session check
  const [userTenants, setUserTenants] = useState<TenantMembership[]>([])
  const [currentTenant, setCurrentTenant] = useState<string | null>(null)
  const [isFetchingTenants, setIsFetchingTenants] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session - optimized for fast loading
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ AuthContext: Error getting session:', error)
          setInitializing(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        // Complete initialization immediately - let onAuthStateChange handle tenant fetching
        setInitializing(false)
      } catch (error) {
        console.error('❌ AuthContext: Fatal auth error:', error)
        setInitializing(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, !!session?.user)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Don't block UI during auth changes
          setLoading(true)

          // Ensure user exists in database
          await ensureUserInDatabase(session.user)

          // Fetch user's tenant memberships in background
          await fetchUserTenants(session.user.id)

          setLoading(false)
        } else {
          setUserTenants([])
          setCurrentTenant(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Ensure user exists in our database
  const ensureUserInDatabase = async (user: User) => {
    try {
      const { apiFetch } = await import('@/lib/api-config')
      await apiFetch('/api/users/sync', {
        method: 'POST',
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.firstName || user.user_metadata?.first_name,
          lastName: user.user_metadata?.lastName || user.user_metadata?.last_name,
          avatarUrl: user.user_metadata?.avatarUrl || user.user_metadata?.avatar_url
        })
      })
    } catch (error) {
      console.error('Error syncing user to database:', error)
    }
  }

  // Auth performance monitoring (development only)
  const logAuthPerformance = (operation: string, startTime: number, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime
      console.log(`⏱️ Auth Performance: ${operation} took ${duration}ms`, data || '')
    }
  }

  // Fetch user's tenant memberships - production ready
  const fetchUserTenants = async (userId: string) => {
    const startTime = Date.now()

    // Prevent duplicate calls - but allow retry if stuck for too long
    if (isFetchingTenants) {
      console.log('📍 AuthContext: Already fetching tenants, skipping duplicate call')
      return
    }

    // Allow retry if we have no tenants and it's not a duplicate call
    setIsFetchingTenants(true)

    // Safety timeout to prevent stuck states
    const timeoutId = setTimeout(() => {
      console.warn('⏰ AuthContext: Tenant fetching timeout, resetting state')
      setIsFetchingTenants(false)
    }, 30000) // 30 second safety timeout

    try {
      // Simple query without timeout complications
      const { data, error } = await supabase
        .from('tenant_memberships')
        .select(`
          tenantId,
          role,
          tenant:tenants!inner (
            id,
            name,
            slug
          )
        `)
        .eq('userId', userId)

      if (error) {
        console.error('❌ AuthContext: Error fetching user tenants:', error)
        logAuthPerformance('fetchUserTenants (error)', startTime, { error: error.message })
        // Set empty tenants and complete - no retries to avoid infinite loops
        setUserTenants([])
        return
      }

      if (data && data.length > 0) {
        const memberships = data.map((item: any) => ({
          tenantId: item.tenantId,
          role: item.role,
          tenant: Array.isArray(item.tenant) ? item.tenant[0] : item.tenant
        })) as TenantMembership[]

        setUserTenants(memberships)

        // Set current tenant to first available if none set
        if (memberships.length > 0 && !currentTenant) {
          setCurrentTenant(memberships[0].tenantId)
        }

        logAuthPerformance('fetchUserTenants (success)', startTime, { tenants: memberships.length })
      } else {
        // No memberships found - log and complete (no auto-setup to avoid loops)
        console.warn('⚠️ AuthContext: No tenant memberships found for user')
        setUserTenants([])
        logAuthPerformance('fetchUserTenants (no tenants)', startTime, { tenants: 0 })
      }
    } catch (error) {
      console.error('❌ AuthContext: Fatal error in fetchUserTenants:', error)
      logAuthPerformance('fetchUserTenants (error)', startTime, { error: error instanceof Error ? error.message : 'Unknown error' })
      setUserTenants([])
    } finally {
      clearTimeout(timeoutId) // Clear the safety timeout
      setIsFetchingTenants(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }

    setUser(null)
    setSession(null)
    setUserTenants([])
    setCurrentTenant(null)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    initializing,
    signOut,
    userTenants,
    currentTenant,
    setCurrentTenant
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to get current tenant data
export function useCurrentTenant() {
  const { userTenants, currentTenant } = useAuth()

  const tenantData = userTenants.find(
    membership => membership.tenantId === currentTenant
  )

  return {
    tenantId: currentTenant,
    tenantSlug: tenantData?.tenant?.slug, // Add tenant slug for API calls
    tenant: tenantData?.tenant,
    role: tenantData?.role,
    hasAccess: !!tenantData
  }
}