import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { FacebookWebhookService } from '@/lib/webhookService';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, channelId, callbackUrl, verifyToken } = body;

    if (!organizationId || !channelId || !callbackUrl || !verifyToken) {
      return NextResponse.json({ 
        error: 'Faltan parámetros requeridos' 
      }, { status: 400 });
    }

    // Verificar que el usuario pertenece a la organización
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: organizationId
      }
    });

    if (!membership) {
      return NextResponse.json({ 
        error: 'No tienes acceso a esta organización' 
      }, { status: 403 });
    }

    // Obtener el canal
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        organizationId: organizationId,
        platform: 'FACEBOOK'
      }
    });

    if (!channel) {
      return NextResponse.json({ 
        error: 'Canal de Facebook no encontrado' 
      }, { status: 404 });
    }

    console.log(`🔗 Configurando webhook para canal ${channelId}...`);

    // Configurar webhook usando el servicio
    const result = await FacebookWebhookService.setupWebhookForChannel(
      channel,
      callbackUrl,
      verifyToken
    );

    if (result.success) {
      console.log(`✅ Webhook configurado exitosamente para ${result.pagesSubscribed} páginas`);
      
      // Actualizar el canal con información del webhook
      await prisma.channel.update({
        where: { id: channelId },
        data: {
          metadata: {
            ...channel.metadata,
            webhookConfigured: true,
            webhookCallbackUrl: callbackUrl,
            webhookConfiguredAt: new Date().toISOString(),
            pagesSubscribed: result.pagesSubscribed
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Webhook configurado para ${result.pagesSubscribed} páginas`,
        data: result
      });
    } else {
      console.log(`❌ Error configurando webhook:`, result.errors);
      
      return NextResponse.json({
        success: false,
        message: 'Error configurando webhook',
        errors: result.errors
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error en setup de webhook:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const channelId = searchParams.get('channelId');

    if (!organizationId || !channelId) {
      return NextResponse.json({ 
        error: 'Faltan parámetros requeridos' 
      }, { status: 400 });
    }

    // Verificar que el usuario pertenece a la organización
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: organizationId
      }
    });

    if (!membership) {
      return NextResponse.json({ 
        error: 'No tienes acceso a esta organización' 
      }, { status: 403 });
    }

    // Obtener el canal
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        organizationId: organizationId,
        platform: 'FACEBOOK'
      }
    });

    if (!channel) {
      return NextResponse.json({ 
        error: 'Canal de Facebook no encontrado' 
      }, { status: 404 });
    }

    // Obtener páginas administradas
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,followers_count&access_token=${channel.accessToken}`
    );

    if (!pagesResponse.ok) {
      return NextResponse.json({
        success: false,
        message: 'No se pudieron obtener las páginas administradas'
      }, { status: 500 });
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    // Verificar estado de webhook para cada página
    const pagesWithWebhookStatus = await Promise.all(
      pages.map(async (page: any) => {
        const webhookStatus = await FacebookWebhookService.verifyWebhookStatus(
          page.id,
          page.access_token || channel.accessToken
        );

        return {
          ...page,
          webhookStatus
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        channel: {
          id: channel.id,
          name: channel.name,
          platform: channel.platform,
          webhookConfigured: channel.metadata?.webhookConfigured || false,
          webhookCallbackUrl: channel.metadata?.webhookCallbackUrl
        },
        pages: pagesWithWebhookStatus
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de webhook:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
