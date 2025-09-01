import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST TIKTOK CONNECTION ===');
    
    // 1. Verificar variables de entorno
    const envCheck = {
      TIKTOK_CLIENT_ID: !!process.env.TIKTOK_CLIENT_ID,
      TIKTOK_CLIENT_SECRET: !!process.env.TIKTOK_CLIENT_SECRET,
      TIKTOK_REDIRECT_URI: !!process.env.TIKTOK_REDIRECT_URI,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL
    };
    
    console.log('Variables de entorno:', envCheck);
    
    // 2. Verificar canales existentes
    const existingChannels = await prisma.channel.findMany({
      where: { platform: 'TIKTOK' },
      select: {
        id: true,
        platform: true,
        name: true,
        organizationId: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('Canales de TikTok existentes:', existingChannels);
    
    // 3. Verificar organización correcta
    const correctOrgId = '997693ca-8304-464e-87a9-ccb22b576724';
    const correctOrgChannels = await prisma.channel.findMany({
      where: { organizationId: correctOrgId },
      select: {
        id: true,
        platform: true,
        name: true,
        isActive: true
      }
    });
    
    console.log('Canales en organización correcta:', correctOrgChannels);
    
    // 4. Generar URL de prueba
    const testAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    testAuthUrl.searchParams.append('client_key', process.env.TIKTOK_CLIENT_ID || '');
    testAuthUrl.searchParams.append('scope', 'user.info.basic,video.upload,video.publish');
    testAuthUrl.searchParams.append('response_type', 'code');
    testAuthUrl.searchParams.append('redirect_uri', process.env.TIKTOK_REDIRECT_URI || '');
    testAuthUrl.searchParams.append('state', `tiktok_auth_${correctOrgId}`);
    
    return NextResponse.json({
      success: true,
      message: 'TEST TIKTOK CONNECTION COMPLETADO',
      environment: envCheck,
      existingTikTokChannels: existingChannels,
      correctOrgChannels: correctOrgChannels,
      correctOrgId: correctOrgId,
      testAuthUrl: testAuthUrl.toString(),
      recommendations: [
        '1. Verificar que todas las variables de entorno estén configuradas',
        '2. Conectar TikTok desde la organización correcta',
        '3. Usar la URL de prueba generada para verificar el flujo'
      ]
    });
    
  } catch (error) {
    console.error('Error en test TikTok connection:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
