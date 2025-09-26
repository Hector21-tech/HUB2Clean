/**
 * 🚧 DEVELOPMENT ONLY AUTHENTICATION HELPERS
 *
 * These functions provide secure development authentication that:
 * 1. Only work in development environment
 * 2. Require explicit environment variable configuration
 * 3. Log all development authentication attempts
 * 4. Never bypass real security in production
 */

interface DevUser {
  id: string
  email: string
  role: string
}

/**
 * Get development user - requires explicit configuration
 * Only works if DEV_AUTH_ENABLED=true is set in environment
 */
export function getDevUser(tenantId: string): DevUser | null {
  // Strict development environment check
  if (process.env.NODE_ENV !== 'development') {
    console.error('🚨 SECURITY VIOLATION: Dev auth attempted in non-development environment')
    return null
  }

  // Require explicit opt-in for development authentication
  if (process.env.DEV_AUTH_ENABLED !== 'true') {
    console.warn('🔒 Development auth not enabled. Set DEV_AUTH_ENABLED=true to use dev auth.')
    return null
  }

  // Log development authentication usage
  console.warn(`🚧 DEVELOPMENT AUTH: Using dev user for tenant ${tenantId}`)
  console.warn('🚧 This should NEVER appear in production logs!')

  return {
    id: `dev-user-${tenantId}`,
    email: process.env.DEV_AUTH_EMAIL || 'dev@example.com',
    role: 'OWNER'
  }
}

/**
 * Check if development authentication is available and properly configured
 */
export function isDevAuthAvailable(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_AUTH_ENABLED === 'true'
  )
}

/**
 * Validate development authentication configuration
 */
export function validateDevAuthConfig(): { valid: boolean; message: string } {
  if (process.env.NODE_ENV !== 'development') {
    return {
      valid: false,
      message: 'Development auth is only available in development environment'
    }
  }

  if (process.env.DEV_AUTH_ENABLED !== 'true') {
    return {
      valid: false,
      message: 'Development auth not enabled. Set DEV_AUTH_ENABLED=true to enable.'
    }
  }

  return {
    valid: true,
    message: 'Development auth is properly configured'
  }
}