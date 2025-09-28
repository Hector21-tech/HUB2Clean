import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug endpoint called')

    // Test basic response
    const basicTest = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    }

    console.log('📊 Basic test:', basicTest)

    // Test Prisma connection
    const prisma = new PrismaClient()

    console.log('🔗 Testing Prisma connection...')

    // Simple query that should always work
    const tenantCount = await prisma.tenant.count()

    console.log('✅ Tenant count:', tenantCount)

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      debug: {
        ...basicTest,
        tenantCount,
        message: 'Database connection successful'
      }
    })

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}