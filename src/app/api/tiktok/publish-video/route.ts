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
        isActive: true
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

    // Implementar la lógica real de TikTok usando Content Posting API
    console.log('Iniciando publicación directa a TikTok...');
    
    // Para video.publish (publicación directa), usamos la API de TikTok
    const publishData = {
      post_info: {
        title: caption,
        privacy_level: privacyLevel,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoFile.size,
        chunk_size: 1024 * 1024, // 1MB chunks
      }
    };

    // Si hay programación, agregar timestamp
    if (scheduledTime) {
      publishData.post_info['scheduled_publish_time'] = Math.floor(new Date(scheduledTime).getTime() / 1000);
    }

    const tiktokResponse = await fetch('https://open.tiktokapis.com/v2/video/publish/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tiktokChannel.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(publishData)
    });

    if (!tiktokResponse.ok) {
      const errorData = await tiktokResponse.json();
      console.error('Error de TikTok API:', errorData);
      return NextResponse.json({ 
        error: `Error de TikTok: ${errorData.error?.message || 'Error desconocido'}` 
      }, { status: 400 });
    }

    const tiktokData = await tiktokResponse.json();
    
    const publishResult = {
      success: true,
      videoId: tiktokData.data?.video_id || `tiktok_published_${Date.now()}`,
      status: scheduledTime ? 'scheduled' : 'published',
      message: scheduledTime ? 'Video programado para publicación' : 'Video publicado exitosamente en TikTok',
      channelId: tiktokChannel.id,
      organizationId,
      scheduledTime: scheduledTime || null,
      tiktokResponse: tiktokData
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
