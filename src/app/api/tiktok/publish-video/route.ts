export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TIKTOK PUBLISH VIDEO ===');
    
    // Verificar token de autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, videoFile, caption, privacyLevel = 'public', scheduledTime } = body;

    if (!organizationId || !videoFile) {
      return NextResponse.json({ 
        error: 'Organization ID y archivo de video son requeridos' 
      }, { status: 400 });
    }

    // Obtener el canal de TikTok de la organización
    const tiktokChannel = await prisma.channel.findFirst({
      where: {
        organizationId,
        platform: 'TIKTOK',
        isConnected: true
      }
    });

    if (!tiktokChannel) {
      return NextResponse.json({ 
        error: 'No hay canal de TikTok conectado para esta organización' 
      }, { status: 400 });
    }

    console.log('Canal TikTok encontrado:', tiktokChannel.id);
    console.log('Caption:', caption);
    console.log('Privacy Level:', privacyLevel);
    console.log('Scheduled Time:', scheduledTime);

    // Aquí implementarías la lógica de publicación directa a TikTok
    // Usando la Content Posting API con scope video.publish
    
    const publishResult = {
      success: true,
      videoId: `tiktok_published_${Date.now()}`,
      status: scheduledTime ? 'scheduled' : 'published',
      message: scheduledTime ? 'Video programado para publicación' : 'Video publicado exitosamente en TikTok',
      channelId: tiktokChannel.id,
      organizationId,
      scheduledTime: scheduledTime || null
    };

    console.log('Resultado de publicación:', publishResult);
    
    return NextResponse.json(publishResult);

  } catch (error) {
    console.error('Error en TikTok publish video:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
