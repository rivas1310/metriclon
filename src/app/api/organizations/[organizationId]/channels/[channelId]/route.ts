import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; channelId: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { organizationId, channelId } = params;

    // Verificar que el usuario sea miembro de la organización
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: decoded.userId, organizationId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar que el canal pertenezca a la organización
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, organizationId },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 });
    }

    // Eliminar el canal
    await prisma.channel.delete({
      where: { id: channelId },
    });

    return NextResponse.json({ message: 'Canal eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando canal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
