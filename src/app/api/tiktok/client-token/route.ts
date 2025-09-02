import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK CLIENT ACCESS TOKEN ===');
    
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Configuración de TikTok incompleta' 
      }, { status: 500 });
    }
    
    // Obtener Client Access Token según documentación oficial
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Client Token Response:', tokenData);
    
    if (!tokenResponse.ok) {
      console.error('Error obteniendo client token:', tokenData);
      return NextResponse.json({
        error: 'Error obteniendo client access token',
        details: tokenData
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      clientAccessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      message: 'Client access token obtenido exitosamente'
    });
    
  } catch (error) {
    console.error('Error en client token:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
