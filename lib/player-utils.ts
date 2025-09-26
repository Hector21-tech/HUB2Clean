// Utility functions for handling player data transformations
import type { PlayerData, EnhancedPlayer, DatabasePlayer } from '@/lib/types/player'

/**
 * Transform database player data to enhanced player with positions array and avatar URL
 */
export function transformDatabasePlayer(dbPlayer: DatabasePlayer): EnhancedPlayer {
  // Convert snake_case to camelCase
  const playerData: PlayerData = {
    id: dbPlayer.id,
    tenantId: dbPlayer.tenant_id,
    firstName: dbPlayer.first_name,
    lastName: dbPlayer.last_name,
    dateOfBirth: dbPlayer.date_of_birth ? new Date(dbPlayer.date_of_birth) : null,
    nationality: dbPlayer.nationality,
    position: dbPlayer.position,
    club: dbPlayer.club,
    height: dbPlayer.height,
    notes: dbPlayer.notes,
    tags: Array.isArray(dbPlayer.tags) ? dbPlayer.tags : [],
    rating: dbPlayer.rating,
    avatarUrl: dbPlayer.avatar_url,
    avatarPath: dbPlayer.avatar_path,
    createdAt: new Date(dbPlayer.created_at),
    updatedAt: new Date(dbPlayer.updated_at)
  }

  // For backward compatibility, check both avatarUrl field and tags
  let avatarUrl = playerData.avatarUrl || undefined

  // Ensure tags is always an array to prevent crashes
  const tags = Array.isArray(playerData.tags) ? playerData.tags : []

  // If no avatarUrl field, extract from tags (for existing data)
  if (!avatarUrl && tags.length > 0) {
    const avatarTag = tags.find(tag => tag && tag.startsWith('avatar:'))
    avatarUrl = avatarTag ? avatarTag.replace('avatar:', '') : undefined
  }

  // Remove avatar tags from regular tags (cleanup)
  const regularTags = tags.filter(tag => tag && !tag.startsWith('avatar:'))

  // Convert position string to positions array
  const positions = playerData.position
    ? playerData.position.split(', ').map(p => p.trim()).filter(p => p.length > 0)
    : []

  return {
    id: playerData.id,
    tenantId: playerData.tenantId,
    firstName: playerData.firstName,
    lastName: playerData.lastName,
    dateOfBirth: playerData.dateOfBirth,
    nationality: playerData.nationality,
    club: playerData.club,
    height: playerData.height,
    notes: playerData.notes,
    rating: playerData.rating,
    avatarUrl,
    avatarPath: playerData.avatarPath,
    createdAt: playerData.createdAt,
    updatedAt: playerData.updatedAt,
    positions,
    tags: regularTags
  }
}

/**
 * Transform frontend player data to database format
 */
export function transformToDatabase(frontendData: any): Partial<DatabasePlayer> {
  // Handle positions array → single position string
  let position = frontendData.position
  if (frontendData.positions && Array.isArray(frontendData.positions)) {
    position = frontendData.positions.join(', ')
  }

  // Handle tags array
  let tags = frontendData.tags || []
  if (!Array.isArray(tags)) {
    tags = []
  }

  // Convert camelCase to snake_case for database
  const dbData: Partial<DatabasePlayer> = {
    first_name: frontendData.firstName,
    last_name: frontendData.lastName,
    date_of_birth: frontendData.dateOfBirth ?
      (frontendData.dateOfBirth instanceof Date ?
        frontendData.dateOfBirth.toISOString() :
        frontendData.dateOfBirth) : null,
    nationality: frontendData.nationality || null,
    position: position || null,
    club: frontendData.club || null,
    height: frontendData.height ? Number(frontendData.height) : null,
    notes: frontendData.notes || null,
    tags,
    rating: frontendData.rating ? Number(frontendData.rating) : null,
    avatar_url: frontendData.avatarUrl || null,
    avatar_path: frontendData.avatarPath || null
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(dbData).filter(([_, value]) => value !== undefined)
  ) as Partial<DatabasePlayer>
}

/**
 * Validate required player fields
 */
export function validatePlayerData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0) {
    errors.push('firstName is required and must be a non-empty string')
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0) {
    errors.push('lastName is required and must be a non-empty string')
  }

  if (data.height && (isNaN(Number(data.height)) || Number(data.height) <= 0)) {
    errors.push('height must be a positive number')
  }

  if (data.rating && (isNaN(Number(data.rating)) || Number(data.rating) < 0 || Number(data.rating) > 10)) {
    errors.push('rating must be a number between 0 and 10')
  }

  if (data.dateOfBirth) {
    const date = new Date(data.dateOfBirth)
    if (isNaN(date.getTime())) {
      errors.push('dateOfBirth must be a valid date')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}