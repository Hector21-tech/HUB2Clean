'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

/**
 * Hook to get current tenant information from URL slug
 * Returns tenant ID, slug, and tenant data from auth context
 */
export function useTenantSlug() {
  const params = useParams()
  const { userTenants, currentTenant, setCurrentTenant } = useAuth()

  const tenantSlug = params?.tenant as string

  // Development mode: Return current tenant directly
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_ENABLED === 'true') {
    console.log('🚧 useTenantSlug: Development mode - using currentTenant:', currentTenant)
    const devTenant = userTenants.find(t => t.tenantId === currentTenant)
    return {
      tenantSlug,
      tenantId: currentTenant,
      tenant: devTenant?.tenant || null,
      role: devTenant?.role || 'OWNER',
      hasAccess: !!currentTenant
    }
  }

  // Find tenant by slug from user's memberships
  const tenantData = userTenants.find(
    membership => membership.tenant.slug === tenantSlug
  )

  // 🚀 MOBILE DEBUG: Enhanced logging for tenant resolution issues
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_TENANT_SLUG === '1') {
    console.log('🔍 useTenantSlug Debug:', {
      tenantSlug,
      userTenants: userTenants.map(t => ({ slug: t.tenant.slug, id: t.tenantId })),
      found: !!tenantData,
      tenantId: tenantData?.tenantId,
      // 📱 Mobile-specific debug info
      isMobile: typeof window !== 'undefined' ? /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : false,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'SSR',
      windowSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'
    })
  }

  // 🛡️ MOBILE FALLBACK: If no tenant found but we have userTenants, try first available
  if (!tenantData && userTenants.length > 0 && tenantSlug) {
    console.warn('⚠️ Mobile Fallback: No exact tenant match, available tenants:',
      userTenants.map(t => ({ slug: t.tenant.slug, id: t.tenantId }))
    )
  }

  // Auto-set current tenant if it matches the URL and is different
  if (tenantData && currentTenant !== tenantData.tenantId) {
    setCurrentTenant(tenantData.tenantId)
  }

  return {
    tenantSlug,
    tenantId: tenantData?.tenantId || null,
    tenant: tenantData?.tenant || null,
    role: tenantData?.role || null,
    hasAccess: !!tenantData
  }
}