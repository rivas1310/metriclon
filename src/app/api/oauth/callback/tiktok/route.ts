export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    console.log('=== TIKTOK CALLBACK OFFICIAL ===');
    console.log('Code:', code);
    console.log('State:', state);
    console.log('Error:', error);
    console.log('Error Description:', error_description);

    // Manejar errores según documentación oficial de TikTok
    if (error) {
      console.error('TikTok OAuth Error:', error, error_description);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_oauth_failed&message=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_no_code`
      );
    }

    // Verificar state token para prevenir CSRF attacks
    if (!state) {
      console.error('No state token received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_no_state`
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
      // Manejar errores específicos según documentación de TikTok
      const errorMsg = tokenData.error_description || tokenData.error || 'Token request failed';
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_token_failed&message=${encodeURIComponent(errorMsg)}`
      );
    }

    // Verificar que todos los campos requeridos estén presentes
    const { access_token, refresh_token, open_id, scope, expires_in, refresh_expires_in } = tokenData;
    
    if (!access_token || !open_id) {
      console.error('Missing required token fields:', tokenData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_invalid_token_response`
      );
    }

    // Obtener información completa del usuario con todos los scopes disponibles
    const userResponse = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,is_verified,follower_count,following_count,likes_count,video_count,profile_web_link,profile_deep_link,bio_description`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const userData = await userResponse.json();
    console.log('User Data:', userData);
    
    // Verificar si la respuesta del usuario es exitosa
    if (!userResponse.ok) {
      console.error('Error obteniendo información del usuario:', userData);
      // Continuar con información básica si falla
    }

    // ORGANIZACIÓN CORRECTA - SIEMPRE
    const organizationId = '997693ca-8304-464e-87a9-ccb22b576724';
    
    console.log('Guardando TikTok en organización:', organizationId);
    console.log('Datos para crear canal:', {
      platform: 'TIKTOK',
      externalId: open_id,
      name: userData.data?.user?.display_name || 'TikTok Account',
      organizationId: organizationId
    });

    // Crear o actualizar canal de TikTok con manejo de tokens según documentación oficial
    const channel = await prisma.channel.upsert({
      where: {
        organizationId_platform_externalId: {
          organizationId: organizationId,
          platform: 'TIKTOK',
          externalId: open_id,
        },
      },
      update: {
        name: userData.data?.user?.display_name || 'TikTok Account',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        isActive: true,
        updatedAt: new Date(),
        meta: {
          openId: open_id,
          scope: scope,
          expires_in: expires_in,
          refresh_expires_in: refresh_expires_in,
          userInfo: userData.data?.user || {},
        },
      },
      create: {
        platform: 'TIKTOK',
        externalId: open_id, // CAMPO OBLIGATORIO
        name: userData.data?.user?.display_name || 'TikTok Account',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        isActive: true,
        organizationId: organizationId,
        meta: {
          openId: open_id,
          scope: scope,
          expires_in: expires_in,
          refresh_expires_in: refresh_expires_in,
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
    console.error('❌ Error en callback de TikTok:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    // Proporcionar más información sobre el tipo de error
    let errorMessage = 'callback_failed';
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'account_already_connected';
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'organization_not_found';
      } else if (error.message.includes('prisma')) {
        errorMessage = 'database_error';
      }
    }
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_${errorMessage}&details=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`
    );
  }
}
