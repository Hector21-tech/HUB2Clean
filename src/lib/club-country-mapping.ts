// Club to Country Mapping - Based on football-clubs.ts data
// Maps club names to their countries for auto-population

import { FOOTBALL_LEAGUES } from './football-clubs'

export interface ClubCountryMapping {
  club: string
  country: string
  league: string
  city: string
  notable?: boolean
}

// Generate club-to-country mapping from existing football leagues data
function generateClubMappings(): ClubCountryMapping[] {
  const mappings: ClubCountryMapping[] = []

  FOOTBALL_LEAGUES.forEach(league => {
    league.clubs.forEach(club => {
      mappings.push({
        club: club.name,
        country: league.country,
        league: league.name,
        city: club.city,
        notable: club.notable
      })
    })
  })

  return mappings
}

// Cached mapping for performance
const CLUB_MAPPINGS = generateClubMappings()

// Get country by club name (case insensitive)
export function getCountryByClub(clubName: string): string | null {
  if (!clubName) return null

  const clubLower = clubName.toLowerCase().trim()

  // Exact match first
  const exactMatch = CLUB_MAPPINGS.find(mapping =>
    mapping.club.toLowerCase() === clubLower
  )

  if (exactMatch) return exactMatch.country

  // Partial match (for cases where user types "Arsenal" instead of "Arsenal FC")
  const partialMatch = CLUB_MAPPINGS.find(mapping =>
    mapping.club.toLowerCase().includes(clubLower) ||
    clubLower.includes(mapping.club.toLowerCase())
  )

  return partialMatch?.country || null
}

// Get league by club name
export function getLeagueByClub(clubName: string): string | null {
  if (!clubName) return null

  const clubLower = clubName.toLowerCase().trim()
  const match = CLUB_MAPPINGS.find(mapping =>
    mapping.club.toLowerCase() === clubLower ||
    mapping.club.toLowerCase().includes(clubLower) ||
    clubLower.includes(mapping.club.toLowerCase())
  )

  return match?.league || null
}

// Get clubs by country (for dropdown grouping)
export function getClubsByCountry(): Record<string, ClubCountryMapping[]> {
  const grouped: Record<string, ClubCountryMapping[]> = {}

  CLUB_MAPPINGS.forEach(mapping => {
    if (!grouped[mapping.country]) {
      grouped[mapping.country] = []
    }
    grouped[mapping.country].push(mapping)
  })

  // Sort clubs within each country alphabetically
  Object.keys(grouped).forEach(country => {
    grouped[country].sort((a, b) => a.club.localeCompare(b.club))
  })

  return grouped
}

// Get all clubs sorted by country
export function getAllClubsSorted(): ClubCountryMapping[] {
  return CLUB_MAPPINGS.sort((a, b) => {
    // Sort by country first, then by club name
    if (a.country !== b.country) {
      return a.country.localeCompare(b.country)
    }
    return a.club.localeCompare(b.club)
  })
}

// Get notable clubs only (major clubs with global recognition)
export function getNotableClubs(): ClubCountryMapping[] {
  return CLUB_MAPPINGS.filter(mapping => mapping.notable)
    .sort((a, b) => a.club.localeCompare(b.club))
}

// Search clubs by name (for autocomplete)
export function searchClubs(query: string, limit: number = 10): ClubCountryMapping[] {
  if (!query || query.length < 2) return []

  const queryLower = query.toLowerCase().trim()

  // Find matches (club name or city)
  const matches = CLUB_MAPPINGS.filter(mapping =>
    mapping.club.toLowerCase().includes(queryLower) ||
    mapping.city.toLowerCase().includes(queryLower)
  )

  // Sort by relevance (exact matches first, then alphabetical)
  matches.sort((a, b) => {
    const aClubMatch = a.club.toLowerCase().startsWith(queryLower)
    const bClubMatch = b.club.toLowerCase().startsWith(queryLower)

    if (aClubMatch && !bClubMatch) return -1
    if (!aClubMatch && bClubMatch) return 1

    return a.club.localeCompare(b.club)
  })

  return matches.slice(0, limit)
}

// Countries that actually have clubs (for filtering)
export function getActiveCountries(): string[] {
  const countries = new Set(CLUB_MAPPINGS.map(mapping => mapping.country))
  return Array.from(countries).sort()
}

// Statistics
export function getClubStats() {
  const stats = {
    totalClubs: CLUB_MAPPINGS.length,
    totalCountries: getActiveCountries().length,
    notableClubs: getNotableClubs().length,
    clubsByCountry: getClubsByCountry()
  }

  return stats
}

// Example usage and validation
console.log('Club Country Mapping Stats:', {
  totalClubs: CLUB_MAPPINGS.length,
  countries: getActiveCountries(),
  sampleMappings: {
    'Malmö FF': getCountryByClub('Malmö FF'),
    'Arsenal': getCountryByClub('Arsenal'),
    'Bayern Munich': getCountryByClub('Bayern Munich'),
    'FC København': getCountryByClub('FC København')
  }
})