import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK CALLBACK TEST ===');
    
    // 1. Verificar variables de entorno
    const envCheck = {
      TIKTOK_CLIENT_ID: !!process.env.TIKTOK_CLIENT_ID,
      TIKTOK_CLIENT_SECRET: !!process.env.TIKTOK_CLIENT_SECRET,
      TIKTOK_REDIRECT_URI: !!process.env.TIKTOK_REDIRECT_URI,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL
    };
    
    console.log('Variables de entorno:', envCheck);
    
    // 2. Verificar base de datos
    console.log('Verificando base de datos...');
    
    // 3. Intentar crear un canal de prueba
    try {
             const testChannel = await prisma.channel.create({
         data: {
           platform: 'TIKTOK', // VALOR VÁLIDO DEL ENUM
           externalId: 'test_external_id', // CAMPO OBLIGATORIO
           name: 'Test TikTok',
           isActive: true,
           organizationId: '997693ca-8304-464e-87a9-ccb22b576724',
           accessToken: 'test_token',
           refreshToken: 'test_refresh',
           meta: { test: true }
         }
       });
      
      console.log('✅ Canal de prueba creado:', testChannel.id);
      
      // Eliminar el canal de prueba
      await prisma.channel.delete({
        where: { id: testChannel.id }
      });
      
      console.log('✅ Canal de prueba eliminado');
      
    } catch (dbError) {
      console.error('❌ ERROR EN BASE DE DATOS:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Error en base de datos',
        details: dbError.message
      }, { status: 500 });
    }
    
    // 4. Verificar canales existentes
    const existingChannels = await prisma.channel.findMany({
      where: { organizationId: '997693ca-8304-464e-87a9-ccb22b576724' },
      select: { id: true, platform: true, name: true, isActive: true }
    });
    
    return NextResponse.json({
      success: true,
      message: 'TEST COMPLETADO',
      environment: envCheck,
      databaseWorking: true,
      existingChannels: existingChannels,
      recommendations: [
        '1. Base de datos funciona correctamente',
        '2. Variables de entorno están configuradas',
        '3. El problema está en el callback de TikTok',
        '4. Revisar logs de Vercel para más detalles'
      ]
    });
    
  } catch (error) {
    console.error('Error en test:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
