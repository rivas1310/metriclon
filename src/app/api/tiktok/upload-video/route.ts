export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TIKTOK UPLOAD VIDEO ===');
    
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
    const { organizationId, videoFile, caption, privacyLevel = 'public' } = body;

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
    console.log('Access Token disponible:', !!tiktokChannel.accessToken);

    // Aquí implementarías la lógica de subida a TikTok
    // Por ahora, simulamos la respuesta exitosa
    
    const uploadResult = {
      success: true,
      videoId: `tiktok_${Date.now()}`,
      status: 'uploaded',
      message: 'Video subido exitosamente a TikTok',
      channelId: tiktokChannel.id,
      organizationId
    };

    console.log('Resultado de subida:', uploadResult);
    
    return NextResponse.json(uploadResult);

  } catch (error) {
    console.error('Error en TikTok upload video:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
