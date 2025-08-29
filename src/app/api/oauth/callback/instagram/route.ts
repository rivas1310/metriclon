export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Instagram OAuth Callback - Iniciando...');
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('Instagram OAuth Callback - Parámetros recibidos:');
    console.log('Code:', !!code);
    console.log('State:', !!state);
    console.log('Error:', error);

    if (error) {
      console.log('Instagram OAuth Callback - Error de Instagram:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_oauth_error&message=${error}`);
    }

    if (!code || !state) {
      console.log('Instagram OAuth Callback - Faltan parámetros requeridos');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_oauth_missing_params`);
    }

    // Decodificar el state
    let decodedState;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      decodedState = stateData;
      console.log('Instagram OAuth Callback - State decodificado:', decodedState);
    } catch (error) {
      console.error('Instagram OAuth Callback - Error decodificando state:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_oauth_invalid_state`);
    }

    // Intercambiar el código por un token de acceso
    console.log('Instagram OAuth Callback - Intercambiando código por token...');
    
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
        code: code,
        // Aseguramos que estamos solicitando los permisos correctos para Instagram API
        scope: 'instagram_basic,instagram_content_publish',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Instagram OAuth Callback - Error obteniendo token:', errorText);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_token_error`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Instagram OAuth Callback - Token obtenido:', !!tokenData.access_token);

    // Obtener información del usuario de Instagram
    console.log('Instagram OAuth Callback - Obteniendo información del usuario...');
    
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${tokenData.access_token}`);
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Instagram OAuth Callback - Error obteniendo usuario:', errorText);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_user_error`);
    }

    const userData = await userResponse.json();
    console.log('Instagram OAuth Callback - Usuario obtenido:', userData);
    
    // Obtener token de larga duración para Facebook/Instagram
    console.log('Instagram OAuth Callback - Obteniendo token de larga duración...');
    
    const longLivedTokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.INSTAGRAM_CLIENT_ID!}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET!}&fb_exchange_token=${tokenData.access_token}`);
    
    if (!longLivedTokenResponse.ok) {
      const errorText = await longLivedTokenResponse.text();
      console.error('Instagram OAuth Callback - Error obteniendo token de larga duración:', errorText);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_long_lived_token_error`);
    }
    
    const longLivedTokenData = await longLivedTokenResponse.json();
    console.log('Instagram OAuth Callback - Token de larga duración obtenido:', !!longLivedTokenData.access_token);
    
    // Obtener cuentas de Instagram Business asociadas
    console.log('Instagram OAuth Callback - Obteniendo cuentas de Instagram Business...');
    
    const accountsResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedTokenData.access_token}`);
    
    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('Instagram OAuth Callback - Error obteniendo cuentas:', errorText);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_accounts_error`);
    }
    
    const accountsData = await accountsResponse.json();
    console.log('Instagram OAuth Callback - Cuentas obtenidas:', accountsData);
    
    // Si no hay páginas, mostrar error
    if (!accountsData.data || accountsData.data.length === 0) {
      console.error('Instagram OAuth Callback - No se encontraron páginas de Facebook');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_no_pages`);
    }
    
    // Obtener Instagram Business Account para la primera página
    const page = accountsData.data[0];
    console.log('Instagram OAuth Callback - Usando página:', page.name);
    
    // Obtener la cuenta de Instagram Business asociada a la página
    let instagramBusinessData;
    let instagramBusinessAccount = null;
    
    try {
      const instagramBusinessResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
      
      if (instagramBusinessResponse.ok) {
        instagramBusinessData = await instagramBusinessResponse.json();
        console.log('Instagram OAuth Callback - Datos de Instagram Business:', instagramBusinessData);
        
        if (instagramBusinessData.instagram_business_account) {
          instagramBusinessAccount = instagramBusinessData.instagram_business_account;
          console.log('Instagram OAuth Callback - Cuenta de Instagram Business encontrada:', instagramBusinessAccount);
        } else {
          console.log('Instagram OAuth Callback - No se encontró una cuenta de Instagram Business para esta página');
          
          // Si no encontramos una cuenta de Instagram Business, intentamos usar la cuenta conectada directamente
          console.log('Instagram OAuth Callback - Intentando usar la cuenta de Instagram conectada directamente');
          instagramBusinessAccount = {
            id: userData.id,
            username: userData.username
          };
          console.log('Instagram OAuth Callback - Usando cuenta de Instagram directamente:', instagramBusinessAccount);
        }
      } else {
        const errorText = await instagramBusinessResponse.text();
        console.error('Instagram OAuth Callback - Error obteniendo cuenta de Instagram Business:', errorText);
        
        // Si hay un error en la API, intentamos usar la cuenta de Instagram conectada directamente
        console.log('Instagram OAuth Callback - Intentando usar la cuenta conectada directamente debido a error de API');
        instagramBusinessAccount = {
          id: userData.id,
          username: userData.username
        };
        console.log('Instagram OAuth Callback - Usando cuenta de Instagram directamente:', instagramBusinessAccount);
      }
    } catch (error) {
      console.error('Instagram OAuth Callback - Error al obtener la cuenta de Instagram Business:', error);
      
      // En caso de error, intentamos usar la cuenta de Instagram conectada directamente
      console.log('Instagram OAuth Callback - Intentando usar la cuenta conectada directamente debido a excepción');
      instagramBusinessAccount = {
        id: userData.id,
        username: userData.username
      };
      console.log('Instagram OAuth Callback - Usando cuenta de Instagram directamente:', instagramBusinessAccount);
    }
    
    // Si no tenemos una cuenta de Instagram Business, usamos la que creamos manualmente
    instagramBusinessData = instagramBusinessData || { instagram_business_account: instagramBusinessAccount };

    // Guardar o actualizar el canal en la base de datos
    console.log('Instagram OAuth Callback - Guardando canal en base de datos...');
    
    // Buscar si ya existe un canal de Instagram para esta organización
    let channel = await prisma.channel.findFirst({
      where: {
        organizationId: decodedState.organizationId as string,
        platform: 'INSTAGRAM',
      },
    });

    if (channel) {
      // Actualizar canal existente
      channel = await prisma.channel.update({
        where: { id: channel.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
          meta: {
            instagramUserId: userData.id,
            username: userData.username,
            accountType: userData.account_type,
            accessToken: longLivedTokenData.access_token,
            permissions: ['instagram_basic', 'instagram_content_publish'],
            instagram_business_account: instagramBusinessData.instagram_business_account,
            pages: [
              {
                id: page.id,
                name: page.name,
                access_token: page.access_token
              }
            ]
          },
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Crear nuevo canal
      channel = await prisma.channel.create({
        data: {
          platform: 'INSTAGRAM',
          organizationId: decodedState.organizationId as string,
          externalId: userData.id,
          name: userData.username || 'Instagram',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
          meta: {
            instagramUserId: userData.id,
            username: userData.username,
            accountType: userData.account_type,
            accessToken: longLivedTokenData.access_token,
            permissions: ['instagram_basic', 'instagram_content_publish'],
            instagram_business_account: instagramBusinessData.instagram_business_account,
            pages: [
              {
                id: page.id,
                name: page.name,
                access_token: page.access_token
              }
            ]
          },
          isActive: true,
        },
      });
    }

    console.log('Instagram OAuth Callback - Canal guardado:', channel.id);

    // Redirigir al dashboard con éxito
    console.log('Instagram OAuth Callback - Redirigiendo al dashboard...');
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=instagram_connected&username=${userData.username}`);

  } catch (error) {
    console.error('Instagram OAuth Callback - Error general:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_oauth_general_error`);
  }
}
