import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('=== TIKTOK CALLBACK SIMPLE ===');
    console.log('Code:', code);
    console.log('State:', state);

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_oauth_failed&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_no_code`
      );
    }

    // Intercambiar código por access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_ID!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token Response:', tokenData);

    if (!tokenResponse.ok) {
      console.error('Error obteniendo token:', tokenData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_token_failed`
      );
    }

    const { access_token, refresh_token, open_id, scope } = tokenData;

    // Obtener información del usuario
    const userResponse = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,is_verified,follower_count,following_count,likes_count`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const userData = await userResponse.json();
    console.log('User Data:', userData);

    // ORGANIZACIÓN CORRECTA - SIEMPRE
    const organizationId = '997693ca-8304-464e-87a9-ccb22b576724';
    
    console.log('Guardando TikTok en organización:', organizationId);

    // Crear canal de TikTok
    const channel = await prisma.channel.create({
      data: {
        platform: 'TIKTOK',
        name: userData.data?.user?.display_name || 'TikTok Account',
        accessToken: access_token,
        refreshToken: refresh_token,
        isActive: true,
        organizationId: organizationId,
        meta: {
          openId: open_id,
          scope: scope,
          userInfo: userData.data?.user || {},
        },
      },
    });

    console.log('✅ TikTok guardado exitosamente:', channel.id);

    // Redirigir al dashboard con éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=tiktok_connected&username=${encodeURIComponent(userData.data?.user?.display_name || 'TikTok')}`
    );

  } catch (error) {
    console.error('Error en callback de TikTok:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_callback_failed`
    );
  }
}
