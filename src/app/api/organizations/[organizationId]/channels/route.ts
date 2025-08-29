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

    // Obtener todos los canales de la organización
    const channels = await prisma.channel.findMany({
      where: { organizationId },
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(channels);

  } catch (error) {
    console.error('Error obteniendo canales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { platform, externalId, name, accessToken, meta } = await request.json();

    if (!platform || !externalId || !name || !accessToken) {
      return NextResponse.json({ 
        error: 'Platform, externalId, name y accessToken son requeridos' 
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

    // Crear o actualizar el canal
    const channel = await prisma.channel.upsert({
      where: {
        organizationId_platform_externalId: {
          organizationId,
          platform: platform.toUpperCase(),
          externalId,
        },
      },
      update: {
        name,
        accessToken,
        meta: meta || {},
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        platform: platform.toUpperCase(),
        externalId,
        name,
        accessToken,
        meta: meta || {},
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    return NextResponse.json(channel, { status: 201 });

  } catch (error) {
    console.error('Error creando/actualizando canal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
