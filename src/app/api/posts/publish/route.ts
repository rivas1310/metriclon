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

    const { organizationId, channelId, content, type = 'TEXT', scheduledFor = null } = await request.json();

    console.log('=== INICIO DE PUBLICACIÓN ===');
    console.log('Organization ID:', organizationId);
    console.log('Channel ID:', channelId);
    console.log('Content:', content);
    console.log('Type:', type);
    console.log('Scheduled For:', scheduledFor);

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

    // Obtener el canal y verificar permisos
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

    console.log('=== CANAL ENCONTRADO ===');
    console.log('Platform:', channel.platform);
    console.log('Name:', channel.name);
    console.log('Is Active:', channel.isActive);

    if (channel.platform !== 'FACEBOOK') {
      return NextResponse.json({ error: 'Solo se soporta Facebook por ahora' }, { status: 400 });
    }

    // Verificar que tenemos permisos de publicación
    const meta = channel.meta as any;
    const permissions = meta?.permissions || [];
    console.log('=== PERMISOS DEL CANAL ===');
    console.log('Permisos:', permissions);
    console.log('Meta completa:', JSON.stringify(channel.meta, null, 2));
    
    if (!permissions.includes('pages_manage_posts')) {
      return NextResponse.json({ 
        error: 'No tienes permisos para publicar en Facebook',
        note: 'Necesitas solicitar permisos de pages_manage_posts en Meta App Review',
        debug: {
          permissions: permissions,
          hasPagesManagePosts: permissions.includes('pages_manage_posts'),
          channelMeta: channel.meta
        }
      }, { status: 403 });
    }

    // Obtener la primera página disponible para publicar
    const pages = meta?.pages || [];
    if (pages.length === 0) {
      return NextResponse.json({ error: 'No hay páginas disponibles para publicar' }, { status: 400 });
    }

    const page = pages[0]; // Usar la primera página
    console.log('=== PÁGINA SELECCIONADA ===');
    console.log('Page Name:', page.name);
    console.log('Page ID:', page.id);
    console.log('Access Token presente:', !!page.access_token);
    console.log('Access Token (primeros 20 chars):', page.access_token ? page.access_token.substring(0, 20) + '...' : 'NO HAY');

    // Preparar el mensaje para Facebook
    const message = content;
    const publishData: any = { message };

    console.log('=== DEBUGGING SCHEDULEDFOR ===');
    console.log('scheduledFor recibido:', scheduledFor);
    console.log('Tipo de scheduledFor:', typeof scheduledFor);
    console.log('scheduledFor es null/undefined?', scheduledFor === null || scheduledFor === undefined);
    console.log('scheduledFor es string vacío?', scheduledFor === '');

    // Si hay fecha programada, usar Facebook's scheduling
    if (scheduledFor && scheduledFor !== '') {
      const scheduledTime = new Date(scheduledFor);
      const now = new Date();
      
      console.log('Fecha programada:', scheduledTime);
      console.log('Fecha actual:', now);
      console.log('¿Es fecha futura?', scheduledTime > now);
      
      if (scheduledTime > now) {
        // Programar para el futuro
        publishData.published = false;
        publishData.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
        console.log('Post programado para:', scheduledTime);
        console.log('scheduled_publish_time:', publishData.scheduled_publish_time);
      } else {
        // Publicar inmediatamente si la fecha ya pasó
        publishData.published = true;
        console.log('Post publicado inmediatamente (fecha pasada)');
      }
    } else {
      // Si no hay fecha, publicar inmediatamente
      publishData.published = true;
      console.log('Post publicado inmediatamente (sin fecha)');
    }

    console.log('=== DATOS FINALES DE PUBLICACIÓN ===');
    console.log('Datos a enviar:', JSON.stringify(publishData, null, 2));

    // Publicar en Facebook usando la Graph API
    const facebookUrl = `https://graph.facebook.com/v18.0/${page.id}/feed`;
    console.log('URL de Facebook:', facebookUrl);
    
    const facebookResponse = await fetch(facebookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...publishData,
        access_token: page.access_token,
      }),
    });

    console.log('=== RESPUESTA DE FACEBOOK ===');
    console.log('Status:', facebookResponse.status);
    console.log('Status Text:', facebookResponse.statusText);
    console.log('Headers:', Object.fromEntries(facebookResponse.headers.entries()));
    
    const responseText = await facebookResponse.text();
    console.log('Response Body:', responseText);
    
    if (!facebookResponse.ok) {
      console.error('❌ ERROR de Facebook API:', responseText);
      console.error('Status Code:', facebookResponse.status);
      
      return NextResponse.json({
        error: 'Error al publicar en Facebook',
        facebookError: responseText,
        statusCode: facebookResponse.status,
        note: 'Verifica que tienes permisos de pages_manage_posts'
      }, { status: 400 });
    }

    let facebookData;
    try {
      facebookData = JSON.parse(responseText);
      console.log('Facebook API response (parsed):', facebookData);
    } catch (parseError) {
      console.error('Error parseando respuesta de Facebook:', parseError);
      return NextResponse.json({
        error: 'Respuesta inválida de Facebook',
        facebookResponse: responseText
      }, { status: 400 });
    }

    // Verificar que realmente se creó el post
    if (!facebookData.id) {
      console.error('❌ Facebook no devolvió ID del post');
      return NextResponse.json({
        error: 'Facebook no devolvió ID del post',
        facebookResponse: facebookData
      }, { status: 400 });
    }

    console.log('✅ Post creado en Facebook con ID:', facebookData.id);

    // Crear el post en nuestra base de datos
    const post = await prisma.post.create({
      data: {
        organizationId,
        channelId,
        caption: content,
        type,
        status: scheduledFor && new Date(scheduledFor) > new Date() ? 'SCHEDULED' : 'PUBLISHED',
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        publishedAt: scheduledFor && new Date(scheduledFor) > new Date() ? null : new Date(),
        externalPostId: facebookData.id,
        createdBy: decoded.userId,
        meta: {
          facebookPostId: facebookData.id,
          pageId: page.id,
          pageName: page.name,
          isRealPost: true,
          platform: 'FACEBOOK',
          channelName: channel.name,
          publishData: publishData,
          facebookResponse: facebookData
        },
      },
    });

    console.log('✅ Post guardado en base de datos:', post.id);

    return NextResponse.json({
      success: true,
      post,
      facebookData,
      message: scheduledFor && new Date(scheduledFor) > new Date() 
        ? 'Post programado exitosamente en Facebook' 
        : 'Post publicado exitosamente en Facebook',
    });

  } catch (error) {
    console.error('❌ Error publicando post:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
