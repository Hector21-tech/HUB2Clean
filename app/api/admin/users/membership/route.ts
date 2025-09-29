import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE: Ta bort user membership från tenant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const tenantId = searchParams.get('tenantId')

    if (!userId || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'userId and tenantId are required'
      }, { status: 400 })
    }

    console.log('🗑️ Admin: Removing user membership:', { userId, tenantId })

    // Find the membership first
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        userId: userId,
        tenantId: tenantId
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Membership not found'
      }, { status: 404 })
    }

    // Safety check: Don't remove the last OWNER
    if (membership.role === 'OWNER') {
      const ownerCount = await prisma.tenantMembership.count({
        where: {
          tenantId: tenantId,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json({
          success: false,
          error: 'Cannot remove the last OWNER of the organization'
        }, { status: 400 })
      }
    }

    // Remove the membership
    await prisma.tenantMembership.delete({
      where: {
        id: membership.id
      }
    })

    console.log('✅ Admin: Successfully removed membership:', {
      user: membership.user.email,
      tenant: membership.tenant.name,
      role: membership.role
    })

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${membership.user.email} from ${membership.tenant.name}`,
      data: {
        removedMembership: {
          userId: membership.userId,
          userEmail: membership.user.email,
          tenantId: membership.tenantId,
          tenantName: membership.tenant.name,
          role: membership.role
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin remove membership error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to remove user membership',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH: Uppdatera user role
export async function PATCH(request: NextRequest) {
  try {
    const { userId, tenantId, newRole } = await request.json()

    if (!userId || !tenantId || !newRole) {
      return NextResponse.json({
        success: false,
        error: 'userId, tenantId and newRole are required'
      }, { status: 400 })
    }

    console.log('🔄 Admin: Updating user role:', { userId, tenantId, newRole })

    // Validate role
    const validRoles = ['OWNER', 'ADMIN', 'MANAGER', 'SCOUT', 'VIEWER']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      }, { status: 400 })
    }

    // Find the membership
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        userId: userId,
        tenantId: tenantId
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Membership not found'
      }, { status: 404 })
    }

    // Safety check: Don't downgrade the last OWNER
    if (membership.role === 'OWNER' && newRole !== 'OWNER') {
      const ownerCount = await prisma.tenantMembership.count({
        where: {
          tenantId: tenantId,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json({
          success: false,
          error: 'Cannot downgrade the last OWNER of the organization'
        }, { status: 400 })
      }
    }

    // Update the role
    const updatedMembership = await prisma.tenantMembership.update({
      where: {
        id: membership.id
      },
      data: {
        role: newRole as any
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    console.log('✅ Admin: Successfully updated role:', {
      user: updatedMembership.user.email,
      tenant: updatedMembership.tenant.name,
      oldRole: membership.role,
      newRole: updatedMembership.role
    })

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedMembership.user.email} role to ${updatedMembership.role}`,
      data: {
        membership: {
          id: updatedMembership.id,
          userId: updatedMembership.userId,
          userEmail: updatedMembership.user.email,
          tenantId: updatedMembership.tenantId,
          tenantName: updatedMembership.tenant.name,
          oldRole: membership.role,
          newRole: updatedMembership.role
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin update role error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to update user role',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}