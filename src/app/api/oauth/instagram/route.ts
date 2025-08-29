export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/callback/instagram';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    if (!FACEBOOK_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Facebook Client ID no configurado' },
        { status: 500 }
      );
    }

    // Codificar el state con la información necesaria
    const state = Buffer.from(JSON.stringify({
      organizationId,
      timestamp: Date.now()
    })).toString('base64');

    // Construir URL de autorización de Facebook para Instagram
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', FACEBOOK_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', FACEBOOK_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      message: 'Redirige al usuario a esta URL para autorizar Instagram'
    });
  } catch (error) {
    console.error('Error iniciando OAuth de Instagram:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
