import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json({ error: 'OrganizationId es requerido' }, { status: 400 });
    }

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

    // Construir filtros
    const where: any = {
      organizationId,
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtener notificaciones
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        organization: true,
      },
    });

    // Obtener total de notificaciones para paginación
    const total = await prisma.notification.count({ where });

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { organizationId, type, title, message, category, metadata, actionUrl } = await request.json();

    if (!organizationId || !type || !title || !message || !category) {
      return NextResponse.json({ 
        error: 'OrganizationId, type, title, message y category son requeridos' 
      }, { status: 400 });
    }

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

    // Crear notificación
    const notification = await prisma.notification.create({
      data: {
        organizationId,
        type,
        title,
        message,
        category,
        metadata: metadata || {},
        actionUrl,
        isRead: false,
      },
      include: {
        organization: true,
      },
    });

    // Aquí podrías implementar lógica para enviar notificaciones por email/push
    // según las preferencias del usuario
    await sendNotificationToUsers(notification, organizationId);

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error('Error creando notificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para enviar notificaciones a usuarios según sus preferencias
async function sendNotificationToUsers(notification: any, organizationId: string) {
  try {
    // Obtener miembros de la organización con sus preferencias
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          include: {
            notificationPreferences: {
              where: { organizationId }
            }
          }
        }
      }
    });

    for (const member of members) {
      const preferences = member.user.notificationPreferences[0];
      
      if (preferences) {
        // Enviar por email si está habilitado
        if (preferences.email && preferences.categories[notification.category as keyof typeof preferences.categories]) {
          await sendEmailNotification(member.user, notification);
        }

        // Enviar push si está habilitado
        if (preferences.push && preferences.categories[notification.category as keyof typeof preferences.categories]) {
          await sendPushNotification(member.user, notification);
        }
      }
    }
  } catch (error) {
    console.error('Error enviando notificaciones a usuarios:', error);
  }
}

// Función para enviar notificación por email
async function sendEmailNotification(user: any, notification: any) {
  // Implementar envío de email usando nodemailer o servicio similar
  console.log(`Enviando email a ${user.email}: ${notification.title}`);
}

// Función para enviar notificación push
async function sendPushNotification(user: any, notification: any) {
  // Implementar notificaciones push usando service workers o servicio externo
  console.log(`Enviando push a ${user.id}: ${notification.title}`);
}
