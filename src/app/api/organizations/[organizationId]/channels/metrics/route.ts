import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
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

    const { organizationId } = params;

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

    // Obtener todos los canales conectados de la organización
    const channels = await prisma.channel.findMany({
      where: { 
        organizationId, 
        isActive: true 
      },
      select: {
        id: true,
        platform: true,
        name: true,
        accessToken: true,
        meta: true,
        updatedAt: true,
      },
    });

    const metrics: Record<string, any> = {};

    // Obtener métricas para cada canal según la plataforma
    for (const channel of channels) {
      try {
        let channelMetrics = {};
        
        switch (channel.platform) {
          case 'INSTAGRAM':
            channelMetrics = await getInstagramMetrics(channel);
            break;
          case 'FACEBOOK':
            channelMetrics = await getFacebookMetrics(channel);
            break;
          case 'LINKEDIN':
            channelMetrics = await getLinkedInMetrics(channel);
            break;
          case 'TWITTER':
            channelMetrics = await getTwitterMetrics(channel);
            break;
          case 'YOUTUBE':
            channelMetrics = await getYouTubeMetrics(channel);
            break;
          default:
            channelMetrics = { error: 'Plataforma no soportada' };
        }

        metrics[channel.id] = {
          ...channelMetrics,
          lastSync: channel.updatedAt,
          platform: channel.platform,
        };
      } catch (error) {
        console.error(`Error obteniendo métricas de ${channel.platform}:`, error);
        metrics[channel.id] = {
          error: 'Error al obtener métricas',
          lastSync: channel.updatedAt,
          platform: channel.platform,
        };
      }
    }

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error obteniendo métricas de canales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Funciones auxiliares para obtener métricas de cada plataforma
async function getInstagramMetrics(channel: any) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,followers_count,media_count&access_token=${channel.accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Error en API de Instagram');
    }

    const data = await response.json();
    return {
      followers: data.followers_count || 0,
      posts: data.media_count || 0,
      platform: 'instagram',
    };
  } catch (error) {
    console.error('Error obteniendo métricas de Instagram:', error);
    return { error: 'Error en Instagram API' };
  }
}

async function getFacebookMetrics(channel: any) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,followers_count,fan_count&access_token=${channel.accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Error en API de Facebook');
    }

    const data = await response.json();
    return {
      followers: data.followers_count || data.fan_count || 0,
      platform: 'facebook',
    };
  } catch (error) {
    console.error('Error obteniendo métricas de Facebook:', error);
    return { error: 'Error en Facebook API' };
  }
}

async function getLinkedInMetrics(channel: any) {
  // LinkedIn requiere una implementación más compleja
  return {
    followers: 0,
    platform: 'linkedin',
    note: 'Métricas de LinkedIn requieren configuración adicional',
  };
}

async function getTwitterMetrics(channel: any) {
  // Twitter requiere una implementación más compleja
  return {
    followers: 0,
    platform: 'twitter',
    note: 'Métricas de Twitter requieren configuración adicional',
  };
}

async function getYouTubeMetrics(channel: any) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true&access_token=${channel.accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Error en API de YouTube');
    }

    const data = await response.json();
    const stats = data.items?.[0]?.statistics;
    
    return {
      subscribers: stats?.subscriberCount || 0,
      videos: stats?.videoCount || 0,
      views: stats?.viewCount || 0,
      platform: 'youtube',
    };
  } catch (error) {
    console.error('Error obteniendo métricas de YouTube:', error);
    return { error: 'Error en YouTube API' };
  }
}
