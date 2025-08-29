import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Debug logging
    console.log('Facebook OAuth Callback - Parámetros recibidos:');
    console.log('URL completa:', request.url);
    console.log('Code:', code);
    console.log('State:', state);
    console.log('Error:', error);
    console.log('Todos los parámetros:', Object.fromEntries(searchParams.entries()));

    if (error) {
      console.error('Error en OAuth de Facebook:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=oauth_failed&platform=facebook`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_oauth_response&platform=facebook`);
    }

    // Decodificar state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (error) {
      console.error('Error decodificando state:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_state&platform=facebook`);
    }

    const { userId, organizationId, platform, timestamp } = stateData;

    // Verificar que el state no sea muy antiguo (5 minutos)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=expired_state&platform=facebook`);
    }

    // Intercambiar código por token de acceso
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/facebook`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Error obteniendo token de Facebook:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=token_exchange_failed&platform=facebook`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    // Obtener información del usuario de Facebook (solo public_profile disponible temporalmente)
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${access_token}&fields=id,name`);
    if (!userResponse.ok) {
      console.error('Error obteniendo información del usuario de Facebook:', await userResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=user_info_failed&platform=facebook`);
    }

    const userData = await userResponse.json();

    // Con permisos completos podemos obtener información básica, listar páginas y publicar posts
    // NOTA: Ahora tenemos:
    // - public_profile: Información básica del usuario
    // - pages_show_list: Listar páginas del usuario
    // - pages_manage_posts: Publicar posts en páginas
    // - pages_read_engagement: Obtener métricas completas
    
    // Intentar obtener las páginas del usuario con permisos de publicación
    let pages = [];
    try {
      console.log('Facebook OAuth - Intentando obtener páginas con token:', access_token ? 'PRESENTE' : 'AUSENTE');
      
      const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,category,category_list,tasks`;
      console.log('Facebook OAuth - URL para obtener páginas:', pagesUrl);
      
      const pagesResponse = await fetch(pagesUrl);
      console.log('Facebook OAuth - Status de respuesta páginas:', pagesResponse.status);
      console.log('Facebook OAuth - Headers de respuesta páginas:', Object.fromEntries(pagesResponse.headers.entries()));
      
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        console.log('Facebook OAuth - Respuesta completa de páginas:', JSON.stringify(pagesData, null, 2));
        
        pages = pagesData.data || [];
        console.log('Facebook OAuth - Páginas obtenidas:', pages.length);
        
        // Verificar permisos de cada página
        for (const page of pages) {
          console.log(`Página: ${page.name} (${page.id})`);
          console.log(`- Categoría: ${page.category}`);
          console.log(`- Tareas disponibles: ${page.tasks?.join(', ')}`);
          console.log(`- Access token presente: ${!!page.access_token}`);
        }
      } else {
        const errorText = await pagesResponse.text();
        console.log('Facebook OAuth - Error obteniendo páginas:', errorText);
        console.log('Facebook OAuth - Status:', pagesResponse.status);
      }
    } catch (error) {
      console.log('Facebook OAuth - Error obteniendo páginas:', error.message);
      console.log('Facebook OAuth - Error completo:', error);
    }
    
    // Obtener permisos reales del token
    let realPermissions = ['public_profile']; // Siempre disponible
    
    try {
      const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${access_token}`);
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        const grantedPermissions = permissionsData.data || [];
        realPermissions = grantedPermissions
          .filter((p: any) => p.status === 'granted')
          .map((p: any) => p.permission);
        
        console.log('Facebook OAuth - Permisos reales obtenidos:', realPermissions);
      }
    } catch (error) {
      console.log('Facebook OAuth - Error obteniendo permisos reales:', error.message);
    }
    
    console.log('Facebook OAuth - Datos para Prisma upsert:');
    console.log('- organizationId:', organizationId);
    console.log('- platform: FACEBOOK');
    console.log('- externalId:', userData.id);
    console.log('- accessToken:', access_token ? 'PRESENTE' : 'AUSENTE');
    console.log('- expires_in:', expires_in);
    console.log('- pages count:', pages.length);
    console.log('- Permisos reales:', realPermissions);

    // Crear o actualizar canal en la base de datos
    const channel = await prisma.channel.upsert({
      where: {
        organizationId_platform_externalId: {
          organizationId,
          platform: 'FACEBOOK',
          externalId: userData.id,
        },
      },
                             update: {
          accessToken: access_token,
          refreshToken: null, // Facebook no usa refresh tokens
          tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
          isActive: true,
          updatedAt: new Date(),
          meta: {
            userId: userData.id,
            userName: userData.name,
            userEmail: null, // No disponible con public_profile
            pages: pages,
            permissions: realPermissions,
            note: `Permisos reales: ${realPermissions.join(', ')}`
          },
        },
                       create: {
          organizationId,
          platform: 'FACEBOOK',
          externalId: userData.id,
          name: userData.name || 'Facebook',
          accessToken: access_token,
          refreshToken: null,
          tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
          isActive: true,
                     meta: {
            userId: userData.id,
            userName: userData.name,
            userEmail: null, // No disponible con public_profile
            pages: pages,
            permissions: realPermissions,
            note: `Permisos reales: ${realPermissions.join(', ')}`
          },
         },
    });

    // Crear notificación de conexión exitosa
    try {
      await NotificationService.channelConnected(
        organizationId,
        'FACEBOOK',
        userData.name || 'Facebook'
      );
      console.log('Facebook OAuth - Notificación creada exitosamente');
    } catch (notificationError) {
      console.error('Facebook OAuth - Error creando notificación:', notificationError);
      // Continuar sin notificación
    }

    // Redirigir al dashboard con mensaje de éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=facebook_connected&channelId=${channel.id}`
    );

  } catch (error) {
    console.error('Error en callback de Facebook:', error);
    console.error('Error completo:', JSON.stringify(error, null, 2));
    console.error('Stack trace:', error.stack);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed&platform=facebook`);
  }
}
