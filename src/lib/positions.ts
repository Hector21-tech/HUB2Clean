// Football position mappings from abbreviations to full names

export const POSITION_MAPPINGS: Record<string, string> = {
  // Goalkeepers
  'GK': 'Goalkeeper',

  // Defenders
  'LB': 'Left Back',
  'LCB': 'Left Centre Back',
  'CB': 'Centre Back',
  'RCB': 'Right Centre Back',
  'RB': 'Right Back',
  'LWB': 'Left Wing Back',
  'RWB': 'Right Wing Back',
  'SW': 'Sweeper',

  // Midfielders
  'DMF': 'Defensive Midfielder',
  'CM': 'Central Midfielder',
  'MF': 'Midfielder',
  'LM': 'Left Midfielder',
  'RM': 'Right Midfielder',
  'CAM': 'Central Attacking Midfielder',
  'AM': 'Attacking Midfielder',
  'LW': 'Left Winger',
  'RW': 'Right Winger',

  // Forwards
  'ST': 'Striker',
  'CF': 'Centre Forward',
  'LF': 'Left Forward',
  'RF': 'Right Forward',
  'SS': 'Second Striker'
}

/**
 * Convert position abbreviation to full name
 * @param abbreviation - Position abbreviation (e.g., "RB")
 * @returns Full position name (e.g., "Right Back")
 */
export function getFullPositionName(abbreviation: string): string {
  return POSITION_MAPPINGS[abbreviation.toUpperCase()] || abbreviation
}

/**
 * Convert array of position abbreviations to full names
 * @param positions - Array of position abbreviations
 * @returns Array of full position names
 */
export function getFullPositionNames(positions: string[]): string[] {
  return positions.map(pos => getFullPositionName(pos))
}

/**
 * Convert array of positions to display string with full names
 * @param positions - Array of position abbreviations
 * @returns Comma-separated string of full position names
 */
export function formatPositionsDisplay(positions: string[]): string {
  return getFullPositionNames(positions).join(', ')
}