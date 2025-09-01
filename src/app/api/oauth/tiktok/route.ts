import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ 
        error: 'Organization ID es requerido' 
      }, { status: 400 });
    }
    
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json({ 
        error: 'Configuración de TikTok incompleta' 
      }, { status: 500 });
    }

    // Construir URL de autorización de TikTok
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.append('client_key', clientId);
    authUrl.searchParams.append('scope', 'user.info.basic,video.publish,user.info.profile');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    // Incluir el organizationId en el state para pasarlo al callback
    const state = `tiktok_auth_${organizationId}`;
    authUrl.searchParams.append('state', state);
    
    console.log('=== INICIANDO OAUTH TIKTOK ===');
    console.log('Client ID:', clientId);
    console.log('Client ID Type:', typeof clientId);
    console.log('Client ID Length:', clientId?.length);
    console.log('Redirect URI:', redirectUri);
    console.log('Auth URL:', authUrl.toString());
    console.log('Environment Variables:');
    console.log('- TIKTOK_CLIENT_ID:', process.env.TIKTOK_CLIENT_ID);
    console.log('- TIKTOK_CLIENT_SECRET:', process.env.TIKTOK_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('- TIKTOK_REDIRECT_URI:', process.env.TIKTOK_REDIRECT_URI);

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      message: 'Redirigiendo a TikTok para autorización'
    });

  } catch (error) {
    console.error('Error iniciando OAuth de TikTok:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
