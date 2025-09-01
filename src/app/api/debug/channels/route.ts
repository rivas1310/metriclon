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

    // Obtener TODOS los canales (incluso inactivos) para debug
    const allChannels = await prisma.channel.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        platform: true,
        externalId: true,
        name: true,
        isActive: true,
        accessToken: true,
        tokenExpiresAt: true,
        meta: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener canales activos de Facebook e Instagram
    const activeChannels = await prisma.channel.findMany({
      where: {
        organizationId,
        isActive: true,
        platform: {
          in: ['FACEBOOK', 'INSTAGRAM']
        }
      },
    });

    // Información de debug
    const debugInfo = {
      organizationId,
      userId: decoded.userId,
      totalChannels: allChannels.length,
      activeChannels: activeChannels.length,
      channels: allChannels.map(channel => ({
        id: channel.id,
        platform: channel.platform,
        name: channel.name,
        isActive: channel.isActive,
        hasAccessToken: !!channel.accessToken,
        accessTokenLength: channel.accessToken?.length || 0,
        tokenExpired: channel.tokenExpiresAt ? new Date(channel.tokenExpiresAt) < new Date() : 'No expiration set',
        createdAt: channel.createdAt,
        meta: channel.meta,
      })),
      activeChannelPlatforms: activeChannels.map(c => c.platform),
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Error en debug de canales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

