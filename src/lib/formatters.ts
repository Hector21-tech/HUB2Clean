/**
 * Utility functions for formatting data in the Scout Hub application
 */

/**
 * Format currency values in a human-readable format
 * @param value - The currency value in euros
 * @returns Formatted currency string
 */
export function formatCurrency(value?: number): string {
  if (!value) return 'N/A'
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`
  return `€${value}`
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years or null if no date provided
 */
export function calculateAge(dateOfBirth?: Date): number | null {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * Format date in a readable format (English format for compatibility)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date?: Date): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Format date in Swedish format (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Formatted Swedish date string
 */
export function formatDateSwedish(date?: Date): string {
  if (!date) return 'Ej angivet'
  return new Date(date).toLocaleDateString('sv-SE')
}

/**
 * Format date and time for Swedish locale
 * @param date - Date to format
 * @returns Formatted Swedish date and time string
 */
export function formatDateTimeSwedish(date?: Date): string {
  if (!date) return 'Ej angivet'
  return new Date(date).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Convert Date to datetime-local input format (YYYY-MM-DDTHH:mm)
 * @param date - Date to convert
 * @returns ISO datetime string for input field
 */
export function toDateTimeLocalString(date?: Date): string {
  if (!date) return ''
  const d = new Date(date)
  // Adjust for timezone offset to get local time
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/**
 * Parse datetime-local string to Date object
 * @param dateTimeString - String from datetime-local input
 * @returns Date object
 */
export function fromDateTimeLocalString(dateTimeString: string): Date {
  return new Date(dateTimeString)
}

/**
 * Check if a contract is expiring within the next 6 months
 * @param contractExpiry - Contract expiry date
 * @returns True if contract expires within 6 months
 */
export function isContractExpiring(contractExpiry?: Date): boolean {
  if (!contractExpiry) return false
  const today = new Date()
  const expiry = new Date(contractExpiry)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry > 0 && daysUntilExpiry <= 180 // 6 months = ~180 days
}

/**
 * Get player initials for fallback avatar
 * @param firstName - Player's first name
 * @param lastName - Player's last name
 * @returns Formatted initials string
 */
export function getPlayerInitials(firstName?: string, lastName?: string): string {
  const firstInitial = firstName?.[0]?.toUpperCase() || ''
  const lastInitial = lastName?.[0]?.toUpperCase() || ''
  return `${firstInitial}${lastInitial}`
}

/**
 * Format player full name
 * @param firstName - Player's first name
 * @param lastName - Player's last name
 * @returns Formatted full name
 */
export function formatPlayerName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

/**
 * Format a number with appropriate precision
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 */
export function formatNumber(value?: number, decimals: number = 1): string {
  if (value === undefined || value === null) return 'N/A'
  return value.toFixed(decimals)
}