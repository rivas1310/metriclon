export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK LOGIN KIT IMPLEMENTATION ===');
    
    // Variables de entorno
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json({ 
        error: 'Configuración de TikTok incompleta' 
      }, { status: 500 });
    }
    
    // Generar state token único según TikTok Official Documentation
    const csrfState = Math.random().toString(36).substring(2);
    
    // Generar URL de autorización con scopes completos según documentación oficial
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.append('client_key', clientId);
    // Scopes según documentación oficial para funcionalidad completa
    authUrl.searchParams.append('scope', 'user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', csrfState);
    authUrl.searchParams.append('disable_auto_auth', '1');
    
    console.log('CSRF State Token generado:', csrfState);
    console.log('URL de autorización generada:', authUrl.toString());
    
    return NextResponse.json({
      authUrl: authUrl.toString(),
      state: csrfState,
      message: 'Redirigiendo a TikTok para autorización'
    });
    
  } catch (error) {
    console.error('Error en OAuth TikTok:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
