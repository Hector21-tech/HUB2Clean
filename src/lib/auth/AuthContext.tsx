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
          // Critical fix: Don't block UI during auth changes, run in background
          console.log('🔄 AuthContext: User authenticated, loading tenant data in background')

          // Run tenant loading in background without blocking UI
          const loadTenantData = async () => {
            setLoading(true)
            try {
              // Ensure user exists in database
              await ensureUserInDatabase(session.user)

              // Fetch user's tenant memberships with enhanced error recovery
              await fetchUserTenants(session.user.id)
            } catch (error) {
              console.error('❌ AuthContext: Failed to load tenant data:', error)
              // Complete loading even on failure to prevent infinite loading
              setUserTenants([])
            } finally {
              setLoading(false)
            }
          }

          // Run in background, don't await
          loadTenantData()
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

  // Fetch user's tenant memberships - enhanced with aggressive error recovery
  const fetchUserTenants = async (userId: string, retryCount = 0) => {
    const startTime = Date.now()
    const maxRetries = 2
    const timeoutDuration = 8000 // Reduced from 30s to 8s

    // Prevent duplicate calls - but allow retry if stuck for too long
    if (isFetchingTenants && retryCount === 0) {
      console.log('📍 AuthContext: Already fetching tenants, skipping duplicate call')
      return
    }

    setIsFetchingTenants(true)

    // Aggressive timeout to prevent stuck states
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ AuthContext: Tenant fetching timeout after ${timeoutDuration}ms (attempt ${retryCount + 1})`)
      setIsFetchingTenants(false)
      setLoading(false) // Force exit loading state

      // Try retry if available, otherwise complete with empty state
      if (retryCount < maxRetries) {
        console.log(`🔄 AuthContext: Retrying fetchUserTenants (${retryCount + 1}/${maxRetries})`)
        setTimeout(() => fetchUserTenants(userId, retryCount + 1), 1000)
      } else {
        console.warn('❌ AuthContext: Max retries exceeded, setting empty tenant state')
        setUserTenants([])
      }
    }, timeoutDuration)

    try {
      // Add timeout to the database query itself
      const controller = new AbortController()
      const queryTimeoutId = setTimeout(() => controller.abort(), 5000) // 5s query timeout

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
        .abortSignal(controller.signal)

      clearTimeout(queryTimeoutId)

      if (error) {
        console.error('❌ AuthContext: Database error fetching user tenants:', error)
        logAuthPerformance('fetchUserTenants (db_error)', startTime, { error: error.message, attempt: retryCount + 1 })

        // Retry on database errors
        if (retryCount < maxRetries) {
          console.log(`🔄 AuthContext: Retrying after database error (${retryCount + 1}/${maxRetries})`)
          clearTimeout(timeoutId)
          setIsFetchingTenants(false)
          setTimeout(() => fetchUserTenants(userId, retryCount + 1), 2000)
          return
        } else {
          // Max retries exceeded, set empty and complete
          console.warn('❌ AuthContext: Max retries exceeded after database error')
          setUserTenants([])
        }
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

        console.log(`✅ AuthContext: Successfully loaded ${memberships.length} tenant memberships`)
        logAuthPerformance('fetchUserTenants (success)', startTime, { tenants: memberships.length, attempt: retryCount + 1 })
      } else {
        // No memberships found - this is valid, complete successfully
        console.log('📝 AuthContext: No tenant memberships found (valid state)')
        setUserTenants([])
        logAuthPerformance('fetchUserTenants (no_tenants)', startTime, { tenants: 0, attempt: retryCount + 1 })
      }
    } catch (error) {
      console.error(`❌ AuthContext: Network/fatal error in fetchUserTenants (attempt ${retryCount + 1}):`, error)
      logAuthPerformance('fetchUserTenants (network_error)', startTime, {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: retryCount + 1
      })

      // Retry on network errors
      if (retryCount < maxRetries && error instanceof Error && !error.message.includes('aborted')) {
        console.log(`🔄 AuthContext: Retrying after network error (${retryCount + 1}/${maxRetries})`)
        clearTimeout(timeoutId)
        setIsFetchingTenants(false)
        setTimeout(() => fetchUserTenants(userId, retryCount + 1), 3000)
        return
      } else {
        // Max retries or aborted, set empty and complete
        console.warn('❌ AuthContext: Completing with empty tenant state after network error')
        setUserTenants([])
      }
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