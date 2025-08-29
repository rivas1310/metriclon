'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('Instagram Auth - Parámetros recibidos:');
    console.log('Code:', !!code);
    console.log('State:', !!state);
    console.log('Error:', error);

    if (error) {
      console.log('Instagram Auth - Error:', error);
      router.push('/dashboard?error=instagram_oauth_error&message=' + error);
      return;
    }

    if (!code || !state) {
      console.log('Instagram Auth - Faltan parámetros');
      router.push('/dashboard?error=instagram_oauth_missing_params');
      return;
    }

    // Redirigir al callback de la API
    const callbackUrl = `/api/oauth/callback/instagram?code=${code}&state=${state}`;
    console.log('Instagram Auth - Redirigiendo a:', callbackUrl);
    
    // Usar window.location para redirección completa
    window.location.href = callbackUrl;
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Conectando Instagram...</h1>
        <p className="text-gray-600">Por favor espera mientras procesamos tu autorización.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
