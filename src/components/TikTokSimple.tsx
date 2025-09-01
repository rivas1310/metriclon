import React, { useState } from 'react';

interface TikTokSimpleProps {
  organizationId: string;
}

export default function TikTokSimple({ organizationId }: TikTokSimpleProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectTikTok = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch('/api/oauth/tiktok');
      if (!response.ok) {
        throw new Error('Error iniciando conexión con TikTok');
      }
      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error conectando TikTok:', error);
      alert('Error conectando TikTok: ' + error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">🎵 TikTok</h3>
        <p className="text-sm text-gray-500 mt-1">Conecta tu cuenta de TikTok</p>
      </div>
      <div className="p-6">
        <div className="text-center py-8 text-gray-500 mb-6">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Conecta TikTok</p>
          <p className="text-gray-500">Vincula tu cuenta para acceder a métricas</p>
        </div>
        
        <button
          onClick={connectTikTok}
          disabled={isConnecting}
          className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Conectando...' : 'Conectar TikTok'}
        </button>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">¿Qué puedes hacer?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ver métricas de seguidores y engagement</li>
            <li>• Analizar rendimiento de videos</li>
            <li>• Gestionar contenido desde un panel centralizado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
