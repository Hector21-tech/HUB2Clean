/**
 * Dynamic Transfer Window System for Football Leagues
 *
 * Each country has two transfer windows per year with fixed month/day dates.
 * Years are calculated dynamically so the system works forever without updates.
 *
 * Source: https://fotbolltransfers.com/nyheter/nar-oppnar-och-stanger-transferfonstret/1468
 */

// Template for storing window dates (month/day only, year calculated dynamically)
export interface TransferWindowTemplate {
  name: 'summer' | 'winter'
  openMonth: number  // 1-12
  openDay: number    // 1-31
  closeMonth: number // 1-12
  closeDay: number   // 1-31
}

// Actual transfer window with calculated dates
export interface TransferWindow {
  name: 'summer' | 'winter'
  openDate: string // ISO date format: YYYY-MM-DD
  closeDate: string // ISO date format: YYYY-MM-DD
}

export interface CountryWindowsTemplate {
  country: string
  windows: {
    summer: TransferWindowTemplate
    winter: TransferWindowTemplate
  }
}

export interface CountryWindows {
  country: string
  windows: {
    summer: TransferWindow
    winter: TransferWindow
  }
}

/**
 * Transfer Window Templates (month/day only - year calculated automatically)
 * These dates are the same every year for each country
 */
export const TRANSFER_WINDOW_TEMPLATES: Record<string, CountryWindowsTemplate> = {
  'Sweden': {
    country: 'Sweden',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 8, closeMonth: 8, closeDay: 29 },
      winter: { name: 'winter', openMonth: 1, openDay: 29, closeMonth: 3, closeDay: 25 }
    }
  },
  'England': {
    country: 'England',
    windows: {
      summer: { name: 'summer', openMonth: 6, openDay: 16, closeMonth: 9, closeDay: 1 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 2 }
    }
  },
  'Spain': {
    country: 'Spain',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 9, closeDay: 1 },
      winter: { name: 'winter', openMonth: 1, openDay: 2, closeMonth: 2, closeDay: 2 }
    }
  },
  'Germany': {
    country: 'Germany',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 9, closeDay: 1 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 2 }
    }
  },
  'Italy': {
    country: 'Italy',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 9, closeDay: 1 },
      winter: { name: 'winter', openMonth: 1, openDay: 2, closeMonth: 2, closeDay: 2 }
    }
  },
  'France': {
    country: 'France',
    windows: {
      summer: { name: 'summer', openMonth: 6, openDay: 16, closeMonth: 9, closeDay: 1 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 2 }
    }
  },
  'Denmark': {
    country: 'Denmark',
    windows: {
      summer: { name: 'summer', openMonth: 6, openDay: 16, closeMonth: 9, closeDay: 1 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 2 }
    }
  },
  'Norway': {
    country: 'Norway',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 11, closeMonth: 9, closeDay: 2 },
      winter: { name: 'winter', openMonth: 1, openDay: 30, closeMonth: 3, closeDay: 27 }
    }
  },
  'Finland': {
    country: 'Finland',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 8, closeDay: 25 },
      winter: { name: 'winter', openMonth: 2, openDay: 5, closeMonth: 4, closeDay: 1 }
    }
  },
  'Saudi Arabia': {
    country: 'Saudi Arabia',
    windows: {
      summer: { name: 'summer', openMonth: 6, openDay: 15, closeMonth: 9, closeDay: 2 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 3 }
    }
  },
  'UAE': {
    country: 'UAE',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 9, closeDay: 10 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 7 }
    }
  },
  'Turkey': {
    country: 'Turkey',
    windows: {
      summer: { name: 'summer', openMonth: 6, openDay: 10, closeMonth: 9, closeDay: 13 },
      winter: { name: 'winter', openMonth: 1, openDay: 6, closeMonth: 2, closeDay: 14 }
    }
  },
  'Egypt': {
    country: 'Egypt',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 9, closeDay: 30 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 28 }
    }
  },
  'Morocco': {
    country: 'Morocco',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 9, closeDay: 30 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 2, closeDay: 28 }
    }
  },
  'South Africa': {
    country: 'South Africa',
    windows: {
      summer: { name: 'summer', openMonth: 7, openDay: 1, closeMonth: 9, closeDay: 30 },
      winter: { name: 'winter', openMonth: 1, openDay: 1, closeMonth: 3, closeDay: 31 }
    }
  }
}

/**
 * Build a date from month/day and year
 */
function buildDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day) // month is 0-indexed in Date constructor
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert a template to actual TransferWindow with calculated year
 *
 * Logic:
 * - Summer windows: If we're past the close date this year, use next year
 * - Winter windows: Always in next calendar year (since they come after summer)
 */
function templateToWindow(
  template: TransferWindowTemplate,
  referenceDate: Date = new Date()
): TransferWindow {
  const currentYear = referenceDate.getFullYear()

  if (template.name === 'summer') {
    // Build summer window for current year
    const summerOpen = buildDate(currentYear, template.openMonth, template.openDay)
    const summerClose = buildDate(currentYear, template.closeMonth, template.closeDay)

    // If we're past summer close, use next year's summer
    if (referenceDate > summerClose) {
      return {
        name: 'summer',
        openDate: toISODateString(buildDate(currentYear + 1, template.openMonth, template.openDay)),
        closeDate: toISODateString(buildDate(currentYear + 1, template.closeMonth, template.closeDay))
      }
    }

    return {
      name: 'summer',
      openDate: toISODateString(summerOpen),
      closeDate: toISODateString(summerClose)
    }
  } else {
    // Winter window
    // Build winter for current year
    const winterOpen = buildDate(currentYear, template.openMonth, template.openDay)
    const winterClose = buildDate(currentYear, template.closeMonth, template.closeDay)

    // If we're past winter close or currently in summer/fall, use next year's winter
    if (referenceDate > winterClose) {
      return {
        name: 'winter',
        openDate: toISODateString(buildDate(currentYear + 1, template.openMonth, template.openDay)),
        closeDate: toISODateString(buildDate(currentYear + 1, template.closeMonth, template.closeDay))
      }
    }

    return {
      name: 'winter',
      openDate: toISODateString(winterOpen),
      closeDate: toISODateString(winterClose)
    }
  }
}

/**
 * Get country windows with dynamically calculated years
 */
function getCountryWindows(country: string, referenceDate: Date = new Date()): CountryWindows | null {
  const template = TRANSFER_WINDOW_TEMPLATES[country]

  if (!template) {
    return null
  }

  return {
    country: template.country,
    windows: {
      summer: templateToWindow(template.windows.summer, referenceDate),
      winter: templateToWindow(template.windows.winter, referenceDate)
    }
  }
}

/**
 * Get the active or next transfer window for a specific country
 *
 * @param country - Country name (e.g., "Sweden", "England")
 * @param date - Reference date (defaults to today)
 * @returns The active or next transfer window, or null if country not found
 */
export function getActiveTransferWindow(
  country: string,
  date: Date = new Date()
): { window: TransferWindow; isActive: boolean } | null {
  const countryWindows = getCountryWindows(country, date)

  if (!countryWindows) {
    console.warn(`No transfer window data found for country: ${country}`)
    return null
  }

  const { summer, winter } = countryWindows.windows

  // Convert window dates to Date objects
  const summerOpen = new Date(summer.openDate)
  const summerClose = new Date(summer.closeDate)
  const winterOpen = new Date(winter.openDate)
  const winterClose = new Date(winter.closeDate)

  // Check if currently in summer window
  if (date >= summerOpen && date <= summerClose) {
    return { window: summer, isActive: true }
  }

  // Check if currently in winter window
  if (date >= winterOpen && date <= winterClose) {
    return { window: winter, isActive: true }
  }

  // No active window - find the next upcoming window
  // Determine which window comes next
  if (date < summerOpen) {
    // Before summer - summer is next
    return { window: summer, isActive: false }
  } else if (date > summerClose && date < winterOpen) {
    // Between summer and winter - winter is next
    return { window: winter, isActive: false }
  } else {
    // After winter close - next summer
    // Recalculate with next year to get upcoming summer
    const nextYearWindows = getCountryWindows(country, new Date(date.getFullYear() + 1, 6, 1))
    if (nextYearWindows) {
      return { window: nextYearWindows.windows.summer, isActive: false }
    }
  }

  return null
}

/**
 * Get window dates for a specific country and window type
 *
 * @param country - Country name
 * @param windowType - 'summer' or 'winter'
 * @returns Transfer window or null if not found
 */
export function getTransferWindow(
  country: string,
  windowType: 'summer' | 'winter'
): TransferWindow | null {
  const countryWindows = getCountryWindows(country)

  if (!countryWindows) {
    return null
  }

  return countryWindows.windows[windowType]
}

/**
 * Check if a date falls within a transfer window
 *
 * @param country - Country name
 * @param date - Date to check
 * @returns true if date is within any transfer window for the country
 */
export function isInTransferWindow(
  country: string,
  date: Date = new Date()
): boolean {
  const activeWindow = getActiveTransferWindow(country, date)
  return activeWindow?.isActive ?? false
}

/**
 * Get all supported countries
 */
export function getSupportedCountries(): string[] {
  return Object.keys(TRANSFER_WINDOW_TEMPLATES)
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use getCountryWindows() instead
 */
export const TRANSFER_WINDOWS_2025_2026: Record<string, CountryWindows> = {}

// Populate legacy export on first access
Object.keys(TRANSFER_WINDOW_TEMPLATES).forEach(country => {
  const windows = getCountryWindows(country)
  if (windows) {
    TRANSFER_WINDOWS_2025_2026[country] = windows
  }
})
