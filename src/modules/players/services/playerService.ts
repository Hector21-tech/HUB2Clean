import { PrismaClient } from '@prisma/client'
import { Player, PlayerFilters } from '../types/player'

const prisma = new PrismaClient()

export class PlayerService {
  // Helper function to convert database position (string) to frontend positions (array)
  private convertPositionData(player: any): Player {
    // Convert single position string to positions array for frontend compatibility
    if (player.position && !player.positions) {
      player.positions = [player.position]
    } else if (!player.positions) {
      player.positions = []
    }
    return player as Player
  }
  async getPlayers(tenantId: string, filters?: PlayerFilters): Promise<Player[]> {
    console.log('🔄 PlayerService.getPlayers called:', {
      tenantId,
      filters,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })

    const where: Record<string, unknown> = {
      tenantId
    }

    console.log('🏗️ Building where clause - initial:', { where })

    // Apply filters
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { club: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } }
      ]
      console.log('🔍 Added search filter:', where.OR)
    }

    if (filters?.position) {
      where.position = filters.position
      console.log('⚽ Added position filter:', where.position)
    }

    if (filters?.nationality) {
      where.nationality = filters.nationality
      console.log('🌍 Added nationality filter:', where.nationality)
    }

    if (filters?.club) {
      where.club = { contains: filters.club, mode: 'insensitive' }
      console.log('🏟️ Added club filter:', where.club)
    }

    // Age filter (calculate from dateOfBirth)
    if (filters?.ageMin || filters?.ageMax) {
      const now = new Date()
      const currentYear = now.getFullYear()

      if (filters.ageMin) {
        const maxBirthYear = currentYear - filters.ageMin
        where.dateOfBirth = {
          ...(where.dateOfBirth || {}),
          lte: new Date(`${maxBirthYear}-12-31`)
        }
      }

      if (filters.ageMax) {
        const minBirthYear = currentYear - filters.ageMax
        where.dateOfBirth = {
          ...(where.dateOfBirth || {}),
          gte: new Date(`${minBirthYear}-01-01`)
        }
      }
      console.log('📅 Added age filter:', where.dateOfBirth)
    }

    if (filters?.ratingMin) {
      where.rating = {
        ...(where.rating || {}),
        gte: filters.ratingMin
      }
      console.log('⭐ Added rating min filter:', where.rating)
    }

    if (filters?.ratingMax) {
      where.rating = {
        ...(where.rating || {}),
        lte: filters.ratingMax
      }
      console.log('⭐ Added rating max filter:', where.rating)
    }

    console.log('🏗️ Final where clause:', JSON.stringify(where, null, 2))

    try {
      console.log('🔗 Testing Prisma connection...')

      // Test basic connection first
      const connectionTest = await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Prisma connection test successful:', connectionTest)

      console.log('📊 Executing findMany query...')
      const players = await prisma.player.findMany({
        where,
        orderBy: [
          { rating: 'desc' },
          { lastName: 'asc' }
        ]
      })

      console.log('✅ Query successful:', {
        playerCount: players.length,
        sampleIds: players.slice(0, 3).map(p => p.id),
        tenantId
      })

      // Convert position data for frontend compatibility
      const convertedPlayers = players.map(player => this.convertPositionData(player))

      console.log('✅ Players converted successfully')
      return convertedPlayers
    } catch (error) {
      console.error('❌ PlayerService.getPlayers CRITICAL ERROR:', error)
      console.error('❌ Error context:', {
        tenantId,
        filters,
        where: JSON.stringify(where, null, 2),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      })

      throw new Error(`Failed to fetch players: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getPlayerById(id: string): Promise<Player | null> {
    try {
      const player = await prisma.player.findUnique({
        where: { id },
        include: {
          tenant: true,
          trials: {
            include: {
              request: true
            },
            orderBy: { scheduledAt: 'desc' }
          }
        }
      })

      return player ? this.convertPositionData(player) : null
    } catch (error) {
      console.error('Error fetching player:', error)
      throw new Error('Failed to fetch player')
    }
  }

  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    try {
      const player = await prisma.player.create({
        data: {
          ...playerData,
          height: playerData.height || 180, // Ensure height is always provided
          tags: playerData.tags || []
        },
        include: {
          tenant: true,
          trials: true
        }
      })

      return this.convertPositionData(player)
    } catch (error) {
      console.error('Error creating player:', error)
      throw new Error('Failed to create player')
    }
  }

  async updatePlayer(id: string, playerData: Partial<Player>): Promise<Player> {
    try {
      console.log('🔄 PlayerService.updatePlayer called with:', { id, dataKeys: Object.keys(playerData) })

      // Filter data to only include fields that exist in Prisma schema
      const validFields = [
        'firstName', 'lastName', 'dateOfBirth', 'position', 'club',
        'contractExpiry', 'nationality', 'height', 'notes', 'tags',
        'rating', 'avatarUrl', 'avatarPath'
      ]

      const filteredData: Record<string, any> = {}
      for (const [key, value] of Object.entries(playerData)) {
        if (validFields.includes(key) && value !== undefined) {
          filteredData[key] = value
        } else if (!validFields.includes(key)) {
          console.warn(`⚠️ Skipping invalid field for Prisma: ${key}`)
        }
      }

      console.log('✅ Filtered data for Prisma:', { filteredKeys: Object.keys(filteredData) })

      const player = await prisma.player.update({
        where: { id },
        data: {
          ...filteredData,
          updatedAt: new Date()
        },
        include: {
          tenant: true,
          trials: true
        }
      })

      console.log('✅ Player updated successfully:', { id: player.id, name: `${player.firstName} ${player.lastName}` })
      return player as Player
    } catch (error) {
      console.error('❌ Error updating player:', error)
      console.error('❌ Update details:', { id, playerData })
      throw new Error('Failed to update player')
    }
  }

  async deletePlayer(id: string): Promise<void> {
    try {
      await prisma.player.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Error deleting player:', error)
      throw new Error('Failed to delete player')
    }
  }

  async getPlayersByClub(tenantId: string, club: string): Promise<Player[]> {
    try {
      const players = await prisma.player.findMany({
        where: {
          tenantId,
          club: { contains: club, mode: 'insensitive' }
        },
        include: {
          tenant: true,
          trials: true
        },
        orderBy: [
          { rating: 'desc' },
          { lastName: 'asc' }
        ]
      })

      return players.map(player => this.convertPositionData(player))
    } catch (error) {
      console.error('Error fetching players by club:', error)
      throw new Error('Failed to fetch players by club')
    }
  }

  async getPlayersByPosition(tenantId: string, position: string): Promise<Player[]> {
    try {
      const players = await prisma.player.findMany({
        where: {
          tenantId,
          position
        },
        include: {
          tenant: true,
          trials: true
        },
        orderBy: [
          { rating: 'desc' },
          { lastName: 'asc' }
        ]
      })

      return players.map(player => this.convertPositionData(player))
    } catch (error) {
      console.error('Error fetching players by position:', error)
      throw new Error('Failed to fetch players by position')
    }
  }

  async getTopRatedPlayers(tenantId: string, limit: number = 10): Promise<Player[]> {
    try {
      const players = await prisma.player.findMany({
        where: {
          tenantId,
          rating: { not: null }
        },
        include: {
          tenant: true,
          trials: true
        },
        orderBy: {
          rating: 'desc'
        },
        take: limit
      })

      return players.map(player => this.convertPositionData(player))
    } catch (error) {
      console.error('Error fetching top rated players:', error)
      throw new Error('Failed to fetch top rated players')
    }
  }

  async searchPlayers(tenantId: string, query: string): Promise<Player[]> {
    try {
      const players = await prisma.player.findMany({
        where: {
          tenantId,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { club: { contains: query, mode: 'insensitive' } },
            { position: { contains: query, mode: 'insensitive' } },
            { nationality: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
            {
              tags: {
                hasSome: [query]
              }
            }
          ]
        },
        include: {
          tenant: true,
          trials: true
        },
        orderBy: [
          { rating: 'desc' },
          { lastName: 'asc' }
        ]
      })

      return players.map(player => this.convertPositionData(player))
    } catch (error) {
      console.error('Error searching players:', error)
      throw new Error('Failed to search players')
    }
  }

  async getPlayerStats(tenantId: string) {
    try {
      const stats = await prisma.player.aggregate({
        where: { tenantId },
        _count: { id: true },
        _avg: {
          rating: true
        }
      })

      const positionCounts = await prisma.player.groupBy({
        by: ['position'],
        where: { tenantId },
        _count: { position: true }
      })

      const nationalityCounts = await prisma.player.groupBy({
        by: ['nationality'],
        where: { tenantId },
        _count: { nationality: true },
        orderBy: { _count: { nationality: 'desc' } },
        take: 10
      })

      return {
        totalPlayers: stats._count.id,
        averageRating: stats._avg.rating || 0,
        positionBreakdown: positionCounts,
        topNationalities: nationalityCounts
      }
    } catch (error) {
      console.error('Error fetching player stats:', error)
      throw new Error('Failed to fetch player statistics')
    }
  }
}

export const playerService = new PlayerService()