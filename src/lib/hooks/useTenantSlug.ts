'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

/**
 * Hook to get current tenant information from URL slug
 * Returns tenant ID, slug, and tenant data from auth context
 */
export function useTenantSlug() {
  const params = useParams()

  // Safe auth hook usage with fallback
  let userTenants: any[] = []
  let currentTenant: string | null = null
  let setCurrentTenant: (tenantId: string) => void = () => {}

  try {
    const authData = useAuth()
    userTenants = authData.userTenants || []
    currentTenant = authData.currentTenant
    setCurrentTenant = authData.setCurrentTenant
  } catch (error) {
    console.warn('⚠️ useTenantSlug: Auth context not available, using fallback mode')
  }

  const tenantSlug = params?.tenant as string

  // Development mode: Return current tenant directly
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_ENABLED === 'true') {
    // Map specific tenant slugs to their correct IDs
    let mappedTenantId = currentTenant || tenantSlug || 'test-tenant-demo'

    if (tenantSlug === 'elite-sports-group') {
      mappedTenantId = 'cmfsiuhqx0000cjc7aztz3oin'
    }

    const devTenant = userTenants.find(t => t.tenantId === mappedTenantId)
    return {
      tenantSlug,
      tenantId: mappedTenantId,
      tenant: devTenant?.tenant || null,
      role: devTenant?.role || 'OWNER',
      hasAccess: true // Always allow access in development
    }
  }

  // Find tenant by slug from user's memberships
  const tenantData = userTenants.find(
    membership => membership.tenant.slug === tenantSlug
  )

  // Auto-set current tenant if it matches the URL and is different
  if (tenantData && currentTenant !== tenantData.tenantId) {
    setCurrentTenant(tenantData.tenantId)
  }

  // Fallback: If auth context is not available, provide basic functionality
  if (!userTenants.length && tenantSlug) {
    // Map specific tenant slugs to their correct IDs even in fallback mode
    let fallbackTenantId = tenantSlug
    if (tenantSlug === 'elite-sports-group') {
      fallbackTenantId = 'cmfsiuhqx0000cjc7aztz3oin'
    }

    return {
      tenantSlug,
      tenantId: fallbackTenantId,
      tenant: null,
      role: 'OWNER', // Default role for fallback
      hasAccess: true // Allow access in fallback mode
    }
  }

  return {
    tenantSlug,
    tenantId: tenantData?.tenantId || null,
    tenant: tenantData?.tenant || null,
    role: tenantData?.role || null,
    hasAccess: !!tenantData
  }
}