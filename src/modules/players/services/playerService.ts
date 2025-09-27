import { PrismaClient } from '@prisma/client'
import { Player, PlayerFilters } from '../types/player'

const prisma = new PrismaClient()

export class PlayerService {
  async getPlayers(tenantId: string, filters?: PlayerFilters): Promise<Player[]> {
    const where: any = {
      tenantId
    }

    // Apply filters
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { club: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters?.position) {
      where.position = filters.position
    }

    if (filters?.nationality) {
      where.nationality = filters.nationality
    }

    if (filters?.club) {
      where.club = { contains: filters.club, mode: 'insensitive' }
    }

    // Age filter (calculate from dateOfBirth)
    if (filters?.ageMin || filters?.ageMax) {
      const now = new Date()
      const currentYear = now.getFullYear()

      if (filters.ageMin) {
        const maxBirthYear = currentYear - filters.ageMin
        where.dateOfBirth = {
          ...where.dateOfBirth,
          lte: new Date(`${maxBirthYear}-12-31`)
        }
      }

      if (filters.ageMax) {
        const minBirthYear = currentYear - filters.ageMax
        where.dateOfBirth = {
          ...where.dateOfBirth,
          gte: new Date(`${minBirthYear}-01-01`)
        }
      }
    }

    if (filters?.ratingMin) {
      where.rating = {
        ...where.rating,
        gte: filters.ratingMin
      }
    }

    if (filters?.ratingMax) {
      where.rating = {
        ...where.rating,
        lte: filters.ratingMax
      }
    }

    // Market value filters - not available in current schema
    // TODO: Add marketValue column to Player schema when implementing extended attributes

    try {
      const players = await prisma.player.findMany({
        where,
        include: {
          tenant: true,
          trials: {
            orderBy: { scheduledAt: 'desc' },
            take: 5
          }
        },
        orderBy: [
          { rating: 'desc' },
          { lastName: 'asc' }
        ]
      })

      return players as Player[]
    } catch (error) {
      console.error('Error fetching players:', error)
      throw new Error('Failed to fetch players')
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

      return player as Player | null
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

      return player as Player
    } catch (error) {
      console.error('Error creating player:', error)
      throw new Error('Failed to create player')
    }
  }

  async updatePlayer(id: string, playerData: Partial<Player>): Promise<Player> {
    try {
      const player = await prisma.player.update({
        where: { id },
        data: {
          ...playerData,
          updatedAt: new Date()
        },
        include: {
          tenant: true,
          trials: true
        }
      })

      return player as Player
    } catch (error) {
      console.error('Error updating player:', error)
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

      return players as Player[]
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

      return players as Player[]
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

      return players as Player[]
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

      return players as Player[]
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