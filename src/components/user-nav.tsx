'use client'

import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useAuth } from '../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, User, Settings, Building2, Shield } from 'lucide-react'

export function UserNav() {
  const { user, signOut, userTenants, currentTenant, setCurrentTenant } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSwitchTenant = (tenantId: string) => {
    setCurrentTenant(tenantId)
    const tenant = userTenants.find(t => t.tenantId === tenantId)
    if (tenant) {
      router.push(`/${tenant.tenant.slug}/dashboard`)
    }
  }

  if (!user) {
    return null
  }

  // Get user initials for avatar fallback
  const getInitials = (email: string) => {
    if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
      return `${user.user_metadata.firstName[0]}${user.user_metadata.lastName[0]}`.toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  const currentTenantData = userTenants.find(t => t.tenantId === currentTenant)

  // Check if user is system admin
  const isSystemAdmin = (email?: string): boolean => {
    if (!email) return false
    const adminEmails = [
      'batak@torstens.se',
      'hector@scouthub.com',
      'admin@scouthub.com',
      'test@test.com' // For development
    ]
    return adminEmails.includes(email.toLowerCase())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatarUrl} alt={user.email || ''} />
            <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.firstName && user.user_metadata?.lastName
                ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
                : user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {currentTenantData && (
              <p className="text-xs leading-none text-muted-foreground">
                {currentTenantData.tenant.name} • {currentTenantData.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          {isSystemAdmin(user?.email) && (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              System Admin
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {userTenants.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
            {userTenants.map((membership) => (
              <DropdownMenuItem
                key={membership.tenantId}
                onClick={() => handleSwitchTenant(membership.tenantId)}
                className={currentTenant === membership.tenantId ? "bg-accent" : ""}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm">{membership.tenant.name}</span>
                  <span className="text-xs text-muted-foreground">{membership.role}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}