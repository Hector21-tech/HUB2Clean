import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper function to get tenant-scoped database operations
export function getTenantDb(tenantId: string) {
  return {
    // Players for this tenant
    players: db.player.findMany({
      where: { tenantId }
    }),

    // Requests for this tenant
    requests: db.request.findMany({
      where: { tenantId }
    }),

    // Trials for this tenant
    trials: db.trial.findMany({
      where: { tenantId }
    }),

    // Calendar events for this tenant
    calendarEvents: db.calendarEvent.findMany({
      where: { tenantId }
    }),

    // Get tenant info
    tenant: db.tenant.findUnique({
      where: { id: tenantId }
    }),

    // Get user's membership in this tenant
    membership: (userId: string) => db.tenantMembership.findFirst({
      where: {
        tenantId,
        userId
      }
    })
  }
}