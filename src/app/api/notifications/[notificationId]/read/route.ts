import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
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

    const { notificationId } = params;

    // Obtener la notificación y verificar que pertenece a una organización del usuario
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        organization: {
          members: {
            some: {
              userId: decoded.userId,
            },
          },
        },
      },
      include: {
        organization: true,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    // Marcar como leída
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
      include: {
        organization: true,
      },
    });

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
