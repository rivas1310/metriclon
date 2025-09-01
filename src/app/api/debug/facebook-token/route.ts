import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando token de Facebook...');

    // Buscar cualquier canal de Facebook en la base de datos
    const channel = await prisma.channel.findFirst({
      where: {
        platform: 'FACEBOOK'
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'No se encontró ningún canal de Facebook' }, { status: 404 });
    }

    console.log(`🔍 Canal encontrado: ${channel.id}`);
    console.log(`🔍 Token: ${channel.accessToken.substring(0, 20)}...`);

    const testResults = {};

    // Test 1: Verificar token básico
    try {
      console.log('🔍 Test 1: Verificando token básico...');
      const meResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${channel.accessToken}`
      );

      if (meResponse.ok) {
        const meData = await meResponse.json();
        testResults.basicToken = {
          success: true,
          data: meData
        };
        console.log(`✅ Token básico funciona:`, meData);
      } else {
        const errorText = await meResponse.text();
        testResults.basicToken = {
          success: false,
          error: meResponse.status,
          details: errorText
        };
        console.error('❌ Token básico falló:', meResponse.status, errorText);
      }
    } catch (error) {
      testResults.basicToken = { success: false, error: error.message };
      console.error('❌ Error en token básico:', error);
    }

    // Test 2: Verificar permisos del token
    try {
      console.log('🔍 Test 2: Verificando permisos...');
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${channel.accessToken}`
      );

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        testResults.permissions = {
          success: true,
          data: permissionsData
        };
        console.log(`✅ Permisos obtenidos:`, permissionsData);
      } else {
        const errorText = await permissionsResponse.text();
        testResults.permissions = {
          success: false,
          error: permissionsResponse.status,
          details: errorText
        };
        console.error('❌ Permisos fallaron:', permissionsResponse.status, errorText);
      }
    } catch (error) {
      testResults.permissions = { success: false, error: error.message };
      console.error('❌ Error en permisos:', error);
    }

    // Test 3: Intentar obtener páginas administradas
    try {
      console.log('🔍 Test 3: Intentando obtener páginas administradas...');
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name&access_token=${channel.accessToken}`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        testResults.pages = {
          success: true,
          data: pagesData
        };
        console.log(`✅ Páginas obtenidas:`, pagesData);
      } else {
        const errorText = await pagesResponse.text();
        testResults.pages = {
          success: false,
          error: pagesResponse.status,
          details: errorText
        };
        console.error('❌ Páginas fallaron:', pagesResponse.status, errorText);
      }
    } catch (error) {
      testResults.pages = { success: false, error: error.message };
      console.error('❌ Error en páginas:', error);
    }

    // Test 4: Verificar si es un perfil personal o página
    if (testResults.basicToken?.success) {
      try {
        console.log('🔍 Test 4: Verificando tipo de cuenta...');
        const accountTypeResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name,email,accounts&access_token=${channel.accessToken}`
        );

        if (accountTypeResponse.ok) {
          const accountData = await accountTypeResponse.json();
          testResults.accountType = {
            success: true,
            data: accountData,
            isPage: accountData.accounts ? true : false
          };
          console.log(`✅ Tipo de cuenta verificado:`, accountData);
        } else {
          const errorText = await accountTypeResponse.text();
          testResults.accountType = {
            success: false,
            error: accountTypeResponse.status,
            details: errorText
          };
        }
      } catch (error) {
        testResults.accountType = { success: false, error: error.message };
      }
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        organizationId: channel.organizationId,
        platform: channel.platform,
        tokenPreview: channel.accessToken.substring(0, 20) + '...'
      },
      testResults,
      note: 'Revisa la consola del servidor para logs detallados'
    });

  } catch (error) {
    console.error('❌ Error en verificación de token:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
