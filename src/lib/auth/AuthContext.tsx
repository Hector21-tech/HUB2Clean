'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
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
  const [loading, setLoading] = useState(true)
  const [userTenants, setUserTenants] = useState<TenantMembership[]>([])
  const [currentTenant, setCurrentTenant] = useState<string | null>(null)
  const [isFetchingTenants, setIsFetchingTenants] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      console.log('🔐 AuthContext: Starting session initialization...')

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⏰ AuthContext: Session timeout after 10 seconds, setting loading to false')
        setLoading(false)
      }, 10000) // 10 second timeout (increased from 5)

      try {
        console.log('🔐 AuthContext: Getting session from Supabase...')

        // First try to get session
        const sessionStart = Date.now()
        const { data: { session }, error } = await supabase.auth.getSession()
        const sessionDuration = Date.now() - sessionStart

        clearTimeout(timeoutId) // Clear timeout if we get a response

        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 AuthContext: Session result:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            error: error?.message,
            duration: `${sessionDuration}ms`
          })
        }

        if (error) {
          console.error('❌ AuthContext: Error getting session:', error)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        // Development mode: Set tenant immediately (ONLY in development)
        if (session?.user &&
            process.env.NODE_ENV === 'development' &&
            process.env.VERCEL_ENV !== 'production' &&
            process.env.DEV_AUTH_ENABLED === 'true') {
          console.log('🚧 AuthContext: Setting development tenant immediately')
          setCurrentTenant('test-tenant-demo')
          const mockTenants: TenantMembership[] = [{
            tenantId: 'test-tenant-demo',
            role: 'OWNER',
            tenant: {
              id: 'test-tenant-demo',
              name: 'Test Scout Hub',
              slug: 'test-scout-hub'
            }
          }]
          setUserTenants(mockTenants)
        }

        // Don't fetch tenants here - let onAuthStateChange handle it
        if (session?.user) {
          console.log('🔐 AuthContext: User found in initial session')
        } else {
          console.log('🔐 AuthContext: No user found in session')
        }

        setLoading(false)
        console.log('✅ AuthContext: Session initialization complete')
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('❌ AuthContext: Fatal auth error:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Ensure user exists in database
          await ensureUserInDatabase(session.user)
          // Fetch user's tenant memberships
          await fetchUserTenants(session.user.id)
        } else {
          setUserTenants([])
          setCurrentTenant(null)
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

  // Fetch user's tenant memberships
  const fetchUserTenants = async (userId: string) => {
    // Development mode: Use test tenant directly (ONLY in development)
    if (process.env.NODE_ENV === 'development' &&
        process.env.VERCEL_ENV !== 'production' &&
        process.env.DEV_AUTH_ENABLED === 'true') {
      console.log('🚧 AuthContext: Development mode - using test-tenant-demo')
      const mockTenants: TenantMembership[] = [{
        tenantId: 'test-tenant-demo',
        role: 'OWNER',
        tenant: {
          id: 'test-tenant-demo',
          name: 'Test Scout Hub',
          slug: 'test-scout-hub'
        }
      }]
      setUserTenants(mockTenants)
      setCurrentTenant('test-tenant-demo')
      return
    }

    // Prevent duplicate calls and skip if already have data
    if (isFetchingTenants) {
      console.log('🔍 AuthContext: Already fetching tenants, skipping...')
      return
    }

    if (userTenants.length > 0) {
      console.log('🔍 AuthContext: Already have tenant data, skipping fetch')
      return
    }

    console.log('🔍 AuthContext: fetchUserTenants started for user:', userId)
    setIsFetchingTenants(true)

    try {
      console.log('🔍 AuthContext: Executing Supabase query for tenant memberships...')
      const queryStart = Date.now()

      // Query with timeout and automatic fallback to setup
      const queryPromise = supabase
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

      let timeoutId: NodeJS.Timeout | undefined
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Query timeout - will auto-setup')), 10000)
      })

      let data, error
      try {
        const result = await Promise.race([queryPromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId) // Clear timeout when query succeeds
        data = result.data
        error = result.error
      } catch (timeoutError) {
        console.warn('🕐 AuthContext: Query timed out after 10 seconds, triggering auto-setup')
        // Trigger automatic setup immediately
        setIsFetchingTenants(false)
        setTimeout(async () => {
          try {
            const { apiFetch } = await import('@/lib/api-config')
            const response = await apiFetch('/api/setup-user-data', {
              method: 'POST'
            })
            const result = await response.json()
            if (result.success) {
              console.log('✅ AuthContext: Auto-setup completed, retrying...')
              setTimeout(() => fetchUserTenants(userId), 1000)
            }
          } catch (e) {
            console.error('❌ AuthContext: Auto-setup failed:', e)
          }
        }, 100)
        return
      }
      const queryDuration = Date.now() - queryStart
      console.log('📊 AuthContext: Query completed:', {
        duration: `${queryDuration}ms`,
        hasData: !!data,
        dataLength: data?.length,
        hasError: !!error,
        errorMessage: error?.message
      })

      if (error) {
        console.error('❌ AuthContext: Error fetching user tenants:', error)
        console.error('❌ AuthContext: Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        })

        // Check if this is an RLS issue or timeout
        if (error.message?.includes('RLS') || error.code === '42501' || error.message?.includes('timeout')) {
          console.warn('🔒 AuthContext: RLS policy issue or timeout detected - attempting fallback setup')

          // Try to call setup API to create tenant memberships
          try {
            console.log('🔧 AuthContext: Attempting automatic tenant setup...')
            const { apiFetch } = await import('@/lib/api-config')
            const response = await apiFetch('/api/setup-user-data', {
              method: 'POST'
            })
            const result = await response.json()

            if (result.success) {
              console.log('✅ AuthContext: Automatic setup successful, retrying query...')
              // Reset flag and retry immediately
              setIsFetchingTenants(false)
              setTimeout(() => fetchUserTenants(userId), 1000)
              return
            } else {
              console.error('❌ AuthContext: Automatic setup failed:', result.error)
            }
          } catch (setupError) {
            console.error('❌ AuthContext: Setup API call failed:', setupError)
          }
        }

        setUserTenants([])
        setIsFetchingTenants(false)
        return
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ AuthContext: No tenant memberships found for user:', userId)
        console.warn('⚠️ AuthContext: This could mean:')
        console.warn('   1. User has no tenant memberships')
        console.warn('   2. RLS policy is blocking the query')
        console.warn('   3. Database connection issue')

        // Try automatic setup for users with no memberships
        try {
          console.log('🔧 AuthContext: No memberships found, attempting automatic setup...')
          const response = await fetch('/api/setup-user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          const result = await response.json()

          if (result.success) {
            console.log('✅ AuthContext: Automatic setup successful, retrying query...')
            // Reset flag and retry
            setIsFetchingTenants(false)
            setTimeout(() => fetchUserTenants(userId), 1000)
            return
          } else {
            console.error('❌ AuthContext: Automatic setup failed:', result.error)
          }
        } catch (setupError) {
          console.error('❌ AuthContext: Setup API call failed:', setupError)
        }

        setUserTenants([])
        setIsFetchingTenants(false)
        return
      }

      // Process successful data response
      if (data && data.length > 0) {
        // Log raw data only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 AuthContext: Raw data from query:', data)
        }

        const memberships = data.map((item: any) => ({
          tenantId: item.tenantId,
          role: item.role,
          tenant: Array.isArray(item.tenant) ? item.tenant[0] : item.tenant
        })) as TenantMembership[]

        console.log('✅ AuthContext: Processed memberships:', `${memberships.length} found`)
        setUserTenants(memberships)

        // Set current tenant to first available if none set
        if (memberships.length > 0 && !currentTenant) {
          console.log('🏢 AuthContext: Setting current tenant:', memberships[0].tenantId)
          setCurrentTenant(memberships[0].tenantId)
        }

        // Success! Exit early - no need for auto-setup
        setIsFetchingTenants(false)
        return
      }
    } catch (error) {
      console.error('❌ AuthContext: Catch error in fetchUserTenants:', error)
      console.error('❌ AuthContext: Error type:', typeof error)
      console.error('❌ AuthContext: Error constructor:', error?.constructor?.name)
      if (error instanceof Error) {
        console.error('❌ AuthContext: Error stack:', error.stack)
      }
      setUserTenants([])
    } finally {
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