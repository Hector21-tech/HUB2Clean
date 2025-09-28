import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    currentURL: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'undefined'}`,
    isProduction: process.env.VERCEL_ENV === 'production',
    timestamp: new Date().toISOString()
  })
}