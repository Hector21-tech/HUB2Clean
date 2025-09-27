import { ReactNode } from 'react'
import { TenantProvider } from '@/lib/tenant-context'
import { ThemeProvider } from '@/lib/theme-provider'
import '../globals.css'

interface TenantLayoutProps {
  children: ReactNode
  params: Promise<{ tenant: string }>
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant } = await params

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TenantProvider tenantId={tenant}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </TenantProvider>
    </ThemeProvider>
  )
}