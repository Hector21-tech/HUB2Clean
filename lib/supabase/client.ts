import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Ensure we have environment variables before creating client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase environment variables not found')
    return null
  }

  return createBrowserClient(url, key)
}

// Export a default client instance that's safe during build
export const supabase = (() => {
  try {
    return createClient()
  } catch (error) {
    console.warn('Failed to create Supabase client during build:', error)
    return null
  }
})()