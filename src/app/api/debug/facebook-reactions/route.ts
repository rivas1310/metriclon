import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Obtener el token de las cookies
    const cookies = request.headers.get('cookie');
    if (!cookies) {
      return NextResponse.json({ error: 'No se encontraron cookies de sesión' }, { status: 401 });
    }

    // Buscar el token en las cookies
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: 'Token no encontrado en cookies' }, { status: 401 });
    }

    const token = tokenMatch[1];
    
    // Verificar el token y obtener el usuario
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener la organización del usuario
    const member = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true }
    });

    if (!member) {
      return NextResponse.json({ error: 'Usuario no pertenece a ninguna organización' }, { status: 404 });
    }

    const organizationId = member.organization.id;
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    console.log(`🔍 Buscando canal de Facebook para organización: ${organizationId}`);

    // Obtener el canal de Facebook
    const channel = await prisma.channel.findFirst({
      where: {
        organizationId: organizationId,
        platform: 'FACEBOOK'
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Canal de Facebook no encontrado' }, { status: 404 });
    }

    console.log(`🔍 Probando obtención de reacciones para canal ${channel.id}`);

    // Obtener páginas administradas
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${channel.accessToken}`
    );

    if (!pagesResponse.ok) {
      throw new Error('No se pudieron obtener las páginas administradas');
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
      
      console.log(`🔍 Método 1 - Posts con insights: ${postsUrl.replace(page.access_token || channel.accessToken, '[TOKEN]')}`);
      
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
        testResults.method1 = {
          success: false,
          error: postsResponse.status,
          details: await postsResponse.text()
        };
      }
    } catch (error) {
      testResults.method1 = { success: false, error: error.message };
    }

    // Método 2: Posts con reacciones directas
    try {
      const postsWithReactionsUrl = `https://graph.facebook.com/v18.0/${page.id}/posts?fields=id,message,created_time,type,reactions&limit=3&access_token=${page.access_token || channel.accessToken}`;
      
      console.log(`🔍 Método 2 - Posts con reacciones directas: ${postsWithReactionsUrl.replace(page.access_token || channel.accessToken, '[TOKEN]')}`);
      
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
        testResults.method2 = {
          success: false,
          error: reactionsResponse.status,
          details: await reactionsResponse.text()
        };
      }
    } catch (error) {
      testResults.method2 = { success: false, error: error.message };
    }

    // Método 3: Obtener reacciones de un post específico (si se proporciona postId)
    if (postId) {
      try {
        const postReactionsUrl = `https://graph.facebook.com/v18.0/${postId}?fields=id,message,reactions,likes&access_token=${page.access_token || channel.accessToken}`;
        
        console.log(`🔍 Método 3 - Post específico: ${postReactionsUrl.replace(page.access_token || channel.accessToken, '[TOKEN]')}`);
        
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
          testResults.method3 = {
            success: false,
            error: postResponse.status,
            details: await postResponse.text()
          };
        }
      } catch (error) {
        testResults.method3 = { success: false, error: error.message };
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
    console.error('❌ Error en debug de reacciones:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
