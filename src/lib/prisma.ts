// src/lib/prisma.ts
// Prisma Client singleton for serverless environments
// Prevents connection pool exhaustion in edge/serverless functions
// Optimized for Supabase connection pooling (pgbouncer)

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'], // Reduced logging for performance
    datasourceUrl: process.env.DATABASE_URL, // Explicit datasource to optimize connection
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown - disconnect on process termination
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma