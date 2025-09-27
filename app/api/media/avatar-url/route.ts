import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../src/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const tenantId = searchParams.get('tenantId')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'TenantId parameter is required' },
        { status: 400 }
      )
    }

    // Validate path format - should be like "players/uuid/avatar.jpg"
    const pathRegex = /^players\/[a-f0-9-]+.*\.(jpg|jpeg|png|webp)$/i
    if (!pathRegex.test(path)) {
      return NextResponse.json(
        { success: false, error: 'Invalid avatar path format' },
        { status: 400 }
      )
    }

    try {
      // Get a signed URL from Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('avatars')
        .createSignedUrl(path, 3600) // URL valid for 1 hour

      if (error) {
        console.log(`Avatar signed URL error: ${path}`, error.message)
        return NextResponse.json(
          { success: false, error: 'Avatar not found' },
          { status: 404 }
        )
      }

      if (!data?.signedUrl) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate signed URL' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        url: data.signedUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      })

    } catch (storageError) {
      console.error('Supabase storage error:', storageError)
      return NextResponse.json(
        { success: false, error: 'Storage service unavailable' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Avatar URL API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get avatar URL' },
      { status: 500 }
    )
  }
}