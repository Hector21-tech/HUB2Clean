'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

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
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-medium text-gray-900">Scout Hub Admin</h1>
              <span className="text-sm text-gray-500">System Administration</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Link
                href={backUrl}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}