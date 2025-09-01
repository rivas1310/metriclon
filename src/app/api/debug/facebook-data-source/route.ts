import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando fuente de datos de Facebook...');

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

    const analysis = {};

    // Análisis 1: Verificar si hay posts almacenados en la base de datos
    try {
      console.log('🔍 Verificando posts almacenados en la base de datos...');
      
      // Buscar posts en la tabla PostMetric (si existe)
      const storedPosts = await prisma.postMetric.findMany({
        where: {
          channelId: channel.id
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      analysis.storedPosts = {
        found: storedPosts.length > 0,
        count: storedPosts.length,
        posts: storedPosts.map(post => ({
          id: post.id,
          externalId: post.externalId,
          platform: post.platform,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        }))
      };

      console.log(`✅ Posts almacenados: ${storedPosts.length} encontrados`);
    } catch (error) {
      analysis.storedPosts = {
        found: false,
        error: error.message,
        note: 'Tabla PostMetric no existe o hay error'
      };
    }

    // Análisis 2: Verificar el token actual
    analysis.currentToken = {
      length: channel.accessToken.length,
      preview: channel.accessToken.substring(0, 20) + '...',
      isPlaceholder: channel.accessToken.includes('ejemplo') || channel.accessToken.includes('placeholder'),
      lastUpdated: channel.updatedAt
    };

    // Análisis 3: Intentar obtener datos reales de Facebook
    try {
      console.log('🔍 Intentando obtener datos reales de Facebook...');
      
      // Test básico del token
      const meResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${channel.accessToken}`
      );

      if (meResponse.ok) {
        const meData = await meResponse.json();
        analysis.facebookAPI = {
          basicAccess: true,
          userData: meData,
          note: 'Token básico funciona'
        };
        console.log(`✅ Acceso básico a Facebook funciona:`, meData);
      } else {
        const errorText = await meResponse.text();
        analysis.facebookAPI = {
          basicAccess: false,
          error: meResponse.status,
          details: errorText,
          note: 'Token básico falla'
        };
        console.error('❌ Acceso básico a Facebook falla:', meResponse.status, errorText);
      }
    } catch (error) {
      analysis.facebookAPI = {
        basicAccess: false,
        error: error.message,
        note: 'Error al conectar con Facebook'
      };
    }

    // Análisis 4: Verificar si hay datos en otras tablas
    try {
      console.log('🔍 Verificando otras fuentes de datos...');
      
      // Buscar en la tabla Channel para ver si hay datos adicionales
      const channelDetails = await prisma.channel.findUnique({
        where: { id: channel.id },
        select: {
          id: true,
          name: true,
          platform: true,
          accessToken: true,
          createdAt: true,
          updatedAt: true
        }
      });

      analysis.channelDetails = channelDetails;
    } catch (error) {
      analysis.channelDetails = { error: error.message };
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        platform: channel.platform
      },
      analysis,
      conclusion: analysis.storedPosts.found ? 
        'Los posts que ves probablemente vienen de datos almacenados anteriormente, no del token actual' :
        'Los posts que ves pueden venir de otra fuente o ser datos simulados',
      recommendation: 'Necesitamos verificar si el token actual puede obtener datos reales de Facebook'
    });

  } catch (error) {
    console.error('❌ Error al verificar fuente de datos:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
