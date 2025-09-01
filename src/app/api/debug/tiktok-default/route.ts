import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG TIKTOK DEFAULT ===');
    
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

    console.log('Todos los canales de TikTok:', allTikTokChannels);

    return NextResponse.json({
      success: true,
      message: 'TikTok channels verificados',
      defaultTikTokChannels,
      allTikTokChannels,
      hasDefaultTikTok: defaultTikTokChannels.length > 0,
      totalTikTokChannels: allTikTokChannels.length,
      note: 'Esto te mostrará si hay canales de TikTok guardados en la organización incorrecta'
    });

  } catch (error) {
    console.error('Error en debug TikTok default:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
