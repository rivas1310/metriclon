import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    const where: any = {
      organizationId,
    };

    if (status) {
      // Validar que el status sea válido y convertirlo a mayúsculas
      const validStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED'];
      const upperStatus = status.toUpperCase();
      if (validStatuses.includes(upperStatus)) {
        where.status = upperStatus;
      }
    }
    if (type) {
      // Validar que el type sea válido y convertirlo a mayúsculas
      const validTypes = ['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'REEL', 'STORY', 'LINK'];
      const upperType = type.toUpperCase();
      if (validTypes.includes(upperType)) {
        where.type = upperType;
      }
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assets: true,
        _count: {
          select: {
            metrics: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ data: posts });
  } catch (error) {
    console.error('Error obteniendo posts:', error);
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

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const {
      organizationId,
      channelId,
      type,
      caption,
      link,
      hashtags,
      scheduledAt,
      assets,
    } = await request.json();

    if (!organizationId || !channelId || !type) {
      return NextResponse.json(
        { error: 'organizationId, channelId y type son requeridos' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        organizationId,
        channelId,
        type,
        caption,
        link,
        hashtags: hashtags || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: decoded.userId,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
      include: {
        channel: true,
        creator: true,
      },
    });

    // Crear assets si existen
    if (assets && assets.length > 0) {
      await prisma.asset.createMany({
        data: assets.map((asset: any) => ({
          postId: post.id,
          type: asset.type,
          url: asset.url,
          filename: asset.filename,
          size: asset.size,
          meta: asset.meta,
        })),
      });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('Error creando post:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

