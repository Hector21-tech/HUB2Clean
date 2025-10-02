/**
 * Transfer Window Mappings for European Football Leagues
 *
 * Each country has two transfer windows per year:
 * - Summer Window: Main transfer period between seasons
 * - Winter Window: Mid-season transfer period (January)
 */

export interface TransferWindow {
  name: 'summer' | 'winter'
  openDate: string // ISO date format: YYYY-MM-DD
  closeDate: string // ISO date format: YYYY-MM-DD
}

export interface CountryWindows {
  country: string
  windows: {
    summer: TransferWindow
    winter: TransferWindow
  }
}

/**
 * Transfer Window Dates for 2025 Season
 *
 * Source: https://fotbolltransfers.com/nyheter/nar-oppnar-och-stanger-transferfonstret/1468
 * Updated: October 2025
 */
export const TRANSFER_WINDOWS_2025_2026: Record<string, CountryWindows> = {
  'Sweden': {
    country: 'Sweden',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-08',
        closeDate: '2025-08-29'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-29',
        closeDate: '2025-03-25'
      }
    }
  },
  'England': {
    country: 'England',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-06-16',
        closeDate: '2025-09-01'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-02'
      }
    }
  },
  'Spain': {
    country: 'Spain',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-09-01'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-02',
        closeDate: '2025-02-02'
      }
    }
  },
  'Germany': {
    country: 'Germany',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-09-01'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-02'
      }
    }
  },
  'Italy': {
    country: 'Italy',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-09-01'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-02',
        closeDate: '2025-02-02'
      }
    }
  },
  'France': {
    country: 'France',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-06-16',
        closeDate: '2025-09-01'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-02'
      }
    }
  },
  'Denmark': {
    country: 'Denmark',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-06-16',
        closeDate: '2025-09-01'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-02'
      }
    }
  },
  'Norway': {
    country: 'Norway',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-11',
        closeDate: '2025-09-02'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-30',
        closeDate: '2025-03-27'
      }
    }
  },
  'Finland': {
    country: 'Finland',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-08-25'
      },
      winter: {
        name: 'winter',
        openDate: '2025-02-05',
        closeDate: '2025-04-01'
      }
    }
  },
  'Saudi Arabia': {
    country: 'Saudi Arabia',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-06-15',
        closeDate: '2025-09-02'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-03'
      }
    }
  },
  'UAE': {
    country: 'UAE',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-09-10'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-07'
      }
    }
  },
  'Turkey': {
    country: 'Turkey',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-06-10',
        closeDate: '2025-09-13'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-06',
        closeDate: '2025-02-14'
      }
    }
  },
  'Egypt': {
    country: 'Egypt',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-09-30'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-28'
      }
    }
  },
  'Morocco': {
    country: 'Morocco',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-09-30'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-02-28'
      }
    }
  },
  'South Africa': {
    country: 'South Africa',
    windows: {
      summer: {
        name: 'summer',
        openDate: '2025-07-01',
        closeDate: '2025-09-30'
      },
      winter: {
        name: 'winter',
        openDate: '2025-01-01',
        closeDate: '2025-03-31'
      }
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
  const countryWindows = TRANSFER_WINDOWS_2025_2026[country]

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
  // Check if summer window is upcoming
  if (date < summerOpen) {
    return { window: summer, isActive: false }
  }

  // Check if between summer close and winter open
  if (date > summerClose && date < winterOpen) {
    return { window: winter, isActive: false }
  }

  // After winter close, next cycle is summer (but we'd need 2026-2027 data)
  // For now, return null if we're past all windows
  console.warn(`Date ${date.toISOString()} is outside all defined windows for ${country}`)
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
  const countryWindows = TRANSFER_WINDOWS_2025_2026[country]

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
  return Object.keys(TRANSFER_WINDOWS_2025_2026)
}
