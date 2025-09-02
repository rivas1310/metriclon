import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK CALLBACK DIRECT TEST ===');
    
    // Simular parámetros de callback real
    const mockCode = 'real_authorization_code_123';
    const mockState = '5xi9aekl32w'; // State del test anterior
    
    console.log('Simulando callback directo:');
    console.log('- Code:', mockCode);
    console.log('- State:', mockState);
    
    // Construir URL de callback
    const callbackUrl = new URL('https://metriclon.vercel.app/api/oauth/callback/tiktok/');
    callbackUrl.searchParams.append('code', mockCode);
    callbackUrl.searchParams.append('state', mockState);
    
    console.log('URL de callback construida:', callbackUrl.toString());
    
    return NextResponse.json({
      success: true,
      message: 'TikTok callback direct test completed',
      callback: {
        url: callbackUrl.toString(),
        code: mockCode,
        state: mockState
      },
      instructions: [
        '1. Copia la URL de callback',
        '2. Pégala en tu navegador',
        '3. Verifica si se ejecuta el callback',
        '4. Revisa los logs de Vercel'
      ]
    });
    
  } catch (error) {
    console.error('Error in TikTok callback direct test:', error);
    return NextResponse.json({
      error: 'TikTok callback direct test failed',
      details: error
    }, { status: 500 });
  }
}
