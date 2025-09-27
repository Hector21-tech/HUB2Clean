import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../src/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant is required' },
        { status: 400 }
      )
    }

    // Get the uploaded file from FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const playerId = formData.get('playerId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      )
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${playerId}-${timestamp}.${fileExtension}`
    const filePath = `players/${fileName}`

    try {
      // Convert file to buffer for Supabase upload
      const buffer = Buffer.from(await file.arrayBuffer())

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        console.error('Supabase upload error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to upload avatar to storage' },
          { status: 500 }
        )
      }

      // Return the path for storing in database
      return NextResponse.json({
        success: true,
        data: {
          avatarPath: filePath,
          fileName: fileName,
          fileSize: file.size,
          contentType: file.type
        }
      })

    } catch (storageError) {
      console.error('Storage operation failed:', storageError)
      return NextResponse.json(
        { success: false, error: 'Storage service unavailable' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Avatar upload API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process avatar upload' },
      { status: 500 }
    )
  }
}