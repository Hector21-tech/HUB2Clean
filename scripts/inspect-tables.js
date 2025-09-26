// Script to inspect database table structure
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wjwgwzxdgjtwwrnvsltp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqd2d3enhkZ2p0d3dybnZzbHRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3MDQzMiwiZXhwIjoyMDczMzQ2NDMyfQ.hWzdTuPqk-lE-am5kkGS4dbdh_w2qINhTXzbXWH9kCA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectTables() {
  console.log('🔍 Inspecting database table structure...\n')

  try {
    // First check what a sample player looks like
    console.log('📋 Sample player record:')
    const { data: samplePlayer, error: sampleError } = await supabase
      .from('players')
      .select('*')
      .limit(1)
      .single()

    if (sampleError) {
      console.log('❌ Error getting sample player:', sampleError.message)
    } else {
      console.log('✅ Player columns:')
      Object.keys(samplePlayer).forEach(column => {
        console.log(`  - ${column}: ${typeof samplePlayer[column]} = ${samplePlayer[column]}`)
      })
    }

    console.log('\n📊 All players with actual column data:')
    const { data: allPlayers, error: allError } = await supabase
      .from('players')
      .select('*')
      .limit(5)

    if (allError) {
      console.log('❌ Error getting all players:', allError.message)
    } else {
      allPlayers.forEach((player, index) => {
        console.log(`\nPlayer ${index + 1}:`)
        Object.entries(player).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`)
        })
      })
    }

  } catch (error) {
    console.error('💥 Failed to inspect tables:', error.message)
  }
}

inspectTables()