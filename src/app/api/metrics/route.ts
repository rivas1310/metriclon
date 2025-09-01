import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getAllPlatformAnalytics, getFacebookAnalytics, getInstagramAnalytics } from '@/lib/socialMediaAPI';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const days = parseInt(searchParams.get('days') || '30');
    const platform = searchParams.get('platform'); // 'facebook', 'instagram', o null para ambos

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario pertenece a la organización
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: decoded.userId,
        organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta organización' },
        { status: 403 }
      );
    }

    // Obtener canales conectados de la organización
    const whereChannels: any = {
      organizationId,
      isActive: true,
    };

    if (platform) {
      whereChannels.platform = platform.toUpperCase();
    } else {
      // Solo Facebook e Instagram por ahora
      whereChannels.platform = {
        in: ['FACEBOOK', 'INSTAGRAM']
      };
    }

    const channels = await prisma.channel.findMany({
      where: whereChannels,
    });

    if (channels.length === 0) {
      return NextResponse.json({
        data: {
          platforms: [],
          summary: {
            totalFollowers: 0,
            totalImpressions: 0,
            totalReach: 0,
            totalEngagement: 0,
            engagementRate: 0,
            postCount: 0,
          },
          message: 'No hay canales conectados para obtener métricas'
        }
      });
    }

    // Obtener analytics reales de cada plataforma
    console.log(`🚀 Obteniendo métricas reales para ${channels.length} canales:`, 
      channels.map(c => `${c.platform}(${c.id})`));
    
    const platformAnalytics = await getAllPlatformAnalytics(channels, days);
    
    console.log(`📊 Analytics obtenidos: ${platformAnalytics.length} plataformas`, 
      platformAnalytics.map(p => p.platform));

    // Calcular métricas agregadas
    const summary = platformAnalytics.reduce((acc, platform) => {
      const followers = 'followers_count' in platform.accountInfo 
        ? platform.accountInfo.followers_count 
        : ('fan_count' in platform.accountInfo ? platform.accountInfo.fan_count : 0);

      return {
        totalFollowers: acc.totalFollowers + followers,
        totalImpressions: acc.totalImpressions + platform.insights.totalImpressions,
        totalReach: acc.totalReach + platform.insights.totalReach,
        totalEngagement: acc.totalEngagement + platform.insights.totalEngagement,
        postCount: acc.postCount + platform.insights.postCount,
      };
    }, {
      totalFollowers: 0,
      totalImpressions: 0,
      totalReach: 0,
      totalEngagement: 0,
      postCount: 0,
    });

    const engagementRate = summary.totalFollowers > 0 
      ? (summary.totalEngagement / summary.totalFollowers) * 100 
      : 0;

    const responseData = {
      platforms: platformAnalytics.map(platform => ({
        platform: platform.platform,
        accountInfo: platform.accountInfo,
        insights: platform.insights,
        recentPosts: platform.recentPosts.slice(0, 10), // Limitar a 10 posts más recientes
        dateRange: platform.dateRange,
      })),
      summary: {
        ...summary,
        engagementRate,
      },
      generatedAt: new Date().toISOString(),
      days,
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { postId, metrics } = await request.json();

    if (!postId || !metrics) {
      return NextResponse.json(
        { error: 'postId y metrics son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene acceso al post
    const post = await prisma.post.findFirst({
      where: { id: postId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: decoded.userId },
            },
          },
        },
      },
    });

    if (!post || post.organization.members.length === 0) {
      return NextResponse.json(
        { error: 'No tienes acceso a este post' },
        { status: 403 }
      );
    }

    const postMetric = await prisma.postMetric.create({
      data: {
        postId,
        capturedAt: new Date(),
        impressions: metrics.impressions,
        reach: metrics.reach,
        clicks: metrics.clicks,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        saves: metrics.saves,
        views: metrics.views,
        engagement: metrics.engagement,
      },
      include: {
        post: true,
      },
    });

    return NextResponse.json({ data: postMetric });
  } catch (error) {
    console.error('Error creando métrica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
