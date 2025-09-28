const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugTenant() {
  try {
    const tenantId = 'cmfsiuhqx0000cjc7aztz3oin'

    console.log('🔍 Checking tenant ID:', tenantId)

    // Check if tenant exists by ID
    const tenantById = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    console.log('📊 Tenant found by ID:', tenantById ? `${tenantById.name} (${tenantById.slug})` : 'NOT FOUND')

    if (tenantById) {
      // Check players for this tenant
      const players = await prisma.player.findMany({
        where: { tenantId: tenantId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          club: true
        }
      })

      console.log(`🏃‍♂️ Players found: ${players.length}`)
      players.forEach(player => {
        console.log(`  - ${player.firstName} ${player.lastName} (${player.club || 'No club'})`)
      })
    }

    // Also check what elite-sports-group slug maps to
    const tenantBySlug = await prisma.tenant.findUnique({
      where: { slug: 'elite-sports-group' }
    })

    console.log('🎯 elite-sports-group maps to:', tenantBySlug ? `ID: ${tenantBySlug.id}` : 'NOT FOUND')

    if (tenantBySlug && tenantBySlug.id !== tenantId) {
      console.log('❌ MISMATCH! Frontend uses:', tenantId, 'but elite-sports-group is:', tenantBySlug.id)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTenant()