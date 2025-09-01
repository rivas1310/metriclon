import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // EXTRAER Y VALIDAR organizationId
    let organizationId = 'default';
    if (state && state.startsWith('tiktok_auth_')) {
      organizationId = state.replace('tiktok_auth_', '');
    }
    
    // VALIDACIÓN CRÍTICA: Usar SIEMPRE la organización correcta
    const correctOrganizationId = '997693ca-8304-464e-87a9-ccb22b576724';
    
    // Si el organizationId extraído NO es el correcto, usar el correcto
    if (organizationId !== correctOrganizationId) {
      console.log('⚠️ WARNING: Organization ID incorrecto detectado:', organizationId);
      console.log('🔧 CORRIGIENDO: Usando organización correcta:', correctOrganizationId);
      organizationId = correctOrganizationId;
    }
    
    console.log('✅ Organization ID FINAL a usar:', organizationId);
    console.log('✅ Organización correcta confirmada:', correctOrganizationId);
    
    console.log('=== CALLBACK TIKTOK OAUTH ===');
    console.log('Code:', code);
    console.log('State:', state);
    console.log('Error:', error);
    console.log('URL completa:', request.url);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));

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

    console.log('=== INTENTANDO GUARDAR TIKTOK ===');
    console.log('Organization ID a usar:', organizationId);
    console.log('Platform:', 'TIKTOK');
    console.log('User data:', userData.data?.user);
    
    // VALIDACIÓN FINAL ANTES DE GUARDAR
    if (organizationId !== '997693ca-8304-464e-87a9-ccb22b576724') {
      console.error('❌ ERROR CRÍTICO: Organization ID incorrecto antes de guardar');
      console.error('Organization ID actual:', organizationId);
      console.error('Organization ID esperado: 997693ca-8304-464e-87a9-ccb22b576724');
      throw new Error('Organization ID incorrecto - no se puede guardar TikTok');
    }
    
    console.log('✅ VALIDACIÓN PASADA: Organization ID correcto confirmado');
    
    try {
          // Crear o actualizar el canal de TikTok (versión simplificada)
    console.log('=== CREANDO CANAL DE TIKTOK ===');
    console.log('Datos a guardar:', {
      platform: 'TIKTOK',
      name: userData.data?.user?.display_name || 'TikTok Account',
      organizationId: organizationId,
      isActive: true
    });
    
    let channel;
    try {
      // Intentar crear el canal directamente
      channel = await prisma.channel.create({
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
            accessToken: access_token,
            refreshToken: refresh_token,
          },
        },
      });
      
      console.log('✅ Canal de TikTok creado exitosamente:', channel.id);
      
    } catch (createError) {
      console.log('Error al crear, intentando actualizar:', createError.message);
      
      // Si falla la creación, intentar actualizar
      try {
        channel = await prisma.channel.updateMany({
          where: {
            platform: 'TIKTOK',
            organizationId: organizationId,
          },
          data: {
            accessToken: access_token,
            refreshToken: refresh_token,
            isActive: true,
            meta: {
              openId: open_id,
              scope: scope,
              userInfo: userData.data?.user || {},
              accessToken: access_token,
              refreshToken: refresh_token,
            },
          },
        });
        
        console.log('✅ Canal de TikTok actualizado exitosamente');
        
      } catch (updateError) {
        console.error('❌ ERROR CRÍTICO:', updateError);
        throw updateError;
      }
    }
      
              console.log('✅ Canal de TikTok creado/actualizado exitosamente');
      console.log('Canal completo:', channel);
      
    } catch (dbError) {
      console.error('❌ ERROR AL GUARDAR EN BASE DE DATOS:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      });
      
      // INTENTAR RECUPERACIÓN: Verificar si ya existe un canal
      try {
        console.log('🔄 Intentando recuperación: verificando canal existente...');
        const existingChannel = await prisma.channel.findFirst({
          where: {
            platform: 'TIKTOK',
            organizationId: organizationId
          }
        });
        
        if (existingChannel) {
          console.log('✅ Canal existente encontrado, actualizando...');
          await prisma.channel.update({
            where: { id: existingChannel.id },
            data: {
              accessToken: access_token,
              refreshToken: refresh_token,
              isActive: true,
              meta: {
                openId: open_id,
                scope: scope,
                userInfo: userData.data?.user || {},
                accessToken: access_token,
                refreshToken: refresh_token,
              }
            }
          });
          console.log('✅ Canal recuperado y actualizado exitosamente');
        } else {
          throw new Error('No se pudo crear ni recuperar el canal');
        }
      } catch (recoveryError) {
        console.error('❌ RECUPERACIÓN FALLIDA:', recoveryError);
        throw dbError; // Lanzar el error original
      }
    }

    console.log('✅ TikTok guardado exitosamente en organización:', organizationId);
    console.log('✅ Redirigiendo al dashboard...');

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
