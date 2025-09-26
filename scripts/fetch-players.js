// Script to fetch player list from your database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wjwgwzxdgjtwwrnvsltp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqd2d3enhkZ2p0d3dybnZzbHRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3MDQzMiwiZXhwIjoyMDczMzQ2NDMyfQ.hWzdTuPqk-lE-am5kkGS4dbdh_w2qINhTXzbXWH9kCA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchPlayers() {
  console.log('🏈 Fetching your player list...\n')

  try {
    // Fetch all players with full details
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        id,
        firstName,
        lastName,
        position,
        club,
        nationality,
        rating,
        notes,
        tenantId,
        createdAt,
        updatedAt,
        height,
        dateOfBirth,
        contractExpiry
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.log('❌ Error fetching players:', error.message)
      return
    }

    console.log(`✅ Found ${players.length} players total:\n`)

    // Group by tenant
    const playersByTenant = players.reduce((acc, player) => {
      const tenant = player.tenantId || 'no-tenant'
      if (!acc[tenant]) acc[tenant] = []
      acc[tenant].push(player)
      return acc
    }, {})

    Object.entries(playersByTenant).forEach(([tenantId, tenantPlayers]) => {
      console.log(`🏢 Tenant: ${tenantId} (${tenantPlayers.length} players)`)
      tenantPlayers.forEach((player, index) => {
        const name = `${player.firstName || 'N/A'} ${player.lastName || 'N/A'}`
        const position = player.position || 'N/A'
        const club = player.club || 'N/A'
        const rating = player.rating || 'N/A'
        const height = player.height ? `${player.height}cm` : 'N/A'

        console.log(`   ${index + 1}. ${name} - ${position} - ${club} (Rating: ${rating}, ${height})`)
        if (player.notes) {
          console.log(`      Notes: ${player.notes.substring(0, 80)}${player.notes.length > 80 ? '...' : ''}`)
        }
        if (player.contractExpiry) {
          console.log(`      Contract expires: ${player.contractExpiry.split('T')[0]}`)
        }
      })
      console.log('')
    })

  } catch (error) {
    console.error('💥 Failed to fetch players:', error.message)
  }
}

fetchPlayers()