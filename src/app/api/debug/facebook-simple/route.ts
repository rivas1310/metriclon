import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando debug simple de Facebook...');

    // Buscar cualquier canal de Facebook en la base de datos
    const channel = await prisma.channel.findFirst({
      where: {
        platform: 'FACEBOOK'
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'No se encontró ningún canal de Facebook' }, { status: 404 });
    }

    console.log(`🔍 Canal encontrado: ${channel.id} para organización: ${channel.organizationId}`);

    // Obtener páginas administradas
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${channel.accessToken}`
    );

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text();
      console.error('❌ Error al obtener páginas:', pagesResponse.status, errorText);
      return NextResponse.json({ 
        error: 'No se pudieron obtener las páginas administradas',
        details: errorText
      }, { status: pagesResponse.status });
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return NextResponse.json({ error: 'No se encontraron páginas administradas' }, { status: 404 });
    }

    const page = pages[0]; // Usar la primera página
    console.log(`🔍 Usando página: ${page.name} (${page.id})`);

    // Obtener posts recientes con diferentes métodos para reacciones
    const testResults = {};

    // Método 1: Posts con insights
    try {
      const postsUrl = `https://graph.facebook.com/v18.0/${page.id}/posts?fields=id,message,created_time,type,insights.metric(post_impressions,post_reach,post_reactions_by_type_total,post_comments,post_shares)&limit=3&access_token=${page.access_token || channel.accessToken}`;
      
      console.log(`🔍 Método 1 - Posts con insights`);
      
      const postsResponse = await fetch(postsUrl);
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        testResults.method1 = {
          success: true,
          posts: postsData.data?.slice(0, 2) || [],
          insights: postsData.data?.[0]?.insights || null
        };
        console.log(`✅ Método 1 exitoso:`, testResults.method1);
      } else {
        const errorText = await postsResponse.text();
        testResults.method1 = {
          success: false,
          error: postsResponse.status,
          details: errorText
        };
        console.error('❌ Método 1 falló:', postsResponse.status, errorText);
      }
    } catch (error) {
      testResults.method1 = { success: false, error: error.message };
      console.error('❌ Método 1 error:', error);
    }

    // Método 2: Posts con reacciones directas
    try {
      const postsWithReactionsUrl = `https://graph.facebook.com/v18.0/${page.id}/posts?fields=id,message,created_time,type,reactions&limit=3&access_token=${page.access_token || channel.accessToken}`;
      
      console.log(`🔍 Método 2 - Posts con reacciones directas`);
      
      const reactionsResponse = await fetch(postsWithReactionsUrl);
      if (reactionsResponse.ok) {
        const reactionsData = await reactionsResponse.json();
        testResults.method2 = {
          success: true,
          posts: reactionsData.data?.slice(0, 2) || [],
          reactions: reactionsData.data?.[0]?.reactions || null
        };
        console.log(`✅ Método 2 exitoso:`, testResults.method2);
      } else {
        const errorText = await reactionsResponse.text();
        testResults.method2 = {
          success: false,
          error: reactionsResponse.status,
          details: errorText
        };
        console.error('❌ Método 2 falló:', reactionsResponse.status, errorText);
      }
    } catch (error) {
      testResults.method2 = { success: false, error: error.message };
      console.error('❌ Método 2 error:', error);
    }

    // Método 3: Obtener reacciones de un post específico
    if (testResults.method1?.success && testResults.method1.posts.length > 0) {
      try {
        const firstPostId = testResults.method1.posts[0].id;
        const postReactionsUrl = `https://graph.facebook.com/v18.0/${firstPostId}?fields=id,message,reactions,likes&access_token=${page.access_token || channel.accessToken}`;
        
        console.log(`🔍 Método 3 - Post específico: ${firstPostId}`);
        
        const postResponse = await fetch(postReactionsUrl);
        if (postResponse.ok) {
          const postData = await postResponse.json();
          testResults.method3 = {
            success: true,
            post: postData,
            reactions: postData.reactions || null,
            likes: postData.likes || null
          };
          console.log(`✅ Método 3 exitoso:`, testResults.method3);
        } else {
          const errorText = await postResponse.text();
          testResults.method3 = {
            success: false,
            error: postResponse.status,
            details: errorText
          };
          console.error('❌ Método 3 falló:', postResponse.status, errorText);
        }
      } catch (error) {
        testResults.method3 = { success: false, error: error.message };
        console.error('❌ Método 3 error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        name: page.name
      },
      testResults,
      note: 'Revisa la consola del servidor para logs detallados'
    });

  } catch (error) {
    console.error('❌ Error en debug simple de Facebook:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
