'use client';

import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface Connection {
  id: string;
  platform: string;
  name: string;
  isActive: boolean;
  lastSync?: string;
  followers?: number;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
}

interface PlatformConnectionsProps {
  connections?: Connection[];
}

export function PlatformConnections({ connections = [] }: PlatformConnectionsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-gray-400" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'expired':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      INSTAGRAM: '📷',
      FACEBOOK: '📘',
      LINKEDIN: '💼',
      TWITTER: '🐦',
      TIKTOK: '🎵',
      YOUTUBE: '📺',
    };
    return icons[platform] || '🌐';
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      INSTAGRAM: 'from-purple-400 to-pink-600',
      FACEBOOK: 'from-blue-500 to-blue-700',
      LINKEDIN: 'from-blue-600 to-blue-800',
      TWITTER: 'from-blue-400 to-blue-600',
      TIKTOK: 'from-pink-500 to-red-500',
      YOUTUBE: 'from-red-500 to-red-700',
    };
    return colors[platform] || 'from-gray-400 to-gray-600';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'expired':
        return 'Token Expirado';
      case 'error':
        return 'Error de Conexión';
      default:
        return 'Desconocido';
    }
  };

  if (connections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conexiones de Plataformas</h3>
        <div className="text-center py-8">
          <Wifi className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No hay plataformas conectadas</p>
          <p className="text-sm text-gray-400">Conecta tus redes sociales para empezar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Conexiones de Plataformas</h3>
        <button className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700">
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="space-y-3">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(connection.status)}`}
          >
            <div className="flex items-center space-x-3">
              {/* Icono de plataforma */}
              <div className={`w-8 h-8 bg-gradient-to-r ${getPlatformColor(connection.platform)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                {getPlatformIcon(connection.platform)}
              </div>

              {/* Información de la conexión */}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{connection.name}</span>
                  {getStatusIcon(connection.status)}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{getStatusText(connection.status)}</span>
                  {connection.followers && (
                    <span>{connection.followers.toLocaleString()} seguidores</span>
                  )}
                  {connection.lastSync && (
                    <span>Última sincronización: {new Date(connection.lastSync).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center space-x-2">
              {connection.status === 'connected' && (
                <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                  Ver Métricas
                </button>
              )}
              {connection.status === 'disconnected' && (
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Conectar
                </button>
              )}
              {connection.status === 'expired' && (
                <button className="text-xs text-yellow-600 hover:text-yellow-700 font-medium">
                  Renovar
                </button>
              )}
              {connection.status === 'error' && (
                <button className="text-xs text-red-600 hover:text-red-700 font-medium">
                  Reintentar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de conexiones */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {connections.filter(c => c.status === 'connected').length} de {connections.length} conectadas
          </span>
          <span className="text-gray-500">
            {((connections.filter(c => c.status === 'connected').length / connections.length) * 100).toFixed(0)}% activas
          </span>
        </div>
      </div>
    </div>
  );
}
