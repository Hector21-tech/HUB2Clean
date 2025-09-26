import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDevUser, isDevAuthAvailable } from '@/lib/auth/dev-auth'

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (_error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (_error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper function to get authenticated user
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Helper function to validate user has access to tenant
export async function validateTenantAccess(tenantId: string) {
  try {
    const user = await getUser()

    // Handle development authentication with explicit security checks
    if (!user && isDevAuthAvailable()) {
      const devUser = getDevUser(tenantId)
      if (devUser) {
        console.warn('🚧 DEVELOPMENT AUTH: Using development user authentication')
        return { user: devUser, role: devUser.role }
      }
    }

    if (!user) {
      throw new Error('Unauthorized: No user session')
    }

    // Check if user has membership in this tenant
    const supabase = await createClient()
    const { data: membership, error } = await supabase
      .from('tenant_memberships')
      .select('role')
      .eq('tenantId', tenantId)
      .eq('userId', user.id)
      .single()

    if (error || !membership) {
      console.error('Tenant access validation failed:', error?.message)
      throw new Error(`Unauthorized: User does not have access to tenant ${tenantId}`)
    }

    return { user, role: membership.role }
  } catch (error) {
    console.error('Tenant validation error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw error
    }
    throw new Error('Unauthorized: Tenant access validation failed')
  }
}