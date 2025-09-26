const { PrismaClient } = require('@prisma/client');

async function createUserMembership() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Creating user membership...');

    // Create membership for user to test1 tenant
    const membership = await prisma.tenantMembership.create({
      data: {
        userId: '7d092ae6-be50-4d74-ba12-991bb120330e',
        tenantId: 'cmfsiz5ge0003cjc7uhd2nmc1', // test1 tenant
        role: 'OWNER'
      }
    });

    console.log('✅ Created membership:', membership);

    // Also create memberships for other tenants
    const tenants = [
      'cmfsiuhqx0000cjc7aztz3oin', // elite-sports-group
      'cmfu4l82e0000fm8gw7vjs9i4', // Other tenant
      'cmfsiz6rx0005cjc7k4iqr7md'  // Another tenant
    ];

    for (const tenantId of tenants) {
      try {
        const mem = await prisma.tenantMembership.create({
          data: {
            userId: '7d092ae6-be50-4d74-ba12-991bb120330e',
            tenantId: tenantId,
            role: 'ADMIN'
          }
        });
        console.log(`✅ Created membership for tenant ${tenantId}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`ℹ️ Membership already exists for tenant ${tenantId}`);
        } else {
          console.log(`⚠️ Failed to create membership for ${tenantId}:`, error.message);
        }
      }
    }

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️ Membership already exists');
    } else {
      console.error('❌ Error creating membership:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUserMembership();