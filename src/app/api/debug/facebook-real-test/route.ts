import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test real de Facebook usando el mismo código de la interfaz...');

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
    console.log(`🔍 Token real: ${channel.accessToken}`);

    const testResults = {};

    // Test 1: Usar exactamente el mismo código que usa la interfaz
    try {
      console.log('🔍 Test 1: Usando código de socialMediaAPI.ts...');
      
      // Obtener páginas administradas (código copiado de socialMediaAPI.ts)
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${channel.accessToken}`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        const pages = pagesData.data || [];
        
        if (pages.length > 0) {
          const page = pages[0];
          console.log(`✅ Página encontrada: ${page.name} (${page.id})`);
          
          // Obtener posts con insights (código copiado de socialMediaAPI.ts)
          const postsUrl = `https://graph.facebook.com/v18.0/${page.id}/posts?fields=id,message,created_time,type,insights.metric(post_impressions,post_reach,post_reactions_by_type_total,post_comments,post_shares)&limit=3&access_token=${page.access_token || channel.accessToken}`;
          
          const postsResponse = await fetch(postsUrl);
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            testResults.postsWithInsights = {
              success: true,
              postsCount: postsData.data?.length || 0,
              firstPost: postsData.data?.[0] ? {
                id: postsData.data[0].id,
                message: postsData.data[0].message?.substring(0, 50),
                insights: postsData.data[0].insights?.data || []
              } : null
            };
            console.log(`✅ Posts con insights obtenidos:`, testResults.postsWithInsights);
          } else {
            const errorText = await postsResponse.text();
            testResults.postsWithInsights = {
              success: false,
              error: postsResponse.status,
              details: errorText
            };
            console.error('❌ Posts con insights fallaron:', postsResponse.status, errorText);
          }
        } else {
          testResults.pages = { success: false, error: 'No se encontraron páginas' };
        }
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
      console.error('❌ Error en test principal:', error);
    }

    // Test 2: Verificar si es un perfil personal
    try {
      console.log('🔍 Test 2: Verificando si es perfil personal...');
      const meResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${channel.accessToken}`
      );

      if (meResponse.ok) {
        const meData = await meResponse.json();
        testResults.personalProfile = {
          success: true,
          data: meData
        };
        console.log(`✅ Perfil personal funciona:`, meData);
      } else {
        const errorText = await meResponse.text();
        testResults.personalProfile = {
          success: false,
          error: meResponse.status,
          details: errorText
        };
        console.error('❌ Perfil personal falló:', meResponse.status, errorText);
      }
    } catch (error) {
      testResults.personalProfile = { success: false, error: error.message };
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        platform: channel.platform,
        tokenLength: channel.accessToken.length,
        tokenPreview: channel.accessToken.substring(0, 20) + '...'
      },
      testResults,
      note: 'Este test usa exactamente el mismo código que la interfaz principal'
    });

  } catch (error) {
    console.error('❌ Error en test real:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
