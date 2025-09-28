export interface Player {
  id: string
  tenantId: string

  // Basic Information
  firstName: string
  lastName: string
  dateOfBirth?: Date
  nationality?: string
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH'

  // Physical Attributes
  height?: number // cm

  // Avatar
  avatarUrl?: string    // Legacy: deprecated, use avatarPath instead
  avatarPath?: string   // New: Supabase Storage path

  // Club Information
  club?: string
  positions?: string[] // Array of positions (max 2)
  jerseyNumber?: number

  // Contract & Market
  marketValue?: number
  contractExpiry?: Date
  salary?: number // per week
  agent?: string

  // Technical Skills (1-10 scale)
  shooting?: number
  passing?: number
  dribbling?: number
  crossing?: number
  finishing?: number
  firstTouch?: number

  // Physical Attributes (1-10 scale)
  pace?: number
  acceleration?: number
  strength?: number
  stamina?: number
  agility?: number
  jumping?: number

  // Mental Attributes (1-10 scale)
  vision?: number
  decisions?: number
  composure?: number
  leadership?: number
  workRate?: number
  determination?: number

  // Performance Stats
  goalsThisSeason?: number
  assistsThisSeason?: number
  minutesPlayed?: number
  appearances?: number
  yellowCards?: number
  redCards?: number

  // Scout Notes
  notes?: string
  tags: string[]
  rating?: number // Overall rating 1-10

  // System
  createdAt: Date
  updatedAt: Date
}

export interface PlayerFilters {
  search?: string
  position?: string
  nationality?: string
  club?: string
  contractStatus?: 'expiring' | 'active' | 'free_agent'
  ageMin?: number
  ageMax?: number
  ratingMin?: number
  ratingMax?: number
  marketValueMin?: number
  marketValueMax?: number
}

export interface PlayerStats {
  goals: number
  assists: number
  matches: number
  rating: number
}