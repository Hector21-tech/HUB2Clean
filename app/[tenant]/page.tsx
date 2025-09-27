'use client'

import { useTenant } from '@/lib/tenant-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TenantDashboard() {
  const { tenantId } = useTenant()

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Scout Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Tenant: <span className="font-bold text-blue-600">{tenantId}</span>
          </p>
          <p className="text-muted-foreground mt-2">
            Tenant routing is working! This page shows the dynamic tenant parameter.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}