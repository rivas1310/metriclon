export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/callback/instagram';

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

    if (!INSTAGRAM_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Instagram Client ID no configurado' },
        { status: 500 }
      );
    }

    // Codificar el state con la información necesaria
    const state = Buffer.from(JSON.stringify({
      organizationId,
      timestamp: Date.now()
    })).toString('base64');

    // Construir URL de autorización de Instagram
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', INSTAGRAM_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'instagram_basic,instagram_content_publish');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    // Redirigir directamente al usuario a la URL de autorización
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error iniciando OAuth de Instagram:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
