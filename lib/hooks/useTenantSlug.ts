import { useTenant } from '@/lib/tenant-context'

export function useTenantSlug() {
  const { tenantId } = useTenant()

  return {
    tenantSlug: tenantId,  // For compatibility with HUB2-Innankaos
    tenantId: tenantId
  }
}