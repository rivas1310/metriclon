import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Organización correcta
    const correctOrgId = '997693ca-8304-464e-87a9-ccb22b576724';
    
    // Buscar TikTok en la organización correcta
    const tiktokChannel = await prisma.channel.findFirst({
      where: {
        platform: 'TIKTOK',
        organizationId: correctOrgId
      }
    });
    
    // Buscar todos los canales de la organización correcta
    const allChannels = await prisma.channel.findMany({
      where: {
        organizationId: correctOrgId
      },
      select: {
        id: true,
        platform: true,
        name: true,
        isActive: true
      }
    });
    
    return NextResponse.json({
      success: true,
      tiktokConnected: !!tiktokChannel,
      tiktokChannel: tiktokChannel,
      allChannels: allChannels,
      organizationId: correctOrgId,
      message: tiktokChannel ? 'TikTok está conectado' : 'TikTok NO está conectado'
    });
    
  } catch (error) {
    console.error('Error en simple check:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
