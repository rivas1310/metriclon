import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test oficial de Facebook Graph API v18.0 con documentación oficial...');

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
    console.log(`🔍 Token: ${channel.accessToken}`);

    const testResults = {};

    // Test 1: Verificar token básico (según documentación oficial)
    try {
      console.log('🔍 Test 1: Verificando token básico...');
      const meResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${channel.accessToken}`
      );

      if (meResponse.ok) {
        const meData = await meResponse.json();
        testResults.basicToken = {
          success: true,
          data: meData,
          note: 'Token básico funciona según documentación oficial'
        };
        console.log(`✅ Token básico funciona:`, meData);
      } else {
        const errorText = await meResponse.text();
        testResults.basicToken = {
          success: false,
          error: meResponse.status,
          details: errorText,
          note: 'Token básico falla según documentación oficial'
        };
        console.error('❌ Token básico falla:', meResponse.status, errorText);
      }
    } catch (error) {
      testResults.basicToken = { success: false, error: error.message };
    }

    // Test 2: Obtener páginas administradas (según documentación oficial)
    try {
      console.log('🔍 Test 2: Obteniendo páginas administradas...');
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,tasks&access_token=${channel.accessToken}`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        const pages = pagesData.data || [];
        
        if (pages.length > 0) {
          const page = pages[0];
          testResults.pages = {
            success: true,
            data: pagesData,
            page: page,
            note: 'Páginas obtenidas según documentación oficial'
          };
          console.log(`✅ Páginas obtenidas:`, page);

          // Test 3: Obtener métricas de página (según documentación oficial)
          try {
            console.log('🔍 Test 3: Obteniendo métricas de página...');
            const pageInsightsUrl = `https://graph.facebook.com/v18.0/${page.id}/insights?metric=page_impressions_unique,page_engaged_users&access_token=${page.access_token || channel.accessToken}`;
            
            const pageInsightsResponse = await fetch(pageInsightsUrl);
            if (pageInsightsResponse.ok) {
              const pageInsightsData = await pageInsightsResponse.json();
              testResults.pageInsights = {
                success: true,
                metricsCount: pageInsightsData.data?.length || 0,
                metrics: pageInsightsData.data?.map(m => m.name) || [],
                note: 'Métricas de página obtenidas según documentación oficial'
              };
              console.log(`✅ Métricas de página obtenidas:`, testResults.pageInsights);
            } else {
              const errorText = await pageInsightsResponse.text();
              testResults.pageInsights = {
                success: false,
                error: pageInsightsResponse.status,
                details: errorText,
                note: 'Métricas de página fallaron según documentación oficial'
              };
              console.error('❌ Métricas de página fallaron:', pageInsightsResponse.status, errorText);
            }
          } catch (error) {
            testResults.pageInsights = { success: false, error: error.message };
          }

          // Test 4: Obtener posts (según documentación oficial - SIN insights.metric)
          try {
            console.log('🔍 Test 4: Obteniendo posts...');
            const postsUrl = `https://graph.facebook.com/v18.0/${page.id}/posts?fields=id,message,created_time,type&limit=3&access_token=${page.access_token || channel.accessToken}`;
            
            const postsResponse = await fetch(postsUrl);
            if (postsResponse.ok) {
              const postsData = await postsResponse.json();
              testResults.posts = {
                success: true,
                postsCount: postsData.data?.length || 0,
                firstPost: postsData.data?.[0] ? {
                  id: postsData.data[0].id,
                  message: postsData.data[0].message?.substring(0, 50),
                  type: postsData.data[0].type
                } : null,
                note: 'Posts obtenidos según documentación oficial'
              };
              console.log(`✅ Posts obtenidos:`, testResults.posts);

              // Test 5: Obtener insights de un post específico (según documentación oficial)
              if (testResults.posts.firstPost) {
                try {
                  console.log('🔍 Test 5: Obteniendo insights de post específico...');
                  const postId = testResults.posts.firstPost.id;
                  const postInsightsUrl = `https://graph.facebook.com/v18.0/${postId}/insights?metric=post_impressions,post_reach,post_reactions_by_type_total,post_comments,post_shares&access_token=${page.access_token || channel.accessToken}`;
                  
                  const postInsightsResponse = await fetch(postInsightsUrl);
                  if (postInsightsResponse.ok) {
                    const postInsightsData = await postInsightsResponse.json();
                    testResults.postInsights = {
                      success: true,
                      postId: postId,
                      metricsCount: postInsightsData.data?.length || 0,
                      metrics: postInsightsData.data?.map(m => m.name) || [],
                      note: 'Insights de post obtenidos según documentación oficial'
                    };
                    console.log(`✅ Insights de post obtenidos:`, testResults.postInsights);
                  } else {
                    const errorText = await postInsightsResponse.text();
                    testResults.postInsights = {
                      success: false,
                      error: postInsightsResponse.status,
                      details: errorText,
                      note: 'Insights de post fallaron según documentación oficial'
                    };
                    console.error('❌ Insights de post fallaron:', postInsightsResponse.status, errorText);
                  }
                } catch (error) {
                  testResults.postInsights = { success: false, error: error.message };
                }
              }

              // Test 6: Obtener reacciones de un post (según documentación oficial)
              if (testResults.posts.firstPost) {
                try {
                  console.log('🔍 Test 6: Obteniendo reacciones de post...');
                  const postId = testResults.posts.firstPost.id;
                  const reactionsUrl = `https://graph.facebook.com/v18.0/${postId}?fields=id,message,reactions,likes&access_token=${page.access_token || channel.accessToken}`;
                  
                  const reactionsResponse = await fetch(reactionsUrl);
                  if (reactionsResponse.ok) {
                    const reactionsData = await reactionsResponse.json();
                    testResults.postReactions = {
                      success: true,
                      postId: postId,
                      hasReactions: !!reactionsData.reactions,
                      hasLikes: !!reactionsData.likes,
                      reactionsCount: reactionsData.reactions?.summary?.total_count || 0,
                      likesCount: reactionsData.likes?.summary?.total_count || 0,
                      note: 'Reacciones obtenidas según documentación oficial'
                    };
                    console.log(`✅ Reacciones obtenidas:`, testResults.postReactions);
                  } else {
                    const errorText = await reactionsResponse.text();
                    testResults.postReactions = {
                      success: false,
                      error: reactionsResponse.status,
                      details: errorText,
                      note: 'Reacciones fallaron según documentación oficial'
                    };
                  }
                } catch (error) {
                  testResults.postReactions = { success: false, error: error.message };
                }
              }

            } else {
              const errorText = await postsResponse.text();
              testResults.posts = {
                success: false,
                error: postsResponse.status,
                details: errorText,
                note: 'Posts fallaron según documentación oficial'
              };
              console.error('❌ Posts fallaron:', postsResponse.status, errorText);
            }
          } catch (error) {
            testResults.posts = { success: false, error: error.message };
          }

        } else {
          testResults.pages = {
            success: false,
            error: 'No se encontraron páginas',
            note: 'No hay páginas administradas según documentación oficial'
          };
        }
      } else {
        const errorText = await pagesResponse.text();
        testResults.pages = {
          success: false,
          error: pagesResponse.status,
          details: errorText,
          note: 'Páginas fallaron según documentación oficial'
        };
        console.error('❌ Páginas fallaron:', pagesResponse.status, errorText);
      }
    } catch (error) {
      testResults.pages = { success: false, error: error.message };
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
      documentation: {
        version: 'v18.0',
        source: 'https://developers.facebook.com/docs/insights/',
        endpoints: [
          '/me?fields=id,name',
          '/me/accounts?fields=id,name,access_token,tasks',
          '/{page-id}/insights?metric=page_impressions_unique,page_engaged_users',
          '/{page-id}/posts?fields=id,message,created_time,type',
          '/{post-id}/insights?metric=post_impressions,post_reach,post_reactions_by_type_total,post_comments,post_shares',
          '/{post-id}?fields=id,message,reactions,likes'
        ],
        note: 'Tests basados en la documentación oficial de Facebook Insights API'
      }
    });

  } catch (error) {
    console.error('❌ Error en test oficial de API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
