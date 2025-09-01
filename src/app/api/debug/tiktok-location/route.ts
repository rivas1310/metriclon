import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG TIKTOK LOCATION - ANÁLISIS COMPLETO ===');
    
    // 1. Buscar TODOS los canales de TikTok en TODAS las organizaciones
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

    console.log('1. TODOS los canales de TikTok encontrados:', allTikTokChannels);

    // 2. Buscar canales de TikTok en la organización INCORRECTA
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

    console.log('2. TikTok en organización INCORRECTA:', wrongOrgTikTokChannels);

    // 3. Buscar canales de TikTok en la organización CORRECTA
    const correctOrgTikTokChannels = await prisma.channel.findMany({
      where: {
        platform: 'TIKTOK',
        organizationId: '997693ca-8304-464e-87a9-ccb22b576724'
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

    console.log('3. TikTok en organización CORRECTA:', correctOrgTikTokChannels);

    // 4. Buscar TODOS los canales de todas las organizaciones
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

    console.log('4. TODOS los canales de todas las organizaciones:', allChannels);

    // 5. Agrupar por organización
    const orgsWithChannels = allChannels.reduce((acc, channel) => {
      if (!acc[channel.organizationId]) {
        acc[channel.organizationId] = {
          organizationId: channel.organizationId,
          channels: [],
          totalChannels: 0,
          platforms: []
        };
      }
      acc[channel.organizationId].channels.push(channel);
      acc[channel.organizationId].totalChannels++;
      if (!acc[channel.organizationId].platforms.includes(channel.platform)) {
        acc[channel.organizationId].platforms.push(channel.platform);
      }
      return acc;
    }, {} as Record<string, any>);

    console.log('5. Organizaciones agrupadas:', orgsWithChannels);

    // 6. Análisis del problema
    const problemAnalysis = {
      hasTikTokAnywhere: allTikTokChannels.length > 0,
      hasTikTokInWrongOrg: wrongOrgTikTokChannels.length > 0,
      hasTikTokInCorrectOrg: correctOrgTikTokChannels.length > 0,
      totalTikTokChannels: allTikTokChannels.length,
      wrongOrgId: 'ceeba04f-60c4-4162-b22d-e7469ad8da93',
      correctOrgId: '997693ca-8304-464e-87a9-ccb22b576724',
      problem: wrongOrgTikTokChannels.length > 0 ? 
        'TikTok está en la organización INCORRECTA' : 
        'TikTok no se guardó en ninguna organización',
      solution: wrongOrgTikTokChannels.length > 0 ?
        'Mover TikTok a la organización correcta' :
        'Conectar TikTok desde la organización correcta'
    };

    console.log('6. ANÁLISIS DEL PROBLEMA:', problemAnalysis);

    return NextResponse.json({
      success: true,
      message: 'ANÁLISIS COMPLETO DE TIKTOK - UBICACIÓN Y PROBLEMAS',
      analysis: problemAnalysis,
      allTikTokChannels,
      wrongOrgTikTokChannels,
      correctOrgTikTokChannels,
      allChannels,
      organizations: Object.values(orgsWithChannels),
      recommendations: [
        '1. Verificar en qué organización estás actualmente en el dashboard',
        '2. Cambiar a la organización correcta: 997693ca-8304-464e-87a9-ccb22b576724',
        '3. Si TikTok está en la organización incorrecta, moverlo',
        '4. Si no hay TikTok, conectarlo desde la organización correcta'
      ]
    });

  } catch (error) {
    console.error('Error en debug TikTok location:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
