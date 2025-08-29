import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    const where: any = {
      post: {
        organizationId,
      },
    };

    if (startDate && endDate) {
      where.capturedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const metrics = await prisma.postMetric.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            type: true,
            channel: {
              select: {
                id: true,
                name: true,
                platform: true,
              },
            },
          },
        },
      },
      orderBy: { capturedAt: 'desc' },
    });

    // Calcular métricas agregadas
    const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0);
    const totalEngagement = metrics.reduce((sum, m) => sum + (m.engagement || 0), 0);
    const totalPosts = metrics.length;

    const aggregatedMetrics = {
      totalImpressions,
      totalReach,
      totalEngagement,
      totalPosts,
      averageEngagement: totalPosts > 0 ? totalEngagement / totalPosts : 0,
      metrics,
    };

    return NextResponse.json({ data: aggregatedMetrics });
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
