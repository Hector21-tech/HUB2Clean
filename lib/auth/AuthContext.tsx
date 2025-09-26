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

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔐 AuthContext: Starting session initialization...')

      if (!supabase) {
        console.warn('⚠️ AuthContext: Supabase client not available')
        setLoading(false)
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ AuthContext: Error getting session:', error)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        // Development mode: Set test tenant immediately
        if (session?.user && process.env.NODE_ENV === 'development') {
          console.log('🚧 AuthContext: Setting development tenant')
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

        if (session?.user) {
          // Fetch user's tenant memberships
          await fetchUserTenants(session.user.id)
        }

        setLoading(false)
        console.log('✅ AuthContext: Session initialization complete')
      } catch (error) {
        console.error('❌ AuthContext: Fatal auth error:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes only if supabase is available
    if (!supabase) {
      return () => {} // Return empty cleanup function
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state change:', event)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserTenants(session.user.id)
        } else {
          setUserTenants([])
          setCurrentTenant(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user's tenant memberships
  const fetchUserTenants = async (userId: string) => {
    // Development mode: Use test tenant directly
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 AuthContext: Development mode - using test tenant')
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
      if (!currentTenant) {
        setCurrentTenant('test-tenant-demo')
      }
      return
    }

    if (!supabase) {
      console.warn('⚠️ AuthContext: Supabase client not available for fetching tenants')
      setUserTenants([])
      return
    }

    try {
      console.log('🔍 AuthContext: Fetching tenant memberships for user:', userId)

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
        setUserTenants([])
        return
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ AuthContext: No tenant memberships found for user:', userId)
        setUserTenants([])
        return
      }

      const memberships = data.map((item: any) => ({
        tenantId: item.tenantId,
        role: item.role,
        tenant: Array.isArray(item.tenant) ? item.tenant[0] : item.tenant
      })) as TenantMembership[]

      console.log('✅ AuthContext: Found tenant memberships:', memberships.length)
      setUserTenants(memberships)

      // Set current tenant to first available if none set
      if (memberships.length > 0 && !currentTenant) {
        console.log('🏢 AuthContext: Setting current tenant:', memberships[0].tenantId)
        setCurrentTenant(memberships[0].tenantId)
      }
    } catch (error) {
      console.error('❌ AuthContext: Error in fetchUserTenants:', error)
      setUserTenants([])
    }
  }

  // Sign out function
  const signOut = async () => {
    if (!supabase) {
      console.warn('⚠️ AuthContext: Supabase client not available for sign out')
      setUser(null)
      setSession(null)
      setUserTenants([])
      setCurrentTenant(null)
      return
    }

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
    tenantSlug: tenantData?.tenant?.slug,
    tenant: tenantData?.tenant,
    role: tenantData?.role,
    hasAccess: !!tenantData
  }
}