import { vi } from 'vitest'

// Mock player data
export const mockPlayer = {
  id: 'player-1',
  tenantId: 'tenant-1',
  firstName: 'Test',
  lastName: 'Player',
  dateOfBirth: new Date('2000-01-15'),
  nationality: 'Sweden',
  height: 185,
  club: 'Test FC',
  position: 'ST',
  rating: 7.5,
  tags: ['promising', 'fast'],
  avatarPath: null,
  avatarUrl: null,
  contractExpiry: new Date('2025-06-30'),
  agencyContractExpiry: null,
  marketValue: 500000,
  goalsThisSeason: 10,
  assistsThisSeason: 5,
  appearances: 20,
  notes: 'Great potential',
  hasMandate: false,
  mandateExpiry: null,
  mandateClubs: null,
  mandateNotes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockPlayers = [
  mockPlayer,
  {
    ...mockPlayer,
    id: 'player-2',
    firstName: 'Another',
    lastName: 'Striker',
    club: 'Another FC',
    rating: 8.0,
  },
  {
    ...mockPlayer,
    id: 'player-3',
    firstName: 'Young',
    lastName: 'Talent',
    club: null, // Free agent
    position: 'RW',
    rating: 6.5,
  },
]

// Create mock Prisma client
export const prismaMock = {
  player: {
    findMany: vi.fn().mockResolvedValue(mockPlayers),
    findUnique: vi.fn().mockResolvedValue(mockPlayer),
    findFirst: vi.fn().mockResolvedValue(mockPlayer),
    create: vi.fn().mockImplementation((args) =>
      Promise.resolve({ ...mockPlayer, ...args.data, id: 'new-player-id' })
    ),
    update: vi.fn().mockImplementation((args) =>
      Promise.resolve({ ...mockPlayer, ...args.data })
    ),
    delete: vi.fn().mockResolvedValue(mockPlayer),
    count: vi.fn().mockResolvedValue(mockPlayers.length),
    aggregate: vi.fn().mockResolvedValue({
      _count: { id: mockPlayers.length },
      _avg: { rating: 7.3 },
    }),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  tenant: {
    findFirst: vi.fn().mockResolvedValue({ id: 'tenant-1', name: 'Test Tenant' }),
    findUnique: vi.fn().mockResolvedValue({ id: 'tenant-1', name: 'Test Tenant' }),
  },
  trial: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'trial-1' }),
    update: vi.fn().mockResolvedValue({ id: 'trial-1' }),
    delete: vi.fn().mockResolvedValue({ id: 'trial-1' }),
    count: vi.fn().mockResolvedValue(0),
  },
  request: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'request-1' }),
    update: vi.fn().mockResolvedValue({ id: 'request-1' }),
    delete: vi.fn().mockResolvedValue({ id: 'request-1' }),
    count: vi.fn().mockResolvedValue(0),
  },
  event: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'event-1' }),
    update: vi.fn().mockResolvedValue({ id: 'event-1' }),
    delete: vi.fn().mockResolvedValue({ id: 'event-1' }),
    count: vi.fn().mockResolvedValue(0),
  },
  $transaction: vi.fn().mockImplementation((callback) => callback(prismaMock)),
}

// Mock the prisma import
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))
