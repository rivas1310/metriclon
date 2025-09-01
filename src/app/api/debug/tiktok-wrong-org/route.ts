import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG TIKTOK WRONG ORG ===');
    
    // Buscar canales de TikTok en la organización incorrecta
    const wrongOrgTikTokChannels = await prisma.channel.findMany({
      where: {
        platform: 'TIKTOK',
        organizationId: 'ceeba04f-60c4-4162-b22d-e7469ad8da93'
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

    console.log('TikTok channels en organización incorrecta:', wrongOrgTikTokChannels);

    // Buscar TODOS los canales de TikTok
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
      message: 'TikTok en organización incorrecta verificado',
      wrongOrgTikTokChannels,
      allTikTokChannels,
      hasWrongOrgTikTok: wrongOrgTikTokChannels.length > 0,
      totalTikTokChannels: allTikTokChannels.length,
      note: 'Esto te mostrará si TikTok se guardó en la organización incorrecta'
    });

  } catch (error) {
    console.error('Error en debug TikTok wrong org:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
