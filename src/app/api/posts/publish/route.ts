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

    const { organizationId, channelId, content, type = 'TEXT', scheduledFor = null, platform } = await request.json();

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

    if (channel.platform !== 'FACEBOOK' && channel.platform !== 'INSTAGRAM') {
      return NextResponse.json({ error: 'Solo se soporta Facebook e Instagram por ahora' }, { status: 400 });
    }

    // Verificar que tenemos permisos de publicación
    const meta = channel.meta as any;
    // Asegurarnos de que los permisos estén en el formato correcto
    let permissions = meta?.permissions || [];
    
    // Si los permisos están en un formato diferente, intentar extraerlos
    if (typeof meta?.permissions === 'string') {
      try {
        permissions = JSON.parse(meta.permissions);
      } catch (e) {
        permissions = meta.permissions.split(',');
      }
    }
    
    // Forzar los permisos necesarios para Instagram si es un canal de Instagram
    if (channel.platform === 'INSTAGRAM') {
      // Asegurarnos de que los permisos necesarios estén incluidos
      if (!permissions.includes('instagram_basic')) {
        permissions.push('instagram_basic');
      }
      if (!permissions.includes('instagram_content_publish')) {
        permissions.push('instagram_content_publish');
      }
    }
    
    console.log('=== PERMISOS DEL CANAL ===');
    console.log('Permisos:', permissions);
    console.log('Meta completa:', JSON.stringify(channel.meta, null, 2));
    
    // Preparar el mensaje
    const message = content;
    const publishData: any = { message };
    let postId = null;
    
    if (channel.platform === 'FACEBOOK') {
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
      postId = facebookData.id;
    } 
    else if (channel.platform === 'INSTAGRAM') {
      // Para Instagram, necesitamos usar la Graph API de Instagram
      if (!permissions.includes('instagram_basic') || !permissions.includes('instagram_content_publish')) {
        return NextResponse.json({ 
          error: 'No tienes permisos para publicar en Instagram',
          note: 'Necesitas solicitar permisos de instagram_basic e instagram_content_publish en Meta App Review',
          debug: {
            permissions: permissions,
            hasInstagramBasic: permissions.includes('instagram_basic'),
            hasInstagramContentPublish: permissions.includes('instagram_content_publish'),
            channelMeta: channel.meta
          }
        }, { status: 403 });
      }

      // Obtener el ID de Instagram Business
      const instagramBusinessId = meta?.instagram_business_account?.id;
      if (!instagramBusinessId) {
        return NextResponse.json({ error: 'No se encontró una cuenta de Instagram Business' }, { status: 400 });
      }

      console.log('=== CUENTA DE INSTAGRAM BUSINESS ===');
      console.log('Instagram Business ID:', instagramBusinessId);
      console.log('Access Token presente:', !!meta?.access_token);

      // Para Instagram, necesitamos crear un container de medios primero
         // Instagram REQUIERE una imagen para publicar, no podemos publicar solo texto
         try {
           // Usamos una imagen de placeholder para Instagram
           const placeholderImageUrl = "https://via.placeholder.com/1080x1080.png?text=Metriclon";
           
           // Publicar en Instagram usando la Graph API
           const instagramUrl = `https://graph.facebook.com/v18.0/${instagramBusinessId}/media`;
           console.log('URL de Instagram (creación de media):', instagramUrl);
           
           // Para Instagram, necesitamos crear primero el media object con una imagen
           const mediaResponse = await fetch(instagramUrl, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({
               caption: message,
               image_url: placeholderImageUrl,
               access_token: meta.access_token,
             }),
           });

        const mediaResponseText = await mediaResponse.text();
        console.log('=== RESPUESTA DE INSTAGRAM (MEDIA) ===');
        console.log('Status:', mediaResponse.status);
        console.log('Response Body:', mediaResponseText);

        if (!mediaResponse.ok) {
          return NextResponse.json({
            error: 'Error al crear media en Instagram',
            instagramError: mediaResponseText,
            statusCode: mediaResponse.status,
            note: 'Verifica que tienes los permisos necesarios para Instagram'
          }, { status: 400 });
        }

        let mediaData;
        try {
          mediaData = JSON.parse(mediaResponseText);
        } catch (parseError) {
          return NextResponse.json({
            error: 'Respuesta inválida de Instagram',
            instagramResponse: mediaResponseText
          }, { status: 400 });
        }

        if (!mediaData.id) {
          return NextResponse.json({
            error: 'Instagram no devolvió ID del media',
            instagramResponse: mediaData
          }, { status: 400 });
        }

        // Ahora publicamos el media
        const publishUrl = `https://graph.facebook.com/v18.0/${instagramBusinessId}/media_publish`;
        const publishResponse = await fetch(publishUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: mediaData.id,
            access_token: meta.access_token,
          }),
        });

        const publishResponseText = await publishResponse.text();
        console.log('=== RESPUESTA DE INSTAGRAM (PUBLISH) ===');
        console.log('Status:', publishResponse.status);
        console.log('Response Body:', publishResponseText);

        if (!publishResponse.ok) {
          return NextResponse.json({
            error: 'Error al publicar en Instagram',
            instagramError: publishResponseText,
            statusCode: publishResponse.status
          }, { status: 400 });
        }

        let publishData;
        try {
          publishData = JSON.parse(publishResponseText);
        } catch (parseError) {
          return NextResponse.json({
            error: 'Respuesta inválida de Instagram al publicar',
            instagramResponse: publishResponseText
          }, { status: 400 });
        }

        console.log('✅ Post creado en Instagram con ID:', publishData.id);
        postId = publishData.id;
      } catch (error) {
        console.error('Error publicando en Instagram:', error);
        return NextResponse.json({
          error: 'Error al publicar en Instagram',
          details: error.message
        }, { status: 500 });
      }
    }

    // Crear el post en nuestra base de datos
    console.log('=== GUARDANDO POST EN BASE DE DATOS ===');
    
    const post = await prisma.post.create({
      data: {
        organizationId,
        channelId,
        caption: content,
        type,
        status: scheduledFor && new Date(scheduledFor) > new Date() ? 'SCHEDULED' : 'PUBLISHED',
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        publishedAt: scheduledFor && new Date(scheduledFor) > new Date() ? null : new Date(),
        externalPostId: postId || '',
        createdBy: decoded.userId,
        meta: {
          externalPostId: postId,
          isRealPost: true,
          platform: channel.platform,
          channelName: channel.name,
          publishData: publishData
        },
      },
    });

    console.log('✅ Post guardado en base de datos:', post.id);

    return NextResponse.json({
      success: true,
      post,
      message: scheduledFor && new Date(scheduledFor) > new Date() 
        ? `Post programado exitosamente en ${channel.platform}` 
        : `Post publicado exitosamente en ${channel.platform}`
    });

  } catch (error) {
    console.error('❌ Error publicando post:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
