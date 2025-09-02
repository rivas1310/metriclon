import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK CALLBACK TEST ===');
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('Test Parameters:');
    console.log('- Code:', code);
    console.log('- State:', state);
    console.log('- Error:', error);
    
    return NextResponse.json({
      success: true,
      message: 'Callback test endpoint working',
      parameters: {
        code: code ? 'Present' : 'Missing',
        state: state ? 'Present' : 'Missing',
        error: error || 'None'
      }
    });
    
  } catch (error) {
    console.error('Error in callback test:', error);
    return NextResponse.json({
      error: 'Callback test failed',
      details: error
    }, { status: 500 });
  }
}