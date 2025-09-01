import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== VERIFICACIÓN FINAL DE TIKTOK ===');
    
    // 1. Verificar TikTok en la organización correcta
    const correctOrgTikTok = await prisma.channel.findFirst({
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

    // 2. Verificar que no haya TikTok en la organización incorrecta
    const wrongOrgTikTok = await prisma.channel.findFirst({
      where: {
        platform: 'TIKTOK',
        organizationId: 'ceeba04f-60c4-4162-b22d-e7469ad8da93'
      }
    });

    // 3. Verificar todos los canales de la organización correcta
    const correctOrgChannels = await prisma.channel.findMany({
      where: {
        organizationId: '997693ca-8304-464e-87a9-ccb22b576724'
      },
      select: {
        id: true,
        platform: true,
        name: true,
        isActive: true
      }
    });

    // 4. Análisis de verificación
    const verification = {
      tiktokInCorrectOrg: !!correctOrgTikTok,
      tiktokInWrongOrg: !!wrongOrgTikTok,
      totalChannelsInCorrectOrg: correctOrgChannels.length,
      platformsInCorrectOrg: correctOrgChannels.map(c => c.platform),
      status: correctOrgTikTok && !wrongOrgTikTok ? '✅ PERFECTO' : '❌ PROBLEMA DETECTADO'
    };

    console.log('Verificación final:', verification);

    return NextResponse.json({
      success: true,
      message: 'VERIFICACIÓN FINAL DE TIKTOK',
      verification,
      correctOrgTikTok,
      wrongOrgTikTok,
      correctOrgChannels,
      recommendations: [
        correctOrgTikTok ? '✅ TikTok está en la organización correcta' : '❌ TikTok NO está en la organización correcta',
        !wrongOrgTikTok ? '✅ No hay TikTok en la organización incorrecta' : '❌ TikTok está en la organización incorrecta',
        correctOrgTikTok ? '🎯 TikTok debería aparecer en el modal "Crear Nuevo Post"' : '🔧 Conectar TikTok desde la organización correcta'
      ]
    });

  } catch (error) {
    console.error('Error en verificación final:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
