import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../src/lib/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting avatar path cleanup...')

    // Find all players with non-null avatarPath
    const playersWithAvatars = await prisma.player.findMany({
      where: {
        avatarPath: {
          not: null
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarPath: true,
        tenantId: true
      }
    })

    console.log(`Found ${playersWithAvatars.length} players with avatar paths`)

    let cleanedCount = 0
    let validCount = 0
    const results = []

    for (const player of playersWithAvatars) {
      if (!player.avatarPath) continue

      console.log(`Checking player: ${player.firstName} ${player.lastName} - Path: ${player.avatarPath}`)

      try {
        // Check if file exists in Supabase Storage using our supabaseAdmin client
        const { data, error } = await supabaseAdmin.storage
          .from('avatars')
          .list(player.avatarPath.substring(0, player.avatarPath.lastIndexOf('/')), {
            limit: 1,
            search: player.avatarPath.substring(player.avatarPath.lastIndexOf('/') + 1)
          })

        if (error || !data || data.length === 0) {
          // File doesn't exist, clean up the path
          await prisma.player.update({
            where: { id: player.id },
            data: { avatarPath: null }
          })

          console.log(`❌ Cleaned invalid path for ${player.firstName} ${player.lastName}: ${player.avatarPath}`)
          results.push({
            playerId: player.id,
            playerName: `${player.firstName} ${player.lastName}`,
            avatarPath: player.avatarPath,
            action: 'cleaned',
            reason: error ? `Storage error: ${error.message}` : 'File not found'
          })
          cleanedCount++
        } else {
          console.log(`✅ Valid path for ${player.firstName} ${player.lastName}: ${player.avatarPath}`)
          results.push({
            playerId: player.id,
            playerName: `${player.firstName} ${player.lastName}`,
            avatarPath: player.avatarPath,
            action: 'kept',
            reason: 'File exists'
          })
          validCount++
        }
      } catch (error) {
        console.error(`Error checking file for ${player.firstName} ${player.lastName}:`, error)
        results.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          avatarPath: player.avatarPath,
          action: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const summary = {
      totalChecked: playersWithAvatars.length,
      validAvatars: validCount,
      cleanedAvatars: cleanedCount,
      errors: results.filter(r => r.action === 'error').length
    }

    console.log('🎉 Avatar cleanup completed:', summary)

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Cleaned ${cleanedCount} invalid avatar paths out of ${playersWithAvatars.length} total.`,
      summary,
      results: results
    })

  } catch (error) {
    console.error('❌ Avatar cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup avatar paths',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}