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
    
    let longLivedTokenData = null;
    let longLivedTokenError = null;
    
    try {
      const longLivedTokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.INSTAGRAM_CLIENT_ID!}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET!}&fb_exchange_token=${tokenData.access_token}`);
      
      if (longLivedTokenResponse.ok) {
        longLivedTokenData = await longLivedTokenResponse.json();
        console.log('Instagram OAuth Callback - Token de larga duración obtenido:', !!longLivedTokenData.access_token);
      } else {
        const errorText = await longLivedTokenResponse.text();
        longLivedTokenError = errorText;
        console.error('Instagram OAuth Callback - Error obteniendo token de larga duración:', errorText);
        
        // Continuar con el token de corta duración como fallback
        console.log('Instagram OAuth Callback - Continuando con token de corta duración como fallback...');
      }
    } catch (error) {
      longLivedTokenError = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Instagram OAuth Callback - Excepción obteniendo token de larga duración:', longLivedTokenError);
      console.log('Instagram OAuth Callback - Continuando con token de corta duración como fallback...');
    }
    
    // Si no tenemos token de larga duración, usar el de corta duración
    const accessTokenToUse = longLivedTokenData?.access_token || tokenData.access_token;
    const tokenType = longLivedTokenData ? 'long_lived' : 'short_lived';
    
    console.log('Instagram OAuth Callback - Token a usar:', tokenType);
    console.log('Instagram OAuth Callback - Token presente:', !!accessTokenToUse);
    
         // Para Instagram, usamos directamente la cuenta conectada
     console.log('Instagram OAuth Callback - Usando cuenta de Instagram directamente...');
     
     const instagramBusinessAccount = {
       id: userData.id,
       username: userData.username
     };
     
     console.log('Instagram OAuth Callback - Cuenta de Instagram configurada:', instagramBusinessAccount);

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
            accessToken: accessTokenToUse,
            tokenType: tokenType,
            longLivedTokenError: longLivedTokenError,
            permissions: ['instagram_basic', 'instagram_content_publish'],
            instagram_business_account: {
              id: userData.id, // Usar el ID real de Instagram
              username: userData.username
            }
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
              accessToken: accessTokenToUse,
              tokenType: tokenType,
              longLivedTokenError: longLivedTokenError,
              permissions: ['instagram_basic', 'instagram_content_publish'],
              instagram_business_account: {
                id: userData.id, // Usar el ID real de Instagram
                username: userData.username
              }
            },
          isActive: true,
        },
      });
    }

    console.log('Instagram OAuth Callback - Canal guardado:', channel.id);

    // Redirigir al dashboard con éxito
    console.log('Instagram OAuth Callback - Redirigiendo al dashboard...');
    
    let redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=instagram_connected&username=${userData.username}`;
    
    // Si usamos token de corta duración, agregar advertencia
    if (tokenType === 'short_lived') {
      redirectUrl += '&warning=short_lived_token&message=Se usó token de corta duración. Puede expirar pronto.';
    }
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Instagram OAuth Callback - Error general:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_oauth_general_error`);
  }
}
