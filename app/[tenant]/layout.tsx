import { ReactNode } from 'react'
import { TenantProvider } from '@/lib/tenant-context'
import { ThemeProvider } from '@/lib/theme-provider'
import { MainNav } from '@/components/main-nav'
import { UserNav } from '@/components/user-nav'
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
          {/* Navigation Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-14 flex items-center">
              <MainNav tenant={tenant} />
              <div className="ml-auto">
                <UserNav />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </TenantProvider>
    </ThemeProvider>
  )
}