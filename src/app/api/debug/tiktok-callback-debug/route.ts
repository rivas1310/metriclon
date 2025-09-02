import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK CALLBACK DEBUG ===');
    
    // Simular parámetros de callback
    const mockCode = 'test_code_123';
    const mockState = 'test_state_456';
    
    console.log('Simulando callback con:');
    console.log('- Code:', mockCode);
    console.log('- State:', mockState);
    
    // Verificar variables de entorno
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    console.log('Variables de entorno:');
    console.log('- Client ID:', clientId ? 'Present' : 'Missing');
    console.log('- Client Secret:', clientSecret ? 'Present' : 'Missing');
    console.log('- Redirect URI:', redirectUri);
    
    // Verificar organización
    const organizationId = '997693ca-8304-464e-87a9-ccb22b576724';
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    console.log('Organización:', organization ? 'Found' : 'Not found');
    
    // Verificar canales existentes
    const existingChannels = await prisma.channel.findMany({
      where: { organizationId: organizationId }
    });
    
    console.log('Canales existentes:', existingChannels.length);
    
    return NextResponse.json({
      success: true,
      message: 'TikTok callback debug completed',
      environment: {
        clientId: clientId ? 'Present' : 'Missing',
        clientSecret: clientSecret ? 'Present' : 'Missing',
        redirectUri: redirectUri,
        organizationId: organizationId,
        organizationExists: organization ? true : false,
        existingChannels: existingChannels.length
      },
      recommendations: [
        '1. Verificar que el callback se ejecute después de autorizar',
        '2. Revisar logs de Vercel para errores específicos',
        '3. Verificar que TikTok redirija correctamente',
        '4. Probar con un código de autorización real'
      ]
    });
    
  } catch (error) {
    console.error('Error in TikTok callback debug:', error);
    return NextResponse.json({
      error: 'TikTok callback debug failed',
      details: error
    }, { status: 500 });
  }
}
