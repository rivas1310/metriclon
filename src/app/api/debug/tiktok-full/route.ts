import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG TIKTOK FULL ===');
    
    // Buscar TODOS los canales de TikTok sin importar la organización
    const allTikTokChannels = await prisma.channel.findMany({
      where: {
        platform: 'TIKTOK'
      },
      select: {
        id: true,
        platform: true,
        name: true,
        organizationId: true,
        isActive: true,
        accessToken: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Todos los canales de TikTok encontrados:', allTikTokChannels);

    // Buscar canales de TikTok con organizationId 'default'
    const defaultTikTokChannels = await prisma.channel.findMany({
      where: {
        platform: 'TIKTOK',
        organizationId: 'default'
      },
      select: {
        id: true,
        platform: true,
        name: true,
        organizationId: true,
        isActive: true,
        accessToken: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('TikTok channels con organizationId default:', defaultTikTokChannels);

    // Buscar canales de TikTok con organizationId específico
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    let specificOrgTikTokChannels = [];
    if (organizationId) {
      specificOrgTikTokChannels = await prisma.channel.findMany({
        where: {
          platform: 'TIKTOK',
          organizationId: organizationId
        },
        select: {
          id: true,
          platform: true,
          name: true,
          organizationId: true,
          isActive: true,
          accessToken: true,
          createdAt: true,
          updatedAt: true
        }
      });
      console.log(`TikTok channels con organizationId ${organizationId}:`, specificOrgTikTokChannels);
    }

    // Buscar TODOS los canales de todas las organizaciones
    const allChannels = await prisma.channel.findMany({
      select: {
        id: true,
        platform: true,
        name: true,
        organizationId: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Todos los canales de todas las organizaciones:', allChannels);

    // Agrupar por organización
    const orgsWithChannels = allChannels.reduce((acc, channel) => {
      if (!acc[channel.organizationId]) {
        acc[channel.organizationId] = {
          organizationId: channel.organizationId,
          channels: [],
          totalChannels: 0
        };
      }
      acc[channel.organizationId].channels.push(channel);
      acc[channel.organizationId].totalChannels++;
      return acc;
    }, {} as Record<string, any>);

    console.log('Organizaciones con canales:', orgsWithChannels);

    return NextResponse.json({
      success: true,
      message: 'Debug completo de TikTok',
      organizationId: organizationId || 'NO ESPECIFICADO',
      allTikTokChannels,
      defaultTikTokChannels,
      specificOrgTikTokChannels,
      allChannels,
      organizations: Object.values(orgsWithChannels),
      hasAnyTikTok: allTikTokChannels.length > 0,
      hasDefaultTikTok: defaultTikTokChannels.length > 0,
      hasSpecificOrgTikTok: specificOrgTikTokChannels.length > 0,
      totalTikTokChannels: allTikTokChannels.length,
      totalChannels: allChannels.length,
      note: 'Esto te mostrará exactamente dónde están todos los canales de TikTok'
    });

  } catch (error) {
    console.error('Error en debug TikTok full:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
