import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Token de verificación para Facebook (debería estar en variables de entorno)
const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'garras_felinas_webhook_2024';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Verificación del webhook de Facebook
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('🔐 Facebook Webhook Verification:', { mode, token, challenge });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Facebook Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('❌ Facebook Webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📨 Facebook Webhook received:', JSON.stringify(body, null, 2));

    // Verificar que es un webhook válido de Facebook
    if (body.object === 'page') {
      console.log('✅ Valid Facebook page webhook received');
      
      // Procesar cada entrada del webhook
      for (const entry of body.entry) {
        const pageId = entry.id;
        console.log(`📊 Processing webhook for page: ${pageId}`);

        // Procesar cambios de página
        if (entry.changes) {
          for (const change of entry.changes) {
            console.log(`🔄 Page change detected:`, change);
            await processPageChange(pageId, change);
          }
        }

        // Procesar mensajes y engagement
        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            console.log(`💬 Messaging event:`, messaging);
            await processMessagingEvent(pageId, messaging);
          }
        }

        // Procesar posts y engagement
        if (entry.posts) {
          for (const post of entry.posts) {
            console.log(`📝 Post event:`, post);
            await processPostEvent(pageId, post);
          }
        }
      }

      return new NextResponse('OK', { status: 200 });
    }

    console.log('⚠️ Invalid webhook object type:', body.object);
    return new NextResponse('Invalid webhook', { status: 400 });

  } catch (error) {
    console.error('❌ Error processing Facebook webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function processPageChange(pageId: string, change: any) {
  try {
    console.log(`🔄 Processing page change for ${pageId}:`, change.field, change.value);
    
    // Aquí puedes implementar lógica específica para cada tipo de cambio
    switch (change.field) {
      case 'feed':
        console.log('📰 Feed updated');
        break;
      case 'insights':
        console.log('📊 Insights updated');
        break;
      case 'engagement':
        console.log('❤️ Engagement updated');
        break;
      default:
        console.log(`📝 Unknown field change: ${change.field}`);
    }
  } catch (error) {
    console.error('❌ Error processing page change:', error);
  }
}

async function processMessagingEvent(pageId: string, messaging: any) {
  try {
    console.log(`💬 Processing messaging for page ${pageId}:`, messaging.sender?.id);
    
    // Procesar diferentes tipos de mensajes
    if (messaging.message) {
      console.log('📨 Message received:', messaging.message.text);
    }
    
    if (messaging.postback) {
      console.log('🔘 Postback received:', messaging.postback.payload);
    }
  } catch (error) {
    console.error('❌ Error processing messaging event:', error);
  }
}

async function processPostEvent(pageId: string, post: any) {
  try {
    console.log(`📝 Processing post for page ${pageId}:`, post.id);
    
    // Aquí puedes implementar lógica para procesar posts
    // Por ejemplo, actualizar métricas en tu base de datos
    console.log('📊 Post data:', {
      id: post.id,
      message: post.message,
      created_time: post.created_time,
      type: post.type
    });
  } catch (error) {
    console.error('❌ Error processing post event:', error);
  }
}
