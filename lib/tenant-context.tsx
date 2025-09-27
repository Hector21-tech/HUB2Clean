'use client'

import { createContext, useContext, ReactNode } from 'react'

interface TenantContextType {
  tenantId: string
}

const TenantContext = createContext<TenantContextType | null>(null)

interface TenantProviderProps {
  tenantId: string
  children: ReactNode
}

export function TenantProvider({ tenantId, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ tenantId }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}