'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { AuthProvider } from '../src/lib/auth/AuthContext'
import { ThemeProvider } from '@/lib/theme-provider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient inside component to avoid SSR issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes before considering it stale
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Keep data in cache for 10 minutes after component unmounts
        gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
        // Don't refetch on window focus to avoid unnecessary requests
        refetchOnWindowFocus: false,
        // Retry failed requests up to 1 time
        retry: 1,
        // Show cached data while fetching fresh data in background
        refetchOnMount: 'always',
      },
    },
  }))

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}