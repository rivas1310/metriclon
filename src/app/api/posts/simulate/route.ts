import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const { organizationId, channelId, caption, scheduledFor, type = 'TEXT' }: {
      organizationId: string;
      channelId: string;
      caption: string;
      scheduledFor?: string;
      type?: string;
    } = await request.json();

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

    // Verificar que el canal existe y pertenece a la organización
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        organizationId,
        isActive: true,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 });
    }

    // Crear el post simulado
    const post = await prisma.post.create({
      data: {
        organizationId,
        channelId,
        caption,
        type: type as any,
        status: 'SCHEDULED',
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        publishedAt: null,
        createdBy: decoded.userId,
        meta: {
          isSimulated: true,
          note: 'Post simulado - no publicado realmente en Facebook',
          platform: channel.platform,
          channelName: channel.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      post,
      message: 'Post simulado creado exitosamente',
      note: 'Este post no se publicará realmente en Facebook hasta que tengas permisos de publicación',
    });

  } catch (error) {
    console.error('Error creando post simulado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
