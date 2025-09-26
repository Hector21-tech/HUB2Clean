// Simple script to check Supabase database contents
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wjwgwzxdgjtwwrnvsltp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqd2d3enhkZ2p0d3dybnZzbHRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3MDQzMiwiZXhwIjoyMDczMzQ2NDMyfQ.hWzdTuPqk-lE-am5kkGS4dbdh_w2qINhTXzbXWH9kCA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking Supabase database contents...\n')

  try {
    // Check auth.users table
    console.log('📧 Checking auth.users...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message)
    } else {
      console.log(`✅ Found ${users.users.length} users:`)
      users.users.forEach(user => {
        console.log(`  - ${user.email} (${user.id}) - Created: ${user.created_at}`)
      })
    }

    console.log('\n📋 Checking players table...')
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(10)

    if (playersError) {
      console.log('❌ Error fetching players:', playersError.message)
    } else {
      console.log(`✅ Found ${players.length} players (showing first 10):`)
      players.forEach(player => {
        console.log(`  - ${player.first_name} ${player.last_name} (${player.position}) - Tenant: ${player.tenant_id}`)
      })
    }

    console.log('\n🏢 Checking tenants table...')
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')

    if (tenantsError) {
      console.log('❌ Error fetching tenants:', tenantsError.message)
    } else {
      console.log(`✅ Found ${tenants.length} tenants:`)
      tenants.forEach(tenant => {
        console.log(`  - ${tenant.name} (${tenant.slug}) - ID: ${tenant.id}`)
      })
    }

  } catch (error) {
    console.error('💥 Database check failed:', error.message)
  }
}

checkDatabase()