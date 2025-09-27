'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '../lib/utils'

interface MainNavProps {
  tenant: string
}

export function MainNav({ tenant }: MainNavProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const routes: Array<{ href: string; label: string; active: boolean; disabled?: boolean }> = [
    {
      href: `/${tenant}/dashboard`,
      label: 'Dashboard',
      active: pathname === `/${tenant}/dashboard`
    },
    {
      href: `/${tenant}/players`,
      label: 'Players',
      active: pathname === `/${tenant}/players`
    },
    {
      href: `/${tenant}/requests`,
      label: 'Requests',
      active: pathname === `/${tenant}/requests`
    },
    {
      href: `/${tenant}/trials`,
      label: 'Trials',
      active: pathname === `/${tenant}/trials`
    },
    {
      href: `/${tenant}/calendar`,
      label: 'Calendar',
      active: pathname === `/${tenant}/calendar`
    },
  ]

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex items-center w-full relative" ref={mobileMenuRef}>
      {/* Logo */}
      <Link
        href={`/${tenant}/dashboard`}
        className="text-xl font-semibold text-gray-900 transition-all duration-200 hover:text-blue-600 mr-6"
      >
        Scout Hub
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-1">
        {routes.map((route) => (
          route.disabled ? (
            <span
              key={route.href}
              className="text-sm font-medium text-gray-400 cursor-not-allowed"
            >
              {route.label}
            </span>
          ) : (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm font-medium transition-all duration-200',
                route.active
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-blue-600'
              )}
            >
              {route.label}
            </Link>
          )
        ))}
      </nav>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 ml-auto"
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 md:hidden">
          <nav className="py-2">
            {routes.map((route) => (
              route.disabled ? (
                <span
                  key={route.href}
                  className="block px-4 py-3 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  {route.label}
                </span>
              ) : (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'block px-4 py-3 text-sm font-medium transition-all duration-200',
                    route.active
                      ? 'text-blue-600 font-semibold bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  )}
                >
                  {route.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}