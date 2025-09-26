// Server-side authorization utilities for Scout Hub
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { resolveTenantId, validateTenantMembership } from './tenant-resolver'

type AuthResult =
  | { ok: true; user: any; tenantId: string; tenantSlug?: string }
  | { ok: false; status: 400 | 401 | 403 | 404 | 500; message: string }

export async function requireTenant(ctx: { request: Request }): Promise<AuthResult> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (_error) {
            // Handle server component cookie setting
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (_error) {
            // Handle server component cookie removal
          }
        },
      },
    }
  )

  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    console.log('🔍 requireTenant: Auth check', {
      hasUser: !!user,
      userId: user?.id,
      authError: authErr?.message
    })

    if (authErr || !user) {
      console.log('❌ requireTenant: Auth failed', authErr)
      return { ok: false, status: 401, message: 'Not authenticated' }
    }

    // Step 2: Get tenant parameter
    const url = new URL(ctx.request.url)
    const tenantParam = url.searchParams.get('tenant') ?? undefined

    console.log('🔍 requireTenant: Request analysis', {
      url: ctx.request.url,
      tenantParam,
      method: ctx.request.method
    })

    if (!tenantParam) {
      console.log('❌ requireTenant: No tenant parameter provided')
      return { ok: false, status: 400, message: 'Tenant parameter is required' }
    }

    // Step 3: Resolve tenant slug/ID to actual tenant ID
    let resolvedTenantId: string
    try {
      resolvedTenantId = await resolveTenantId(tenantParam, supabase)
    } catch (error: any) {
      console.log('❌ requireTenant: Tenant resolution failed', {
        tenantParam,
        error: error.message
      })
      return { ok: false, status: 404, message: `Tenant not found: ${tenantParam}` }
    }

    // Step 4: Validate user access to tenant
    const hasAccess = await validateTenantMembership(user.id, resolvedTenantId, supabase)
    if (!hasAccess) {
      console.log('❌ requireTenant: Access denied', {
        userId: user.id,
        tenantId: resolvedTenantId,
        tenantParam
      })
      return { ok: false, status: 403, message: 'Access denied to this tenant' }
    }

    console.log('✅ requireTenant: Authorization successful', {
      userId: user.id,
      tenantParam,
      resolvedTenantId
    })

    return {
      ok: true,
      user,
      tenantId: resolvedTenantId,
      tenantSlug: tenantParam
    }

  } catch (error: any) {
    console.error('💥 requireTenant: Unexpected error', error)
    return { ok: false, status: 500, message: 'Internal server error' }
  }
}

/**
 * Simple auth check without tenant validation
 */
export async function requireAuth(): Promise<
  | { ok: true; user: any }
  | { ok: false; status: 401; message: string }
> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (_error) {
            // Handle server component cookie setting
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (_error) {
            // Handle server component cookie removal
          }
        },
      },
    }
  )

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return { ok: false, status: 401, message: 'Not authenticated' }
  }

  return { ok: true, user }
}