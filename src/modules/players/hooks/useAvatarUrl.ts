import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-config'

interface UseAvatarUrlProps {
  avatarPath?: string
  avatarUrl?: string  // Legacy fallback
  tenantId: string
  playerName?: string // Optional: for better fallback avatars
}

interface AvatarUrlData {
  url: string | null
  isLoading: boolean
  error: string | null
}

// Hook to get signed avatar URL from either new path or legacy URL
export function useAvatarUrl({ avatarPath, avatarUrl, tenantId, playerName }: UseAvatarUrlProps): AvatarUrlData {
  const [data, setData] = useState<AvatarUrlData>({
    url: null,
    isLoading: false,
    error: null
  })
  const [invalidationTrigger, setInvalidationTrigger] = useState(0)

  // Listen for cache invalidation events
  useEffect(() => {
    const callback = () => {
      setInvalidationTrigger(prev => prev + 1)
    }
    cacheInvalidationListeners.add(callback)
    return () => {
      cacheInvalidationListeners.delete(callback)
    }
  }, [])

  useEffect(() => {
    // If we have legacy avatarUrl, use it directly
    if (avatarUrl && !avatarPath) {
      setData({
        url: avatarUrl,
        isLoading: false,
        error: null
      })
      return
    }

    // If no path, no avatar
    if (!avatarPath) {
      setData({
        url: null,
        isLoading: false,
        error: null
      })
      return
    }

    // Fetch signed URL for path using cached function
    const fetchSignedUrl = async () => {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const url = await getCachedAvatarUrl(avatarPath, tenantId, playerName)

        setData({
          url,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching avatar URL:', error)
        setData({
          url: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load avatar'
        })
      }
    }

    fetchSignedUrl()
  }, [avatarPath, avatarUrl, tenantId, invalidationTrigger])

  return data
}

// Utility to determine the best avatar URL to use
export function getBestAvatarUrl(player: { avatarPath?: string; avatarUrl?: string }): string | null {
  // Prefer new path over legacy URL
  if (player.avatarPath) {
    return null // Will be resolved by useAvatarUrl hook
  }

  // Fall back to legacy URL
  return player.avatarUrl || null
}

// Cache for signed URLs to avoid repeated requests
const urlCache = new Map<string, { url: string; expiresAt: number }>()


export async function getCachedAvatarUrl(avatarPath: string, tenantId: string, playerName?: string): Promise<string | null> {
  const cacheKey = `${tenantId}:${avatarPath}`
  const cached = urlCache.get(cacheKey)

  // Return cached proxy URL if still valid (with 5 min buffer)
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.url
  }

  try {
    // 🚀 AVATAR PROXY: Use new proxy endpoint for CORS-free image streaming
    // Generate cache-busting hash for avatar changes
    const versionHash = Buffer.from(`${avatarPath}:${Date.now()}`).toString('base64').substring(0, 8)
    const proxyUrl = `/api/media/avatar-proxy?path=${encodeURIComponent(avatarPath)}&tenantId=${tenantId}&v=${versionHash}`

    // Test if the avatar exists by making a HEAD request to the proxy
    const headResponse = await apiFetch(proxyUrl, { method: 'HEAD' })

    if (headResponse.status === 404) {
      console.log(`Avatar file not found for path: ${avatarPath}`)
      return null
    }

    if (!headResponse.ok && headResponse.status !== 304) {
      throw new Error(`Avatar proxy error: ${headResponse.status}`)
    }

    // Cache the proxy URL (cache for 55 minutes for client-side efficiency)
    urlCache.set(cacheKey, {
      url: proxyUrl,
      expiresAt: Date.now() + 55 * 60 * 1000
    })

    return proxyUrl
  } catch (error) {
    console.error('Error fetching cached avatar URL:', error)

    // 🔄 FALLBACK: Try legacy signed URL endpoint as backup
    try {
      const response = await apiFetch(`/api/media/avatar-url?path=${encodeURIComponent(avatarPath)}&tenantId=${tenantId}`)

      if (response.ok) {
        const result = await response.json()
        if (result.url) {
          console.warn('Avatar proxy failed, using legacy signed URL fallback')
          return result.url
        }
      }
    } catch (fallbackError) {
      console.error('Legacy avatar URL fallback also failed:', fallbackError)
    }

    // 🚫 NO FALLBACK: Return null when avatar file doesn't exist
    console.warn(`Avatar file not found for path: ${avatarPath}, no fallback avatar will be shown`)
    return null
  }
}

// 🚀 ENTERPRISE CACHE: Enhanced cache invalidation functions
export function invalidateAvatarCache(avatarPath: string, tenantId: string) {
  const cacheKey = `${tenantId}:${avatarPath}`
  const deleted = urlCache.delete(cacheKey)

  if (process.env.NODE_ENV === 'development') {
    console.log(`🗑️ Avatar cache invalidation: ${cacheKey} ${deleted ? 'deleted' : 'not found'}`)
  }

  return deleted
}

export function invalidateAllAvatarCache() {
  urlCache.clear()
}

// Global cache invalidation trigger for React components
let cacheInvalidationKey = 0
const cacheInvalidationListeners = new Set<() => void>()

export function triggerAvatarCacheInvalidation() {
  cacheInvalidationKey++
  cacheInvalidationListeners.forEach(listener => listener())
}