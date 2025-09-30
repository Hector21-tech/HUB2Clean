import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST: Radera användare från Supabase Auth (cleanup orphaned users)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    console.log('🗑️ Cleanup: Searching for Supabase Auth user:', email)

    // Initialize Supabase Admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Find user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in Supabase Auth'
      }, { status: 404 })
    }

    console.log('👤 Found user in Supabase Auth:', user.email, '| ID:', user.id)

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`)
    }

    console.log('✅ Successfully deleted user from Supabase Auth')

    return NextResponse.json({
      success: true,
      message: `User ${email} deleted from Supabase Auth`,
      deleted: {
        email: user.email,
        userId: user.id,
        createdAt: user.created_at
      }
    })

  } catch (error) {
    console.error('❌ Cleanup error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup Supabase user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}