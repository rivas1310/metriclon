export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG TIKTOK ENVIRONMENT ===');
    
    const envVars = {
      TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID,
      TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ? 'SET' : 'NOT SET',
      TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    };
    
    console.log('Environment Variables:', envVars);
    
    // Construir URL de autorización para comparar
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    if (clientId && redirectUri) {
      const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authUrl.searchParams.append('client_key', clientId);
      authUrl.searchParams.append('scope', 'user.info.basic,video.upload,video.publish');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('state', 'tiktok_auth');
      
      console.log('Generated Auth URL:', authUrl.toString());
      
      return NextResponse.json({
        success: true,
        environment: envVars,
        generatedAuthUrl: authUrl.toString(),
        message: 'Variables de entorno de TikTok verificadas'
      });
    } else {
      return NextResponse.json({
        success: false,
        environment: envVars,
        error: 'Faltan variables de entorno requeridas',
        message: 'Verifica TIKTOK_CLIENT_ID y TIKTOK_REDIRECT_URI'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error en debug TikTok environment:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
