import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const platform = searchParams.get('platform'); // 'facebook' o 'instagram'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Obtener canal específico para test
    const channel = await prisma.channel.findFirst({
      where: {
        organizationId,
        platform: platform?.toUpperCase() as any,
        isActive: true,
      },
    });

    if (!channel) {
      return NextResponse.json({
        error: `No se encontró un canal activo de ${platform}`,
        organizationId,
        platform: platform?.toUpperCase(),
      });
    }

    const results: any = {
      channel: {
        id: channel.id,
        platform: channel.platform,
        name: channel.name,
        hasAccessToken: !!channel.accessToken,
        tokenLength: channel.accessToken?.length || 0,
      },
      apiTests: {}
    };

    // Test API calls dependiendo de la plataforma
    if (channel.platform === 'FACEBOOK') {
      // Test Facebook API
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${channel.externalId}?fields=id,name,followers_count,fan_count&access_token=${channel.accessToken}`
        );
        
        if (response.ok) {
          results.apiTests.basicInfo = await response.json();
        } else {
          const errorText = await response.text();
          results.apiTests.basicInfo = {
            error: `HTTP ${response.status}`,
            details: errorText
          };
        }
      } catch (error) {
        results.apiTests.basicInfo = {
          error: 'Network error',
          details: error instanceof Error ? error.message : String(error)
        };
      }

      // Test Facebook Insights
      try {
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${channel.externalId}/insights?metric=page_impressions&period=day&since=2024-01-01&until=2024-01-31&access_token=${channel.accessToken}`
        );
        
        if (insightsResponse.ok) {
          results.apiTests.insights = await insightsResponse.json();
        } else {
          const errorText = await insightsResponse.text();
          results.apiTests.insights = {
            error: `HTTP ${insightsResponse.status}`,
            details: errorText
          };
        }
      } catch (error) {
        results.apiTests.insights = {
          error: 'Network error',
          details: error instanceof Error ? error.message : String(error)
        };
      }

    } else if (channel.platform === 'INSTAGRAM') {
      // Test Instagram API
      try {
        const response = await fetch(
          `https://graph.instagram.com/${channel.externalId}?fields=id,username,followers_count,media_count,account_type&access_token=${channel.accessToken}`
        );
        
        if (response.ok) {
          results.apiTests.basicInfo = await response.json();
        } else {
          const errorText = await response.text();
          results.apiTests.basicInfo = {
            error: `HTTP ${response.status}`,
            details: errorText
          };
        }
      } catch (error) {
        results.apiTests.basicInfo = {
          error: 'Network error',
          details: error instanceof Error ? error.message : String(error)
        };
      }

      // Test Instagram Media
      try {
        const mediaResponse = await fetch(
          `https://graph.instagram.com/${channel.externalId}/media?fields=id,caption,media_type,timestamp&limit=5&access_token=${channel.accessToken}`
        );
        
        if (mediaResponse.ok) {
          results.apiTests.media = await mediaResponse.json();
        } else {
          const errorText = await mediaResponse.text();
          results.apiTests.media = {
            error: `HTTP ${mediaResponse.status}`,
            details: errorText
          };
        }
      } catch (error) {
        results.apiTests.media = {
          error: 'Network error',
          details: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error en test de API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

