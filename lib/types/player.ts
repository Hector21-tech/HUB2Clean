// Player data types for Scout Hub

export interface PlayerData {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  dateOfBirth?: Date | null
  nationality?: string | null
  position?: string | null
  club?: string | null
  height?: number | null
  notes?: string | null
  tags: string[]
  rating?: number | null
  avatarUrl?: string | null
  avatarPath?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EnhancedPlayer extends Omit<PlayerData, 'position' | 'tags'> {
  positions: string[]
  avatarUrl?: string
  tags: string[]
}

// Database player data from Supabase
export interface DatabasePlayer {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  nationality?: string | null
  position?: string | null
  club?: string | null
  height?: number | null
  notes?: string | null
  tags: string[]
  rating?: number | null
  avatar_url?: string | null
  avatar_path?: string | null
  created_at: string
  updated_at: string
}

// API Response types
export interface PlayerResponse {
  success: boolean
  data?: EnhancedPlayer | EnhancedPlayer[]
  meta?: {
    count?: number
    tenantId?: string
    playerId?: string
    updatedAt?: string
    deletedAt?: string
  }
  error?: string
  code?: string
}