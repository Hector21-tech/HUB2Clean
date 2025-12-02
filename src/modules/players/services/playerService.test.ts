import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockPlayers, mockPlayer, prismaMock } from '@/test/mocks/prisma'

// Mock prisma before importing the service
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Import after mocking
import { PlayerService } from './playerService'

describe('PlayerService', () => {
  let playerService: PlayerService

  beforeEach(() => {
    playerService = new PlayerService()
    vi.clearAllMocks()
  })

  describe('getPlayers', () => {
    it('should fetch players with pagination', async () => {
      const result = await playerService.getPlayers('tenant-1')

      expect(result.data).toHaveLength(mockPlayers.length)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(20)
      expect(prismaMock.player.findMany).toHaveBeenCalled()
      expect(prismaMock.player.count).toHaveBeenCalled()
    })

    it('should apply search filter correctly', async () => {
      await playerService.getPlayers('tenant-1', { search: 'Test' })

      expect(prismaMock.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            OR: expect.arrayContaining([
              expect.objectContaining({ firstName: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('should apply position filter correctly', async () => {
      await playerService.getPlayers('tenant-1', { position: 'ST' })

      expect(prismaMock.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            position: 'ST',
          }),
        })
      )
    })

    it('should apply pagination parameters', async () => {
      await playerService.getPlayers('tenant-1', {}, { page: 2, pageSize: 10 })

      expect(prismaMock.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      )
    })
  })

  describe('getPlayerById', () => {
    it('should fetch a player by ID', async () => {
      const result = await playerService.getPlayerById('player-1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('player-1')
      expect(prismaMock.player.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'player-1' },
        })
      )
    })

    it('should return null for non-existent player', async () => {
      prismaMock.player.findUnique.mockResolvedValueOnce(null)

      const result = await playerService.getPlayerById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('createPlayer', () => {
    it('should create a new player', async () => {
      const newPlayerData = {
        tenantId: 'tenant-1',
        firstName: 'New',
        lastName: 'Player',
        tags: [],
      }

      const result = await playerService.createPlayer(newPlayerData)

      expect(result).toBeDefined()
      expect(result.id).toBe('new-player-id')
      expect(prismaMock.player.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'New',
            lastName: 'Player',
          }),
        })
      )
    })
  })

  describe('updatePlayer', () => {
    it('should update an existing player', async () => {
      const updateData = {
        firstName: 'Updated',
        rating: 8.5,
      }

      const result = await playerService.updatePlayer('player-1', updateData)

      expect(result).toBeDefined()
      expect(prismaMock.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'player-1' },
          data: expect.objectContaining({
            firstName: 'Updated',
            rating: 8.5,
          }),
        })
      )
    })

    it('should filter out invalid fields', async () => {
      const updateData = {
        firstName: 'Valid',
        invalidField: 'should be ignored',
      }

      await playerService.updatePlayer('player-1', updateData as any)

      expect(prismaMock.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            invalidField: 'should be ignored',
          }),
        })
      )
    })
  })

  describe('deletePlayer', () => {
    it('should delete a player', async () => {
      await playerService.deletePlayer('player-1')

      expect(prismaMock.player.delete).toHaveBeenCalledWith({
        where: { id: 'player-1' },
      })
    })
  })

  describe('searchPlayers', () => {
    it('should search players by query', async () => {
      await playerService.searchPlayers('tenant-1', 'striker')

      expect(prismaMock.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            OR: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('getPlayerStats', () => {
    it('should return player statistics', async () => {
      const result = await playerService.getPlayerStats('tenant-1')

      expect(result).toBeDefined()
      expect(result.totalPlayers).toBe(mockPlayers.length)
      expect(result.averageRating).toBeDefined()
      expect(prismaMock.player.aggregate).toHaveBeenCalled()
      expect(prismaMock.player.groupBy).toHaveBeenCalled()
    })
  })
})
