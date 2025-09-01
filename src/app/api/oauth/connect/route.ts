export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('OAuth Connect - Iniciando...');
    
    // Verificar token de autenticación
    const token = request.cookies.get('auth-token')?.value;
    console.log('OAuth Connect - Token encontrado:', !!token);
    
    if (!token) {
      console.log('OAuth Connect - No hay token');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('OAuth Connect - Verificando token...');
    const decoded = verifyToken(token);
    console.log('OAuth Connect - Token decodificado:', !!decoded);
    
    if (!decoded) {
      console.log('OAuth Connect - Token inválido');
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    console.log('OAuth Connect - Parseando body...');
    const body = await request.json();
    console.log('OAuth Connect - Body recibido:', body);
    
    const { platform, organizationId } = body;
    console.log('OAuth Connect - Platform:', platform);
    console.log('OAuth Connect - OrganizationId:', organizationId);

    if (!platform || !organizationId) {
      console.log('OAuth Connect - Faltan parámetros requeridos');
      return NextResponse.json({ error: 'Plataforma y organización son requeridos' }, { status: 400 });
    }

    console.log('OAuth Connect - Verificando variables de entorno...');
    console.log('OAuth Connect - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('OAuth Connect - INSTAGRAM_CLIENT_ID:', !!process.env.INSTAGRAM_CLIENT_ID);
    console.log('OAuth Connect - FACEBOOK_CLIENT_ID:', !!process.env.FACEBOOK_CLIENT_ID);
    console.log('OAuth Connect - TIKTOK_CLIENT_ID:', !!process.env.TIKTOK_CLIENT_ID);
    console.log('OAuth Connect - TIKTOK_REDIRECT_URI:', process.env.TIKTOK_REDIRECT_URI);
    
    // Configuración OAuth por plataforma
    const oauthConfigs = {
      instagram: {
        clientId: process.env.INSTAGRAM_CLIENT_ID,
                 redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth`,
        scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages',
        authUrl: 'https://www.instagram.com/oauth/authorize'
        // NOTA: Para Instagram Business API:
        // - instagram_business_basic: Acceso básico al perfil
        // - instagram_business_content_publish: Publicar posts
        // - instagram_business_manage_comments: Gestionar comentarios
        // - instagram_business_manage_messages: Gestionar mensajes
        // - instagram_business_manage_insights: Métricas y analytics
      },
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/facebook`,
        scope: 'public_profile,business_management',
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
        // NOTA: Para Meta Business Suite necesitamos:
        // - business_management: Acceso a portfolios comerciales
        // - public_profile: Información básica del usuario
      },
      linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/linkedin`,
        scope: 'r_liteprofile,r_emailaddress,w_member_social',
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      },
      twitter: {
        clientId: process.env.TWITTER_CLIENT_ID,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/twitter`,
        scope: 'tweet.read,tweet.write,users.read',
        authUrl: 'https://twitter.com/i/oauth2/authorize',
      },
      youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/youtube`,
        scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      },
      tiktok: {
        clientId: process.env.TIKTOK_CLIENT_ID,
        redirectUri: process.env.TIKTOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/tiktok`,
        scope: 'user.info.basic,video.upload',
        authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      }
    };

    const config = oauthConfigs[platform as keyof typeof oauthConfigs];
    if (!config) {
      console.log('OAuth Connect - Plataforma no soportada:', platform);
      return NextResponse.json({ error: 'Plataforma no soportada' }, { status: 400 });
    }

    if (!config.clientId) {
      console.log('OAuth Connect - Client ID no encontrado para:', platform);
      return NextResponse.json({ error: 'Configuración OAuth incompleta' }, { status: 500 });
    }

    // Generar state para seguridad
    const state = Buffer.from(JSON.stringify({
      userId: decoded.userId,
      organizationId,
      platform,
      timestamp: Date.now()
    })).toString('base64');

    console.log('OAuth Connect - Generando URL para:', platform);
    console.log('Client ID:', config.clientId);
    console.log('Redirect URI:', config.redirectUri);
    console.log('Scope:', config.scope);
    console.log('State generado:', state);

    // Construir URL de autorización
    const authUrl = new URL(config.authUrl);
    
    // Para TikTok, usar client_key en lugar de client_id
    if (platform === 'tiktok') {
      authUrl.searchParams.set('client_key', config.clientId);
    } else {
      authUrl.searchParams.set('client_id', config.clientId);
    }
    
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    // Agregar parámetros específicos por plataforma
    if (platform === 'facebook') {
      authUrl.searchParams.set('display', 'popup');
    } else if (platform === 'instagram') {
      authUrl.searchParams.set('force_reauth', 'true');
    } else if (platform === 'youtube') {
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
    }
    // TikTok ya tiene todos los parámetros necesarios configurados arriba

    const response = {
      authUrl: authUrl.toString(),
      state,
      platform
    };
    
    console.log('OAuth Connect - URL final generada:', authUrl.toString());
    console.log('OAuth Connect - Respuesta completa:', response);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en OAuth connect:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
