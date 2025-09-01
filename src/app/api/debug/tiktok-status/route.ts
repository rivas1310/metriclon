import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID es requerido'
      }, { status: 400 });
    }

    console.log('=== DEBUG TIKTOK STATUS ===');
    console.log('Organization ID:', organizationId);

    // Buscar todos los canales de TikTok en la organización
    const tiktokChannels = await prisma.channel.findMany({
      where: {
        organizationId: organizationId,
        platform: 'TIKTOK'
      },
      select: {
        id: true,
        platform: true,
        name: true,
        isActive: true,
        accessToken: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('TikTok channels encontrados:', tiktokChannels);

    // Buscar también con diferentes variaciones de platform
    const allChannels = await prisma.channel.findMany({
      where: {
        organizationId: organizationId
      },
      select: {
        id: true,
        platform: true,
        name: true,
        isActive: true,
        accessToken: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Todos los canales:', allChannels);

    // Buscar variaciones de TikTok
    const tiktokVariations = allChannels.filter(channel => 
      channel.platform.toLowerCase().includes('tiktok') ||
      channel.platform.toLowerCase().includes('tik') ||
      channel.platform === 'TIKTOK' ||
      channel.platform === 'tiktok' ||
      channel.platform === 'TikTok'
    );

    console.log('Variaciones de TikTok encontradas:', tiktokVariations);

    return NextResponse.json({
      success: true,
      organizationId,
      tiktokChannels,
      allChannels,
      tiktokVariations,
      hasTikTok: tiktokChannels.length > 0,
      tiktokCount: tiktokChannels.length,
      totalChannels: allChannels.length,
      message: 'Estado de TikTok verificado correctamente'
    });

  } catch (error) {
    console.error('Error en debug TikTok status:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
