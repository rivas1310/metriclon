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

    // Obtener preferencias del usuario para esta organización
    let preferences = await prisma.notificationPreferences.findFirst({
      where: {
        userId: decoded.userId,
        organizationId,
      },
    });

    // Si no existen preferencias, crear las predeterminadas
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: decoded.userId,
          organizationId,
          email: true,
          push: true,
          categories: {
            posts: true,
            metrics: true,
            channels: true,
            system: true,
            engagement: true,
          },
          frequency: 'realtime',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        },
      });
    }

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Error obteniendo preferencias de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { organizationId, email, push, categories, frequency, quietHours } = await request.json();

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

    // Actualizar o crear preferencias
    const preferences = await prisma.notificationPreferences.upsert({
      where: {
        userId_organizationId: {
          userId: decoded.userId,
          organizationId,
        },
      },
      update: {
        email: email !== undefined ? email : undefined,
        push: push !== undefined ? push : undefined,
        categories: categories || undefined,
        frequency: frequency || undefined,
        quietHours: quietHours || undefined,
      },
      create: {
        userId: decoded.userId,
        organizationId,
        email: email !== undefined ? email : true,
        push: push !== undefined ? push : true,
        categories: categories || {
          posts: true,
          metrics: true,
          channels: true,
          system: true,
          engagement: true,
        },
        frequency: frequency || 'realtime',
        quietHours: quietHours || {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      },
    });

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Error actualizando preferencias de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
