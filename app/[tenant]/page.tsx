'use client'

import { useTenantSlug } from '@/lib/hooks/useTenantSlug'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TenantDashboard() {
  const { tenantSlug, tenantId } = useTenantSlug()

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Scout Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Tenant: <span className="font-bold text-blue-600">{tenantSlug}</span>
            {tenantId && <span className="text-sm text-gray-500 ml-2">({tenantId})</span>}
          </p>
          <p className="text-muted-foreground mt-2">
            Tenant routing is working! This page shows the dynamic tenant parameter.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}