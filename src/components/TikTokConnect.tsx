import React, { useState } from 'react';
import { Video, ExternalLink, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface TikTokConnectProps {
  organizationId: string;
  onConnect?: () => void;
}

export default function TikTokConnect({ organizationId, onConnect }: TikTokConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const connectTikTok = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      setErrorMessage('');

      // Iniciar el flujo de OAuth de TikTok
      const response = await fetch('/api/oauth/tiktok');
      if (!response.ok) {
        throw new Error('Error iniciando conexión con TikTok');
      }

      const data = await response.json();
      
      // Redirigir al usuario a TikTok para autorización
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('Error conectando TikTok:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectTikTok = async () => {
    try {
      // Implementar lógica de desconexión
      setConnectionStatus('idle');
      if (onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error('Error desconectando TikTok:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-black rounded-lg">
          <Video className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Conectar TikTok</h3>
          <p className="text-gray-600">Vincula tu cuenta de TikTok para analizar métricas y gestionar contenido</p>
        </div>
      </div>

      {/* Estado de conexión */}
      {connectionStatus === 'idle' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-700">No conectado</p>
              <p className="text-sm text-gray-500">Tu cuenta de TikTok no está conectada a Metriclon</p>
            </div>
          </div>
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-blue-400 mr-3 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-700">Conectando...</p>
              <p className="text-sm text-blue-500">Redirigiendo a TikTok para autorización</p>
            </div>
          </div>
        </div>
      )}

      {connectionStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-700">Conectado exitosamente</p>
              <p className="text-sm text-green-500">Tu cuenta de TikTok está conectada a Metriclon</p>
            </div>
          </div>
        </div>
      )}

      {connectionStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-700">Error de conexión</p>
              <p className="text-sm text-red-500">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex space-x-4">
        {connectionStatus === 'idle' && (
          <button
            onClick={connectTikTok}
            disabled={isConnecting}
            className="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="h-5 w-5 mr-2" />
            {isConnecting ? 'Conectando...' : 'Conectar TikTok'}
          </button>
        )}

        {connectionStatus === 'success' && (
          <button
            onClick={disconnectTikTok}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Desconectar
          </button>
        )}

        {connectionStatus === 'error' && (
          <button
            onClick={connectTikTok}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">¿Qué puedes hacer con TikTok conectado?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Ver métricas de seguidores y engagement</li>
          <li>• Analizar rendimiento de videos</li>
          <li>• Gestionar contenido desde un panel centralizado</li>
          <li>• Publicar videos directamente desde Metriclon</li>
          <li>• Obtener insights detallados de audiencia</li>
        </ul>
      </div>

      {/* Enlaces útiles */}
      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
        <a
          href="https://developers.tiktok.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:text-gray-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Documentación de TikTok
        </a>
        <a
          href="/terms"
          className="hover:text-gray-700 transition-colors"
        >
          Términos de Servicio
        </a>
        <a
          href="/privacy"
          className="hover:text-gray-700 transition-colors"
        >
          Política de Privacidad
        </a>
      </div>
    </div>
  );
}
