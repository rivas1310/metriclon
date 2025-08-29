import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string; channelId: string } }
) {
  try {
    // Verificar token de autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { organizationId, channelId } = params;

    // Verificar que el usuario pertenece a la organización
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: decoded.userId,
        organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener el canal y verificar que pertenece a la organización
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        organizationId,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 });
    }

    if (!channel.isActive || !channel.accessToken) {
      return NextResponse.json({ error: 'Canal no conectado' }, { status: 400 });
    }

    let syncResult = {};

    // Sincronizar según la plataforma
    switch (channel.platform) {
      case 'INSTAGRAM':
        syncResult = await syncInstagramChannel(channel);
        break;
      case 'FACEBOOK':
        syncResult = await syncFacebookChannel(channel);
        break;
      case 'LINKEDIN':
        syncResult = await syncLinkedInChannel(channel);
        break;
      case 'TWITTER':
        syncResult = await syncTwitterChannel(channel);
        break;
      case 'YOUTUBE':
        syncResult = await syncYouTubeChannel(channel);
        break;
      default:
        return NextResponse.json({ error: 'Plataforma no soportada' }, { status: 400 });
    }

    // Actualizar el canal con la información sincronizada
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        updatedAt: new Date(),
        meta: {
          lastSyncData: syncResult,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Canal sincronizado exitosamente',
      data: syncResult,
    });

  } catch (error) {
    console.error('Error sincronizando canal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Funciones auxiliares para sincronizar cada plataforma
async function syncInstagramChannel(channel: any) {
  try {
    // Obtener información del usuario
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${channel.accessToken}`
    );
    
    if (!userResponse.ok) {
      throw new Error('Error obteniendo datos de usuario Instagram');
    }

    const userData = await userResponse.json();

    // Obtener posts recientes
    const postsResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${channel.accessToken}`
    );

    let postsData = { data: [] };
    if (postsResponse.ok) {
      postsData = await postsResponse.json();
    }

    return {
      user: userData,
      posts: postsData.data || [],
      platform: 'instagram',
    };
  } catch (error) {
    console.error('Error sincronizando Instagram:', error);
    return { error: 'Error en Instagram API' };
  }
}

async function syncFacebookChannel(channel: any) {
  try {
    // Obtener información de la página
    const pageResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,fan_count,followers_count&access_token=${channel.accessToken}`
    );
    
    if (!pageResponse.ok) {
      throw new Error('Error obteniendo datos de página Facebook');
    }

    const pageData = await pageResponse.json();

    return {
      page: pageData,
      platform: 'facebook',
    };
  } catch (error) {
    console.error('Error sincronizando Facebook:', error);
    return { error: 'Error en Facebook API' };
  }
}

async function syncLinkedInChannel(channel: any) {
  // LinkedIn requiere una implementación más compleja
  return {
    platform: 'linkedin',
    note: 'Sincronización de LinkedIn requiere configuración adicional',
  };
}

async function syncTwitterChannel(channel: any) {
  // Twitter requiere una implementación más compleja
  return {
    platform: 'twitter',
    note: 'Sincronización de Twitter requiere configuración adicional',
  };
}

async function syncYouTubeChannel(channel: any) {
  try {
    // Obtener información del canal
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${channel.accessToken}`
    );
    
    if (!channelResponse.ok) {
      throw new Error('Error obteniendo datos de canal YouTube');
    }

    const channelData = await channelResponse.json();

    return {
      channel: channelData.items?.[0] || {},
      platform: 'youtube',
    };
  } catch (error) {
    console.error('Error sincronizando YouTube:', error);
    return { error: 'Error en YouTube API' };
  }
}
