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

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Obtener canal de Facebook
    const channel = await prisma.channel.findFirst({
      where: {
        organizationId,
        platform: 'FACEBOOK',
        isActive: true,
      },
    });

    if (!channel) {
      return NextResponse.json({
        error: 'No se encontró un canal activo de Facebook'
      });
    }

    const results: any = {
      channel: {
        id: channel.id,
        platform: channel.platform,
        name: channel.name,
        externalId: channel.externalId,
      },
      availableFields: {}
    };

    // Probar campos básicos para perfiles personales
    const basicFields = [
      'id,name',
      'id,name,email',
      'id,name,first_name,last_name', 
      'id,name,picture',
      'id,name,locale',
      'id,name,timezone',
      'id,name,verified'
    ];

    for (const fields of basicFields) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=${fields}&access_token=${channel.accessToken}`
        );
        
        if (response.ok) {
          const data = await response.json();
          results.availableFields[fields] = data;
        } else {
          const errorText = await response.text();
          results.availableFields[fields] = {
            error: `HTTP ${response.status}`,
            details: errorText
          };
        }
      } catch (error) {
        results.availableFields[fields] = {
          error: 'Network error',
          details: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Probar acceso a posts personales (si está permitido)
    try {
      const postsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/posts?fields=id,message,created_time,story&limit=5&access_token=${channel.accessToken}`
      );
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        results.availableFields['posts'] = postsData;
      } else {
        const errorText = await postsResponse.text();
        results.availableFields['posts'] = {
          error: `HTTP ${postsResponse.status}`,
          details: errorText
        };
      }
    } catch (error) {
      results.availableFields['posts'] = {
        error: 'Network error',
        details: error instanceof Error ? error.message : String(error)
      };
    }

    // Probar acceso a fotos
    try {
      const photosResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/photos?fields=id,name,created_time&limit=5&access_token=${channel.accessToken}`
      );
      
      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        results.availableFields['photos'] = photosData;
      } else {
        const errorText = await photosResponse.text();
        results.availableFields['photos'] = {
          error: `HTTP ${photosResponse.status}`,
          details: errorText
        };
      }
    } catch (error) {
      results.availableFields['photos'] = {
        error: 'Network error',
        details: error instanceof Error ? error.message : String(error)
      };
    }

    // Probar si puede acceder a información de amigos (público)
    try {
      const friendsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/friends?access_token=${channel.accessToken}`
      );
      
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        results.availableFields['friends'] = friendsData;
      } else {
        const errorText = await friendsResponse.text();
        results.availableFields['friends'] = {
          error: `HTTP ${friendsResponse.status}`,
          details: errorText
        };
      }
    } catch (error) {
      results.availableFields['friends'] = {
        error: 'Network error',
        details: error instanceof Error ? error.message : String(error)
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error en test de Facebook personal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

