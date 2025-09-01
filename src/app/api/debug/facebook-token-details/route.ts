import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Mostrando detalles completos del token...');

    // Buscar cualquier canal de Facebook en la base de datos
    const channel = await prisma.channel.findFirst({
      where: {
        platform: 'FACEBOOK'
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'No se encontró ningún canal de Facebook' }, { status: 404 });
    }

    // Mostrar información completa del canal
    const channelInfo = {
      id: channel.id,
      organizationId: channel.organizationId,
      platform: channel.platform,
      name: channel.name,
      accessToken: channel.accessToken,
      accessTokenLength: channel.accessToken.length,
      accessTokenPreview: channel.accessToken.substring(0, 50) + '...',
      accessTokenEnd: channel.accessToken.substring(channel.accessToken.length - 20),
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt
    };

    // Verificar si el token parece ser real
    const isRealToken = channel.accessToken.length > 50 && 
                       !channel.accessToken.includes('ejemplo') && 
                       !channel.accessToken.includes('placeholder') &&
                       !channel.accessToken.includes('test');

    return NextResponse.json({
      success: true,
      channel: channelInfo,
      analysis: {
        isRealToken,
        tokenLength: channel.accessToken.length,
        containsExample: channel.accessToken.includes('ejemplo'),
        containsPlaceholder: channel.accessToken.includes('placeholder'),
        containsTest: channel.accessToken.includes('test'),
        recommendation: isRealToken ? 
          'El token parece ser real. El problema puede ser que expiró o no tiene permisos suficientes.' :
          'El token parece ser un placeholder/ejemplo. Necesitas reconectar tu cuenta de Facebook.'
      },
      note: 'Revisa la consola del servidor para logs detallados'
    });

  } catch (error) {
    console.error('❌ Error al mostrar detalles del token:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
