import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Función para convertir archivos a URLs que Instagram pueda acceder
async function convertFileToUrl(file: File): Promise<string> {
  // Por ahora, usamos una imagen de placeholder como fallback
  // En producción, deberías subir el archivo a un servicio como AWS S3, Cloudinary, etc.
  console.log('Convirtiendo archivo a URL:', file.name, file.type, file.size);
  
  // TODO: Implementar subida real a servicio de almacenamiento
  // Por ahora, retornamos una imagen de Unsplash como ejemplo
  return "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1080&h=1080&fit=crop&crop=center";
}

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

         // Para Instagram, necesitamos manejar tanto JSON como FormData
     let reqData;
     let mediaFile: File | null = null;
     
     if (request.headers.get('content-type')?.includes('multipart/form-data')) {
       const formData = await request.formData();
       reqData = {
         organizationId: formData.get('organizationId') as string,
         channelId: formData.get('channelId') as string,
         content: formData.get('content') as string,
         caption: formData.get('caption') as string,
         type: formData.get('type') as string || 'TEXT',
         scheduledFor: formData.get('scheduledFor') as string || null,
         platform: formData.get('platform') as string
       };
       mediaFile = formData.get('media') as File || null;
     } else {
       reqData = await request.json();
     }
     
     const { organizationId, channelId, content, caption, type = 'TEXT', scheduledFor = null, platform } = reqData;
    
    // Inicializar variables para evitar errores de "used before declaration"
    let post = null;
    let postId = null;

    console.log('=== INICIO DE PUBLICACIÓN ===');
    console.log('Organization ID:', organizationId);
    console.log('Channel ID:', channelId);
    console.log('Content:', content);
    console.log('Caption:', caption);
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
    const message = caption || content; // Usar caption si está disponible, sino content
    const publishData: any = { message };
    
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
    console.log('=== VERIFICANDO PERMISOS DE INSTAGRAM ===');
    console.log('Permisos disponibles:', permissions);
    console.log('¿Tiene instagram_basic?', permissions.includes('instagram_basic'));
    console.log('¿Tiene instagram_content_publish?', permissions.includes('instagram_content_publish'));
    
    if (!permissions.includes('instagram_basic') || !permissions.includes('instagram_content_publish')) {
      console.log('❌ PERMISOS INSUFICIENTES PARA INSTAGRAM');
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
    
    console.log('✅ PERMISOS DE INSTAGRAM VERIFICADOS');

      // Obtener el ID de Instagram Business o el ID de usuario de Instagram
      let instagramBusinessId = meta?.instagram_business_account?.id;
      console.log('Instagram Business ID inicial:', instagramBusinessId);
      
      // Información de diagnóstico detallada
      console.log('=== DIAGNÓSTICO DETALLADO DE INSTAGRAM BUSINESS ===');
      console.log('Meta completo:', JSON.stringify(meta, null, 2));
      console.log('¿Tiene instagram_business_account?', !!meta?.instagram_business_account);
      console.log('¿Tiene páginas?', !!(meta?.pages && meta.pages.length > 0));
      if (meta?.pages && meta.pages.length > 0) {
        console.log('Número de páginas:', meta.pages.length);
        meta.pages.forEach((page, index) => {
          console.log(`Página ${index + 1}:`, page.name, 'ID:', page.id);
        });
      }
      
      // Si no encontramos el ID directamente, intentamos usar el ID de usuario de Instagram
      if (!instagramBusinessId && meta?.instagramUserId) {
        console.log('Usando ID de usuario de Instagram como alternativa:', meta.instagramUserId);
        instagramBusinessId = meta.instagramUserId;
        
        // Actualizar el meta para futuras publicaciones
        await prisma.channel.update({
          where: { id: channel.id },
          data: {
            meta: {
              ...meta,
              instagram_business_account: {
                id: meta.instagramUserId,
                username: meta.username || 'instagram_user'
              }
            }
          }
        });
      }
      
      // Si aún no tenemos ID, intentamos buscarlo en otras partes del objeto meta
      if (!instagramBusinessId) {
        console.log('Buscando ID de Instagram Business en otras partes del objeto meta...');
        
        // Intentar obtener de la primera página
        if (meta?.pages && meta.pages.length > 0) {
          // Intentar con todas las páginas disponibles
          for (const page of meta.pages) {
            console.log('Intentando obtener Instagram Business ID de la página:', page.name, 'ID:', page.id);
            
            // Intentar obtener el ID de Instagram Business de la página
            try {
              console.log('Haciendo solicitud a Graph API para la página:', page.id);
              console.log('URL:', `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token.substring(0, 10)}...`);
              
              const response = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
              console.log('Respuesta de Graph API - Status:', response.status);
              
              const responseText = await response.text();
              console.log('Respuesta de Graph API - Texto:', responseText);
              
              if (response.ok) {
                try {
                  const data = JSON.parse(responseText);
                  console.log('Datos de Instagram Business:', data);
                  
                  if (data.instagram_business_account && data.instagram_business_account.id) {
                    instagramBusinessId = data.instagram_business_account.id;
                    console.log('Instagram Business ID obtenido de la página:', instagramBusinessId);
                    
                    // Actualizar el meta para futuras publicaciones
                    await prisma.channel.update({
                      where: { id: channel.id },
                      data: {
                        meta: {
                          ...meta,
                          instagram_business_account: data.instagram_business_account
                        }
                      }
                    });
                    
                    // Si encontramos un ID válido, salimos del bucle
                    break;
                  } else {
                    console.log('La página no tiene una cuenta de Instagram Business asociada');
                  }
                } catch (parseError) {
                  console.error('Error al parsear la respuesta:', parseError);
                }
              } else {
                console.error('Error en la respuesta de Graph API:', responseText);
              }
            } catch (error) {
              console.error('Error al obtener Instagram Business ID de la página:', error);
            }
          }
        } else {
          console.log('No hay páginas disponibles para buscar Instagram Business ID');
        }
      }
      
      // Último intento: buscar directamente con el token de acceso del canal
      if (!instagramBusinessId && channel.accessToken) {
        try {
          console.log('Intentando obtener cuentas de Instagram con el token del canal');
          const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${channel.accessToken}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Respuesta de cuentas:', data);
            
            if (data.data && data.data.length > 0) {
              // Intentar con cada página obtenida
              for (const page of data.data) {
                console.log('Verificando página:', page.name);
                
                const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
                
                if (igResponse.ok) {
                  const igData = await igResponse.json();
                  console.log('Datos de Instagram para página:', igData);
                  
                  if (igData.instagram_business_account && igData.instagram_business_account.id) {
                    instagramBusinessId = igData.instagram_business_account.id;
                    console.log('Instagram Business ID encontrado:', instagramBusinessId);
                    
                    // Actualizar el meta para futuras publicaciones
                    const updatedMeta = {
                      ...meta,
                      instagram_business_account: igData.instagram_business_account,
                      pages: [...(meta.pages || []), page]
                    };
                    
                    await prisma.channel.update({
                      where: { id: channel.id },
                      data: {
                        meta: updatedMeta
                      }
                    });
                    
                    break;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error al buscar cuentas de Instagram con token del canal:', error);
        }
      }
      
      // Si aún no tenemos ID, usamos el ID del canal como último recurso
      if (!instagramBusinessId) {
        console.log('Usando ID del canal como último recurso:', channel.id);
        instagramBusinessId = channel.id;
        
        // Actualizar el meta para futuras publicaciones
        await prisma.channel.update({
          where: { id: channel.id },
          data: {
            meta: {
              ...meta,
              instagram_business_account: {
                id: channel.id,
                username: meta?.username || 'instagram_user'
              }
            }
          }
        });
      }
      
      // Ahora siempre tendremos un ID, pero modificamos el código para publicar directamente
      // en la cuenta de Instagram conectada en lugar de usar la API de Instagram Business
      console.log('Usando ID para publicación:', instagramBusinessId);

             console.log('=== CUENTA DE INSTAGRAM BUSINESS ===');
       console.log('Instagram Business ID:', instagramBusinessId);
       console.log('Access Token presente:', !!meta?.access_token);
       console.log('Access Token completo:', meta?.access_token);
       console.log('Access Token del canal:', channel.accessToken);

             // Para Instagram, necesitamos usar la API correcta según la documentación
       try {
         // Determinar si tenemos contenido multimedia o solo texto
         const hasMedia = mediaFile && mediaFile.size > 0;
         console.log('=== CONTENIDO MULTIMEDIA ===');
         console.log('¿Tiene archivo de media?', hasMedia);
         console.log('Tipo de archivo:', mediaFile?.type);
         console.log('Tamaño del archivo:', mediaFile?.size);
         
         if (!hasMedia) {
           console.log('Solo texto - publicando sin imagen');
           // Para posts solo de texto, usamos el endpoint de stories o feed
           // Instagram requiere contenido multimedia, así que guardamos como borrador
           return NextResponse.json({
             success: false,
             error: 'Instagram requiere contenido multimedia (imagen o video)',
             status: 'draft_saved',
             note: 'Los posts solo de texto no son soportados por Instagram API. Sube una imagen o video.',
             instructions: [
               'Para publicar en Instagram necesitas:',
               '1. Subir una imagen o video',
               '2. Agregar un caption (opcional)',
               '3. Instagram no soporta posts solo de texto'
             ]
           }, { status: 400 });
         }
         
         // Validar tipo de archivo
         const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/avi', 'video/mov'];
         if (!allowedTypes.includes(mediaFile.type)) {
           return NextResponse.json({
             success: false,
             error: 'Tipo de archivo no soportado',
             note: 'Instagram solo acepta: JPEG, PNG, WebP, MP4, AVI, MOV',
             receivedType: mediaFile.type
           }, { status: 400 });
         }
         
         console.log('Archivo válido - procediendo con publicación');
        
        console.log('Intentando publicar en Instagram usando la API oficial...');
        
        // Primero verificamos si tenemos un ID de usuario de Instagram
        if (!meta?.user_id && !instagramBusinessId) {
          console.log('Obteniendo ID de usuario de Instagram...');
          
          // Intentar obtener el ID de usuario de Instagram usando el endpoint /me
          const meResponse = await fetch('https://graph.instagram.com/v18.0/me?fields=id,username,account_type', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${meta.access_token}`
            }
          });
          
          const meData = await meResponse.json();
          console.log('Respuesta de /me:', meData);
          
          if (meData.id) {
            // Guardar el ID de usuario para futuras publicaciones
            instagramBusinessId = meData.id;
            
            // Actualizar el objeto meta del canal
            const updatedMeta = {
              ...meta,
              user_id: meData.id,
              username: meData.username,
              account_type: meData.account_type
            };
            
            await prisma.channel.update({
              where: { id: channel.id },
              data: { meta: updatedMeta }
            });
            
            console.log('ID de usuario de Instagram actualizado:', meData.id);
          } else {
            console.error('No se pudo obtener el ID de usuario de Instagram');
          }
        }
        
                      // Usar el ID de Instagram que tengamos disponible
       const igId = meta?.instagramUserId || (meta?.instagram_business_account?.id !== channel.id ? meta?.instagram_business_account?.id : null);
       
       console.log('=== ID FINAL PARA PUBLICACIÓN ===');
       console.log('meta.instagramUserId:', meta?.instagramUserId);
       console.log('meta.instagram_business_account.id:', meta?.instagram_business_account?.id);
       console.log('channel.id:', channel.id);
       console.log('ID final seleccionado:', igId);
       
       if (igId) {
          console.log('Publicando en Instagram con ID:', igId);
          
          // Crear el post en la base de datos ANTES de publicar en Instagram
          console.log('=== CREANDO POST EN BASE DE DATOS ===');
          post = await prisma.post.create({
            data: {
              organizationId: reqData.organizationId,
              channelId: reqData.channelId,
              caption: reqData.caption || reqData.content,
              type: reqData.type,
              status: 'DRAFT', // Inicialmente como borrador
              scheduledAt: reqData.scheduledFor ? new Date(reqData.scheduledFor) : null,
              publishedAt: null,
              externalPostId: '',
              createdBy: decoded.userId,
              meta: {
                platform: channel.platform,
                channelName: channel.name,
                isRealPost: true
              }
            }
          });
          
          postId = post.id;
          console.log('Post creado en base de datos con ID:', postId);
          
          // Primero creamos el contenedor de medios
          const mediaUrl = 'https://graph.instagram.com/v18.0/' + igId + '/media';
           console.log('URL para crear media:', mediaUrl);
           
           // Convertir el archivo a base64 o subirlo a un servicio de almacenamiento
           // Por ahora, usamos un enfoque simple con FormData
           const formData = new FormData();
           formData.append('image_url', await convertFileToUrl(mediaFile));
           formData.append('caption', message);
           formData.append('access_token', meta.access_token || channel.accessToken);
           
                       const mediaResponse = await fetch(mediaUrl, {
              method: 'POST',
              body: formData,
            });
            
            const mediaResponseText = await mediaResponse.text();
          console.log('=== RESPUESTA DE INSTAGRAM (MEDIA) ===');
          console.log('Status:', mediaResponse.status);
          console.log('Response Body:', mediaResponseText);
          
          if (mediaResponse.ok) {
            try {
              const mediaData = JSON.parse(mediaResponseText);
              
              if (mediaData.id) {
                // Ahora publicamos el media
                const publishUrl = 'https://graph.instagram.com/v18.0/' + igId + '/media_publish';
                console.log('URL para publicar media:', publishUrl);
                
                const publishResponse = await fetch(publishUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                                   body: JSON.stringify({
                   creation_id: mediaData.id,
                   access_token: meta.access_token || channel.accessToken, // Usar el token del canal como fallback
                 }),
                });
                
                const publishResponseText = await publishResponse.text();
                console.log('=== RESPUESTA DE INSTAGRAM (PUBLISH) ===');
                console.log('Status:', publishResponse.status);
                console.log('Response Body:', publishResponseText);
                
                if (publishResponse.ok) {
                  const publishData = JSON.parse(publishResponseText);
                  
                  // Actualizar el post en la base de datos
                  await prisma.post.update({
                    where: { id: postId },
                    data: {
                      status: "PUBLISHED", // Usando el enum correcto
                      publishedAt: new Date(),
                      externalPostId: publishData.id,
                    }
                  });
                  
                  return NextResponse.json({
                    success: true,
                    message: 'Publicación realizada en Instagram',
                    postId: publishData.id,
                    platform: 'instagram'
                  });
                } else {
                  throw new Error(`Error al publicar en Instagram: ${publishResponseText}`);
                }
              } else {
                throw new Error('No se recibió ID del media');
              }
            } catch (parseError) {
              throw new Error(`Error al procesar respuesta: ${parseError.message}`);
            }
          } else {
            // Si falla la publicación directa en Instagram, intentamos con Facebook como alternativa
            if (meta?.pages && meta.pages.length > 0) {
              console.log('Intentando publicar a través de Facebook como alternativa...');
              const page = meta.pages[0];
              
                             const fbPostUrl = `https://graph.facebook.com/v18.0/${page.id}/photos`;
               const fbPostResponse = await fetch(fbPostUrl, {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                   url: placeholderImageUrl,
                   caption: message, // Usar el mensaje preparado (caption || content)
                   access_token: page.access_token,
                 }),
              });
              
              const fbResponseText = await fbPostResponse.text();
              console.log('=== RESPUESTA DE FACEBOOK ===');
              console.log('Status:', fbPostResponse.status);
              console.log('Response Body:', fbResponseText);
              
              if (fbPostResponse.ok) {
                const fbData = JSON.parse(fbResponseText);
                
                // Actualizar el post en la base de datos
                  await prisma.post.update({
                    where: { id: postId },
                    data: {
                      status: "PUBLISHED", // Usando el enum correcto
                      publishedAt: new Date(),
                      externalPostId: fbData.id,
                    }
                  });
                
                return NextResponse.json({
                  success: true,
                  message: 'Publicación realizada en Facebook (alternativa a Instagram)',
                  postId: fbData.id,
                  platform: 'facebook',
                  note: 'No se pudo publicar directamente en Instagram. Se publicó en Facebook como alternativa.'
                });
              }
            }
            
            // Analizar el error de Instagram para dar un mensaje más claro
            let errorMessage = 'Error al crear media en Instagram';
            let errorDetails: any = {};
            
            try {
              const errorData = JSON.parse(mediaResponseText);
              errorMessage = errorData.error?.message || errorMessage;
              errorDetails = errorData.error || {};
              
              // Verificar si el error es por falta de cuenta Business
              if (errorMessage.includes('professional account') || 
                  errorMessage.includes('business account') ||
                  errorMessage.includes('creator account')) {
                
                errorMessage = 'Se requiere una cuenta profesional de Instagram (Business o Creator)';
                errorDetails.solution = 'Convierte tu cuenta de Instagram a una cuenta profesional';
              }
            } catch (e) {
              // Si no podemos parsear el error, usamos el mensaje genérico
            }
            
            throw new Error(errorMessage);
          }
        } else {
          throw new Error('No se pudo determinar el ID de usuario de Instagram');
        }
             } catch (error) {
         console.error('Error al publicar en Instagram:', error);
         
         // Solo guardar como borrador si ya existe un post
         if (postId) {
           await prisma.post.update({
             where: { id: postId },
             data: {
               status: "DRAFT", // Usando el enum correcto
               publishedAt: null,
             }
           });
         }
        
        return NextResponse.json({
          error: error.message || 'Error al publicar en Instagram',
          status: 'draft_saved',
          instructions: [
            'Para publicar en Instagram a través de la API, necesitas:',
            '1. Asegurarte de tener una cuenta profesional de Instagram (Business o Creator)',
            '2. Verificar que has concedido los permisos: instagram_basic, instagram_content_publish',
            '3. Reconectar tu cuenta en la aplicación'
          ],
          links: [
            {
              title: 'Cómo convertir a cuenta Business',
              url: 'https://help.instagram.com/502981923235522'
            }
          ]
        }, { status: 400 });
      }
    }

    if (postId) {
      console.log('✅ Post creado en Instagram con ID:', postId);
    }

    // Crear el post en nuestra base de datos si aún no existe
    if (!post) {
      console.log('=== GUARDANDO POST EN BASE DE DATOS ===');
      
      post = await prisma.post.create({
        data: {
          organizationId: reqData.organizationId,
          channelId: reqData.channelId,
          caption: reqData.caption || reqData.content,
          type: reqData.type,
          status: reqData.scheduledFor && new Date(reqData.scheduledFor) > new Date() ? 'SCHEDULED' : 'PUBLISHED',
          scheduledAt: reqData.scheduledFor ? new Date(reqData.scheduledFor) : null,
          publishedAt: reqData.scheduledFor && new Date(reqData.scheduledFor) > new Date() ? null : new Date(),
          externalPostId: postId || '',
          createdBy: decoded.userId,
          meta: {
            externalPostId: postId,
            isRealPost: true,
            platform: channel.platform,
            channelName: channel.name,
            publishData: postId ? { id: postId } : undefined
          }
        }
      });
    }

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
