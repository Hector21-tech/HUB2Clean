/**
 * Shared API Cache Module
 *
 * Purpose: Centralized caching for ALL API endpoints to prevent stale data issues
 *
 * Key Features:
 * - Single source of truth: One cache Map shared across all endpoints
 * - Short TTL (30s): Fresh data while maintaining performance
 * - Smart invalidation: Mutations clear relevant cache keys
 * - Thread-safe: No race conditions between endpoints
 *
 * Why this works (vs old approach):
 * - OLD: Separate cache Maps per endpoint → invalidation didn't work
 * - NEW: Shared cache → invalidation works globally
 */

interface CacheEntry {
  data: any
  timestamp: number
}

class ApiCache {
  private cache: Map<string, CacheEntry>
  private readonly TTL: number

  constructor(ttlSeconds: number = 30) {
    this.cache = new Map()
    this.TTL = ttlSeconds * 1000 // Convert to milliseconds
  }

  /**
   * Get cached data if valid
   * @returns Data if cache hit, null if miss or expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)

    if (!entry) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Cache MISS: ${key}`)
      }
      return null
    }

    const age = Date.now() - entry.timestamp

    if (age > this.TTL) {
      // Expired - remove and return null
      this.cache.delete(key)
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏰ Cache EXPIRED: ${key} (age: ${Math.round(age / 1000)}s)`)
      }
      return null
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`)
    }
    return entry.data
  }

  /**
   * Set cache data
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 Cache SET: ${key}`)
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Cache INVALIDATE: ${key} (existed: ${deleted})`)
    }
  }

  /**
   * Invalidate all cache keys matching a pattern
   * Useful for invalidating all variants (e.g., all player queries for a tenant)
   */
  invalidatePattern(pattern: string): number {
    let deletedCount = 0
    const keysToDelete: string[] = []

    // Find all keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }

    // Delete them
    for (const key of keysToDelete) {
      this.cache.delete(key)
      deletedCount++
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Cache INVALIDATE PATTERN: ${pattern} (deleted: ${deletedCount} keys)`)
    }

    return deletedCount
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Cache CLEAR ALL (deleted: ${size} keys)`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      ttlSeconds: this.TTL / 1000
    }
  }
}

// Export singleton instance with 30s TTL
export const apiCache = new ApiCache(30)

// Helper function to generate consistent cache keys
export function generateCacheKey(
  endpoint: string,
  tenantId: string,
  filters?: Record<string, any>
): string {
  const baseKey = `${endpoint}-${tenantId}`

  if (!filters || Object.keys(filters).length === 0) {
    return baseKey
  }

  // Sort filters for consistent cache keys
  const sortedFilters = Object.keys(filters)
    .sort()
    .map(key => `${key}:${filters[key]}`)
    .join('|')

  return `${baseKey}-${sortedFilters}`
}
