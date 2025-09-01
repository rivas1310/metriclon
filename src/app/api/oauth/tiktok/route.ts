import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK OAUTH SIMPLE ===');
    
    // Variables de entorno
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json({ 
        error: 'Configuración de TikTok incompleta' 
      }, { status: 500 });
    }
    
    // Generar URL de autorización
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.append('client_key', clientId);
               // authUrl.searchParams.append('scope', 'user.info.basic');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', 'tiktok_auth');
    
    console.log('URL de autorización generada:', authUrl.toString());
    
    return NextResponse.json({
      authUrl: authUrl.toString(),
      message: 'Redirigiendo a TikTok para autorización'
    });
    
  } catch (error) {
    console.error('Error en OAuth TikTok:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
