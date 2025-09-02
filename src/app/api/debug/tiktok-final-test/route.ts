import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK FINAL TEST ===');
    
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
      message: 'TikTok final test completed',
      test: {
        step1: 'Prueba el callback directo',
        step2: 'Autoriza en TikTok',
        step3: 'Verifica la redirección',
        step4: 'Revisa los logs de Vercel'
      },
      oauth: {
        clientId: clientId,
        redirectUri: redirectUri,
        state: csrfState,
        authUrl: authUrl.toString(),
        scopes: 'user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish'
      },
      callback: {
        url: `https://metriclon.vercel.app/api/oauth/callback/tiktok/?code=real_authorization_code_123&state=${csrfState}`,
        code: 'real_authorization_code_123',
        state: csrfState
      },
      recommendations: [
        '1. Prueba el callback directo primero',
        '2. Si funciona, el problema está en TikTok',
        '3. Si no funciona, revisa los logs de Vercel',
        '4. Autoriza en TikTok y verifica la redirección'
      ]
    });
    
  } catch (error) {
    console.error('Error in TikTok final test:', error);
    return NextResponse.json({
      error: 'TikTok final test failed',
      details: error
    }, { status: 500 });
  }
}
