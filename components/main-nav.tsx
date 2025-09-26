'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/AuthContext'
import { useTheme } from '@/lib/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MainNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Navigation routes for Scout Hub
  const routes: Array<{ href: string; label: string; active: boolean; disabled?: boolean }> = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      active: pathname === '/dashboard'
    },
    {
      href: '/players',
      label: 'Players',
      active: pathname === '/players'
    },
    {
      href: '/requests',
      label: 'Requests',
      active: pathname === '/requests'
    },
    {
      href: '/trials',
      label: 'Trials',
      active: pathname === '/trials'
    },
    {
      href: '/calendar',
      label: 'Calendar',
      active: pathname === '/calendar'
    },
  ]

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        {/* Logo/Brand */}
        <div className="mr-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Scout Hub</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                route.active
                  ? 'text-foreground'
                  : 'text-muted-foreground',
                route.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="h-8 w-8 px-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.user_metadata?.firstName || 'User'}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-8 w-8 px-0"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t bg-background"
        >
          <nav className="flex flex-col space-y-2 p-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md',
                  route.active
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground',
                  route.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}