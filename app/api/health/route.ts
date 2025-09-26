// Scout Hub Health Check API
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const start = Date.now()

    // Test database connection
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('players')
      .select('count(*)')
      .limit(1)
      .single()

    const dbStatus = error ? 'error' : 'ok'
    const dbLatency = Date.now() - start

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
          error: error?.message
        },
        auth: {
          status: 'ok',
          provider: 'supabase'
        }
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }

    const httpStatus = dbStatus === 'ok' ? 200 : 503

    return NextResponse.json(healthData, { status: httpStatus })

  } catch (error: any) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message || 'Health check failed'
      },
      { status: 503 }
    )
  }
}