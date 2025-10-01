'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { Menu, X } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

// Admin access control
function isSystemAdmin(email?: string): boolean {
  if (!email) return false

  // Hardcoded admin emails - update with your email
  const adminEmails = [
    'batak@torstens.se',
    'hector@scouthub.com',
    'admin@scouthub.com',
    'test@test.com' // For development
  ]

  return adminEmails.includes(email.toLowerCase())
}

const adminMenuItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/tenants', label: 'Tenants', exact: false },
  { href: '/admin/users', label: 'Users', exact: false },
  { href: '/admin/support', label: 'Support', exact: false },
  { href: '/admin/system', label: 'System', exact: false }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, userTenants, currentTenant } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get tenant slug for "Back to App" link
  const tenantData = userTenants.find(t => t.tenantId === currentTenant)
  const backUrl = tenantData?.tenant?.slug ? `/${tenantData.tenant.slug}/dashboard` : '/dashboard'

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Check admin access
  if (!isSystemAdmin(user?.email)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header - Mobile Optimized */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Menu button (mobile) + Title */}
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <h1 className="text-lg sm:text-xl font-medium text-gray-900">Scout Hub Admin</h1>
                <span className="text-xs sm:text-sm text-gray-500">System Administration</span>
              </div>
            </div>

            {/* Right: User email + Back link - Hidden on small mobile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden md:block text-xs sm:text-sm text-gray-600 truncate max-w-[150px]">{user?.email}</span>
              <Link
                href={backUrl}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">← Back to App</span>
                <span className="sm:hidden">← Back</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar - Desktop: Always visible, Mobile: Overlay */}
        <nav className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          lg:transform-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          top-[57px] sm:top-[65px] lg:top-0
          min-h-[calc(100vh-57px)] sm:min-h-[calc(100vh-65px)] lg:min-h-[calc(100vh-73px)]
        `}>
          <div className="p-4">
            <ul className="space-y-1">
              {adminMenuItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href) && pathname !== '/admin'

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden top-[57px] sm:top-[65px]"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}