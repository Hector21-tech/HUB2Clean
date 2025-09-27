import { MainNav } from '@/components/main-nav'
import { UserNav } from '@/components/user-nav'

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{
    tenant: string
  }>
}

export default async function TenantLayout({
  children,
  params
}: TenantLayoutProps) {
  // Handle Next.js 15 async params
  const { tenant } = await params

  return (
    <div className="flex min-h-screen flex-col">
      {/* Centralized Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex h-16 items-center px-4">
          <MainNav tenant={tenant} />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}