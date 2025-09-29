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
    // Get initial session - simplified and fast
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

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

        setLoading(false)
      } catch (error) {
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

  // Fetch user's tenant memberships - simplified and fast
  const fetchUserTenants = async (userId: string) => {
    // Development mode: Use test tenant directly (ONLY in development)
    if (process.env.NODE_ENV === 'development' &&
        process.env.VERCEL_ENV !== 'production' &&
        process.env.DEV_AUTH_ENABLED === 'true') {
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

    // Prevent duplicate calls
    if (isFetchingTenants || userTenants.length > 0) {
      return
    }

    setIsFetchingTenants(true)

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
        // Try auto-setup only if no existing data
        if (!userTenants.length) {
          try {
            const response = await fetch('/api/setup-user-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            const result = await response.json()
            if (result.success) {
              // Retry once after setup
              setTimeout(() => fetchUserTenants(userId), 500)
              return
            }
          } catch (setupError) {
            console.error('❌ AuthContext: Setup failed:', setupError)
          }
        }
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
      } else {
        // No memberships found - try auto-setup once
        try {
          const response = await fetch('/api/setup-user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          const result = await response.json()
          if (result.success) {
            // Retry once after setup
            setTimeout(() => fetchUserTenants(userId), 500)
            return
          }
        } catch (setupError) {
          console.error('❌ AuthContext: Setup failed:', setupError)
        }
        setUserTenants([])
      }
    } catch (error) {
      console.error('❌ AuthContext: Fatal error in fetchUserTenants:', error)
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