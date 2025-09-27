import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../src/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const tenantId = searchParams.get('tenantId')
    const version = searchParams.get('v') // Cache busting parameter

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
    const pathRegex = /^players\/[a-f0-9-]+\/avatar\.(jpg|jpeg|png|webp)$/i
    if (!pathRegex.test(path)) {
      return NextResponse.json(
        { success: false, error: 'Invalid avatar path format' },
        { status: 400 }
      )
    }

    // Get the file from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .download(path)

    if (error) {
      console.log(`Avatar not found: ${path}`, error.message)
      return NextResponse.json(
        { success: false, error: 'Avatar not found' },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Avatar file is empty' },
        { status: 404 }
      )
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer())

    // Determine content type from path
    const extension = path.split('.').pop()?.toLowerCase()
    let contentType = 'image/jpeg' // default

    switch (extension) {
      case 'png':
        contentType = 'image/png'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
    }

    // Create response with appropriate headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'ETag': `"${version || 'default'}"`, // Use version for ETag
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

    return response

  } catch (error) {
    console.error('Avatar proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch avatar' },
      { status: 500 }
    )
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const tenantId = searchParams.get('tenantId')
    const version = searchParams.get('v')

    if (!path || !tenantId) {
      return new NextResponse(null, { status: 400 })
    }

    // Validate path format
    const pathRegex = /^players\/[a-f0-9-]+\/avatar\.(jpg|jpeg|png|webp)$/i
    if (!pathRegex.test(path)) {
      return new NextResponse(null, { status: 400 })
    }

    // Check if file exists in Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .list(path.substring(0, path.lastIndexOf('/')), {
        limit: 1,
        search: path.substring(path.lastIndexOf('/') + 1)
      })

    if (error || !data || data.length === 0) {
      return new NextResponse(null, { status: 404 })
    }

    // Return headers only
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg', // Default - actual type determined in GET
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'ETag': `"${version || 'default'}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Avatar proxy HEAD error:', error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}