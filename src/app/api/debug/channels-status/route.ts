export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG CHANNELS STATUS ===');
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ 
        error: 'Organization ID es requerido' 
      }, { status: 400 });
    }

    // Obtener todos los canales de la organización
    const channels = await prisma.channel.findMany({
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

    console.log('Canales encontrados:', channels);
    
    // Verificar específicamente TikTok
    const tiktokChannel = channels.find(c => c.platform === 'TIKTOK');
    console.log('Canal TikTok:', tiktokChannel);

    return NextResponse.json({
      success: true,
      organizationId,
      totalChannels: channels.length,
      channels: channels,
      tiktokChannel: tiktokChannel,
      hasTikTok: !!tiktokChannel,
      tiktokConnected: tiktokChannel?.isActive || false,
      message: 'Estado de canales obtenido correctamente'
    });

  } catch (error) {
    console.error('Error en debug channels status:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
