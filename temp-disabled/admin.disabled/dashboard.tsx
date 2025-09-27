'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2, Users, Database, BarChart3, Activity, Shield } from 'lucide-react';
import Link from 'next/link';
import { deleteSubdomainAction } from '@/app/actions';
import { rootDomain, protocol } from '@/lib/utils';

type Tenant = {
  subdomain: string;
  emoji: string;
  createdAt: number;
};

type DeleteState = {
  error?: string;
  success?: string;
};

function SystemOverview() {
  const [metrics] = useState([
    { label: 'Total Tenants', value: '--', description: 'Scout Hub organizations', icon: Users },
    { label: 'Active Users', value: '--', description: 'Users active in last 30 days', icon: Activity },
    { label: 'Total Players', value: '--', description: 'Player profiles across all tenants', icon: BarChart3 },
    { label: 'Database Health', value: 'OK', description: 'PostgreSQL status', icon: Database },
    { label: 'Auth Status', value: 'OK', description: 'Supabase authentication', icon: Shield },
    { label: 'API Health', value: 'OK', description: 'All endpoints operational', icon: Activity }
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card key={index} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-mono font-bold text-foreground mt-1">
                    {metric.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <div className="ml-4">
                  <IconComponent className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DashboardHeader() {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scout Hub Admin</h1>
        <p className="text-muted-foreground mt-1">Manage tenants, users, and system health</p>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {rootDomain}
        </Link>
      </div>
    </div>
  );
}

function TenantGrid({
  tenants,
  action,
  isPending
}: {
  tenants: Tenant[];
  action: (formData: FormData) => void;
  isPending: boolean;
}) {
  if (tenants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No Scout Hub organizations have been created yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Scout organizations will appear here once created.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tenants.map((tenant) => (
        <Card key={tenant.subdomain} className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-foreground">{tenant.subdomain}</CardTitle>
              <form action={action}>
                <input
                  type="hidden"
                  name="subdomain"
                  value={tenant.subdomain}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{tenant.emoji}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>Created: {new Date(tenant.createdAt).toLocaleDateString()}</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline text-sm font-medium"
              >
                Visit Scout Hub →
              </a>
              <div className="text-xs text-muted-foreground">
                {tenant.subdomain}.{rootDomain}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminDashboard({ tenants }: { tenants: Tenant[] }) {
  const [state, action, isPending] = useActionState<DeleteState, FormData>(
    deleteSubdomainAction,
    {}
  );

  return (
    <div className="space-y-6 relative p-4 md:p-8">
      <DashboardHeader />
      <SystemOverview />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Scout Hub Organizations</h2>
          <div className="text-sm text-muted-foreground">
            {tenants.length} organization{tenants.length !== 1 ? 's' : ''}
          </div>
        </div>
        <TenantGrid tenants={tenants} action={action} isPending={isPending} />
      </div>

      {state.error && (
        <div className="fixed bottom-4 right-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg shadow-md">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-200 px-4 py-3 rounded-lg shadow-md">
          {state.success}
        </div>
      )}
    </div>
  );
}
