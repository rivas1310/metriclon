import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Aumentar el límite de tamaño de archivo para APIs de TikTok
  if (request.nextUrl.pathname.startsWith('/api/tiktok/')) {
    // Configurar límite de 20MB para APIs de TikTok
    const response = NextResponse.next();
    response.headers.set('max-body-size', '20MB');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/tiktok/:path*',
    '/api/posts/publish',
  ],
};
