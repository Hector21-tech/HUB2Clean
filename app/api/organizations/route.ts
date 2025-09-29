import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user via SSR cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Organizations API: Auth failed', authError)
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    console.log('🏢 Creating new organization:', {
      name,
      slug,
      description,
      userId: user.id,
      userEmail: user.email,
      userMetadata: user.user_metadata // Add metadata for debugging
    })

    // Check if slug is already taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Organization slug already exists' },
        { status: 409 }
      )
    }

    // Create tenant and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, ensure user exists in Prisma database
      // Handle both camelCase (firstName) and snake_case (first_name) metadata formats
      const firstName = user.user_metadata?.firstName || user.user_metadata?.first_name || null
      const lastName = user.user_metadata?.lastName || user.user_metadata?.last_name || null

      const dbUser = await tx.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email || '',
          firstName: firstName,
          lastName: lastName
        },
        create: {
          id: user.id,
          email: user.email || '',
          firstName: firstName,
          lastName: lastName
        }
      })

      console.log('✅ User ensured in database:', {
        userId: dbUser.id,
        email: dbUser.email,
        firstName: firstName,
        lastName: lastName,
        metadataKeys: Object.keys(user.user_metadata || {})
      })

      // Create the tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          description: description || `${name} scouting organization`
        }
      })

      // Create membership for the user as OWNER
      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'OWNER'
        }
      })

      return { tenant, membership }
    })

    console.log('✅ Organization created successfully:', {
      tenantId: result.tenant.id,
      slug: result.tenant.slug,
      name: result.tenant.name,
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      data: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        description: result.tenant.description,
        role: result.membership.role
      }
    })

  } catch (error) {
    console.error('❌ Organization creation error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      databaseUrlSet: !!process.env.DATABASE_URL,
      directUrlSet: !!process.env.DIRECT_URL,
      supabaseUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      errorType: error?.constructor?.name,
      errorCode: (error as any)?.code,
      errorMeta: (error as any)?.meta
    })

    // More specific error messages
    let errorMessage = 'Failed to create organization'
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Organization slug already exists'
      } else if (error.message.includes('connection')) {
        errorMessage = 'Database connection failed'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out'
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check server logs for detailed error information'
    }, { status: 500 })

  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('❌ Prisma disconnect error:', disconnectError)
    }
  }
}