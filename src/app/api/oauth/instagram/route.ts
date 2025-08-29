export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/oauth/instagram/callback';

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

    // Construir URL de autorización de Instagram
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', INSTAGRAM_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'basic,comments,relationships,likes');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', organizationId); // Pasar organizationId en state

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
