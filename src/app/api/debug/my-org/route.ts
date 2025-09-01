import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG MY ORG ===');
    
    // Obtener todos los canales para ver qué organizaciones existen
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

    console.log('Todos los canales:', allChannels);

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

    // Buscar específicamente TikTok
    const tiktokChannels = allChannels.filter(ch => 
      ch.platform.toLowerCase().includes('tiktok') ||
      ch.platform.toLowerCase().includes('tik')
    );

    console.log('Canales de TikTok encontrados:', tiktokChannels);

    return NextResponse.json({
      success: true,
      message: 'Organizaciones encontradas',
      totalChannels: allChannels.length,
      organizations: Object.values(orgsWithChannels),
      tiktokChannels,
      note: 'Usa uno de estos Organization IDs en los endpoints de debug'
    });

  } catch (error) {
    console.error('Error en debug my org:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
