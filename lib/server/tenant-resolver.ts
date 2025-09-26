// Tenant resolution utilities for Scout Hub
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Utility function to check if a string is a valid ID (UUID or CUID)
 */
function isUUID(str: string): boolean {
  // Standard UUID format with dashes
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // CUID format: starts with 'c', 25 characters total, base36 characters
  const cuidRegex = /^c[0-9a-z]{24}$/i

  return uuidRegex.test(str) || cuidRegex.test(str)
}

/**
 * Resolve tenant parameter to tenant ID
 * Handles both UUID (direct) and slug (lookup) formats
 */
export async function resolveTenantId(
  tenantParam: string,
  supabase: SupabaseClient
): Promise<string> {
  console.log('🔍 resolveTenantId: Starting resolution', {
    input: tenantParam,
    isUUID: isUUID(tenantParam)
  })

  // If input is already a UUID, return directly
  if (isUUID(tenantParam)) {
    console.log('✅ resolveTenantId: Input is UUID, returning directly')
    return tenantParam
  }

  // Otherwise, lookup by slug in tenants table
  console.log('🔍 resolveTenantId: Looking up tenant by slug...')
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', tenantParam)
    .single()

  console.log('🔍 resolveTenantId: Slug lookup result', {
    requestedSlug: tenantParam,
    foundTenant: data,
    error: error?.message
  })

  if (error || !data) {
    throw new Error(`Tenant not found: ${tenantParam}`)
  }

  console.log('✅ resolveTenantId: Successfully resolved slug to ID', {
    slug: tenantParam,
    tenantId: data.id,
    tenantName: data.name
  })

  return data.id
}

/**
 * Validate that user has access to the specified tenant
 */
export async function validateTenantMembership(
  userId: string,
  tenantId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log('🔍 validateTenantMembership: Checking membership', {
    userId,
    tenantId
  })

  // Check tenant_memberships table using proper Prisma schema mapping
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('userId, tenantId, role')
    .eq('userId', userId)
    .eq('tenantId', tenantId)
    .single()

  if (error) {
    console.log('❌ validateTenantMembership: Membership check failed', {
      userId,
      tenantId,
      error: error.message
    })
    return false
  }

  console.log('✅ validateTenantMembership: User has access', {
    userId,
    tenantId,
    role: data?.role
  })

  return !!data
}