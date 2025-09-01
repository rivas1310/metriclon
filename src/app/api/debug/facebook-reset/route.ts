import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Reseteando canal de Facebook...');

    // Buscar el canal de Facebook
    const channel = await prisma.channel.findFirst({
      where: {
        platform: 'FACEBOOK'
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'No se encontró ningún canal de Facebook' }, { status: 404 });
    }

    // Limpiar el token y marcar como desconectado
    const updatedChannel = await prisma.channel.update({
      where: { id: channel.id },
      data: {
        accessToken: '', // Token vacío
        name: channel.name, // Mantener el nombre
        updatedAt: new Date()
      }
    });

    console.log(`✅ Canal ${channel.id} reseteado exitosamente`);

    return NextResponse.json({
      success: true,
      message: 'Canal de Facebook reseteado. Ahora puedes reconectarlo.',
      channel: {
        id: updatedChannel.id,
        name: updatedChannel.name,
        platform: updatedChannel.platform,
        status: 'Disconnected - Ready for reconnection'
      },
      nextSteps: [
        '1. Ve a la página de conexión de canales',
        '2. Busca el canal "Garras Felinas"',
        '3. Haz clic en "Conectar" o "Reconectar"',
        '4. Inicia sesión con tu cuenta de Facebook',
        '5. Acepta todos los permisos necesarios',
        '6. Confirma la conexión'
      ]
    });

  } catch (error) {
    console.error('❌ Error al resetear canal:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
