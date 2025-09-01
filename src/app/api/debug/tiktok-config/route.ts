export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG TIKTOK CONFIG ===');
    
    // Verificar variables de entorno
    const tiktokConfig = {
      TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID,
      TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ? '***CONFIGURADO***' : 'NO CONFIGURADO',
      TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
    
    console.log('Configuración TikTok:', tiktokConfig);
    
    // Construir URL de autorización de prueba
    if (tiktokConfig.TIKTOK_CLIENT_ID && tiktokConfig.TIKTOK_REDIRECT_URI) {
      const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authUrl.searchParams.set('client_key', tiktokConfig.TIKTOK_CLIENT_ID);
      authUrl.searchParams.set('scope', 'user.info.basic,video.publish,user.info.profile');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', tiktokConfig.TIKTOK_REDIRECT_URI);
      authUrl.searchParams.set('state', 'debug_test');
      
      console.log('URL de autorización generada:', authUrl.toString());
      
      return NextResponse.json({
        success: true,
        config: tiktokConfig,
        authUrl: authUrl.toString(),
        message: 'Configuración TikTok verificada correctamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        config: tiktokConfig,
        error: 'Faltan variables de entorno requeridas para TikTok'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error en debug TikTok config:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
