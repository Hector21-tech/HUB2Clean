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

      {/* Page Content with Consistent Background */}
      <main className="flex-1 bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] relative">
        {/* Ultra-deep ocean effect with radial gradients */}
        <div className="absolute inset-0 bg-radial-gradient from-[#1e40af]/10 via-transparent to-[#0c1532]/20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 to-transparent pointer-events-none"></div>
        {children}
      </main>
    </div>
  )
}