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
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/instagram`,
        code: code,
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
            accessToken: tokenData.access_token,
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
            accessToken: tokenData.access_token,
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
