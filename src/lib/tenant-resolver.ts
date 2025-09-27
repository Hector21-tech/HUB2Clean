// src/lib/tenant-resolver.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Utility function to check if a string is a valid ID (UUID or CUID)
 * CUID format: starts with 'c' followed by base36 characters, 25 chars total
 * UUID format: standard hyphenated format
 */
function isUUID(str: string): boolean {
  // Standard UUID format with dashes
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // CUID format: starts with 'c', 25 characters total, base36 characters
  const cuidRegex = /^c[0-9a-z]{24}$/i;

  return uuidRegex.test(str) || cuidRegex.test(str);
}

/**
 * Resolve tenant parameter to tenant ID
 * Handles both UUID (direct) and slug (lookup) formats
 */
export async function resolveTenantId(
  tenantParam: string,
  supabase: any
): Promise<string> {
  console.log('🔍 resolveTenantId: Starting resolution', {
    input: tenantParam,
    isUUID: isUUID(tenantParam)
  });

  // If input is already a UUID, return directly
  if (isUUID(tenantParam)) {
    console.log('✅ resolveTenantId: Input is UUID, returning directly');
    return tenantParam;
  }

  // Otherwise, lookup by slug in tenants table
  console.log('🔍 resolveTenantId: Looking up tenant by slug...');
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', tenantParam)
    .single();

  console.log('🔍 resolveTenantId: Slug lookup result', {
    requestedSlug: tenantParam,
    foundTenant: data,
    error: error?.message
  });

  if (error || !data) {
    const errorMsg = `Tenant not found for slug: ${tenantParam}`;
    console.error('❌ resolveTenantId: Resolution failed', {
      slug: tenantParam,
      error: error?.message,
      errorCode: error?.code
    });
    throw new Error(errorMsg);
  }

  console.log('✅ resolveTenantId: Successfully resolved', {
    slug: tenantParam,
    resolvedId: data.id,
    tenantName: data.name
  });

  return data.id;
}

/**
 * Validate that user has access to the specified tenant
 */
export async function validateTenantMembership(
  userId: string,
  tenantId: string,
  supabase: any
): Promise<boolean> {
  console.log('🔍 validateTenantMembership: Checking membership', {
    userId,
    tenantId
  });

  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('tenantId, userId, role')
    .eq('userId', userId)
    .eq('tenantId', tenantId)
    .single();

  console.log('🔍 validateTenantMembership: Result', {
    userId,
    tenantId,
    hasMembership: !!data,
    role: data?.role,
    error: error?.message
  });

  return !!data && !error;
}