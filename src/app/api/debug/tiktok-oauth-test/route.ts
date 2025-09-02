import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK OAUTH TEST ===');
    
    // Variables de entorno
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json({ 
        error: 'Configuración de TikTok incompleta' 
      }, { status: 500 });
    }
    
    // Generar state token único
    const csrfState = Math.random().toString(36).substring(2);
    
    // Generar URL de autorización
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.append('client_key', clientId);
    authUrl.searchParams.append('scope', 'user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', csrfState);
    authUrl.searchParams.append('disable_auto_auth', '1');
    
    console.log('URL de autorización generada:', authUrl.toString());
    
    return NextResponse.json({
      success: true,
      message: 'TikTok OAuth test completed',
      oauth: {
        clientId: clientId,
        redirectUri: redirectUri,
        state: csrfState,
        authUrl: authUrl.toString(),
        scopes: 'user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish'
      },
      recommendations: [
        '1. Verificar que la URL de autorización sea correcta',
        '2. Verificar que TikTok redirija correctamente',
        '3. Revisar logs de Vercel para errores específicos',
        '4. Probar con un navegador diferente'
      ]
    });
    
  } catch (error) {
    console.error('Error in TikTok OAuth test:', error);
    return NextResponse.json({
      error: 'TikTok OAuth test failed',
      details: error
    }, { status: 500 });
  }
}
