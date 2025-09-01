import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== MOVER TIKTOK A ORGANIZACIÓN CORRECTA ===');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'move') {
      console.log('Iniciando movimiento de TikTok...');
      
      // 1. Buscar TikTok en la organización incorrecta
      const wrongOrgTikTok = await prisma.channel.findFirst({
        where: {
          platform: 'TIKTOK',
          organizationId: 'ceeba04f-60c4-4162-b22d-e7469ad8da93'
        }
      });

      if (!wrongOrgTikTok) {
        console.log('No se encontró TikTok en la organización incorrecta');
        return NextResponse.json({
          success: false,
          message: 'No se encontró TikTok en la organización incorrecta'
        });
      }

      console.log('TikTok encontrado en organización incorrecta:', wrongOrgTikTok.id);

      // 2. Mover TikTok a la organización correcta
      const movedTikTok = await prisma.channel.update({
        where: {
          id: wrongOrgTikTok.id
        },
        data: {
          organizationId: '997693ca-8304-464e-87a9-ccb22b576724'
        }
      });

      console.log('✅ TikTok movido exitosamente:', movedTikTok.id);

      // 3. Verificar el estado después del movimiento
      const correctOrgTikTok = await prisma.channel.findFirst({
        where: {
          platform: 'TIKTOK',
          organizationId: '997693ca-8304-464e-87a9-ccb22b576724'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'TikTok movido exitosamente a la organización correcta',
        movedChannel: movedTikTok,
        newLocation: correctOrgTikTok,
        oldOrganizationId: 'ceeba04f-60c4-4162-b22d-e7469ad8da93',
        newOrganizationId: '997693ca-8304-464e-87a9-ccb22b576724'
      });

    } else if (action === 'delete') {
      console.log('Eliminando TikTok de la organización incorrecta...');
      
      // Eliminar TikTok de la organización incorrecta
      const deletedTikTok = await prisma.channel.deleteMany({
        where: {
          platform: 'TIKTOK',
          organizationId: 'ceeba04f-60c4-4162-b22d-e7469ad8da93'
        }
      });

      console.log('✅ TikTok eliminado de la organización incorrecta:', deletedTikTok.count);

      return NextResponse.json({
        success: true,
        message: 'TikTok eliminado de la organización incorrecta',
        deletedCount: deletedTikTok.count
      });

    } else {
      return NextResponse.json({
        success: false,
        message: 'Acción requerida: use ?action=move o ?action=delete',
        availableActions: ['move', 'delete']
      });
    }

  } catch (error) {
    console.error('Error moviendo TikTok:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
