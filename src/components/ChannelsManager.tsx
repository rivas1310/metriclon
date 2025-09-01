'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Link, 
  Settings, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Users,
  TrendingUp,
  MessageSquare,
  Eye,
  Heart
} from 'lucide-react';

interface ChannelsManagerProps {
  organizationId: string;
}

interface Channel {
  id: string;
  platform: string;
  name: string;
  isConnected: boolean;
  followers?: number;
  engagement?: number;
  reach?: number;
  posts?: number;
  lastSync?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  meta?: any;
}

interface PlatformConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
  isAvailable: boolean;
}

const PLATFORMS: PlatformConfig[] = [
  {
    name: 'Instagram',
    icon: <Instagram className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-500',
    description: 'Comparte fotos y videos con tu audiencia',
    features: ['Posts de imagen y video', 'Stories', 'Reels', 'IGTV', 'Analytics detallados'],
    isAvailable: true
  },
  {
    name: 'Facebook',
    icon: <Facebook className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
    description: 'Conecta con tu comunidad en Facebook',
    features: ['Posts de texto e imagen', 'Videos', 'Stories', 'Grupos', 'Páginas'],
    isAvailable: true
  },
  {
    name: 'LinkedIn',
    icon: <Linkedin className="h-6 w-6" />,
    color: 'from-blue-600 to-blue-700',
    description: 'Contenido profesional para tu red',
    features: ['Posts de texto', 'Artículos', 'Videos', 'Presentaciones', 'Networking'],
    isAvailable: true
  },
  {
    name: 'Twitter',
    icon: <Twitter className="h-6 w-6" />,
    color: 'from-blue-400 to-blue-500',
    description: 'Comparte pensamientos en tiempo real',
    features: ['Tweets', 'Hilos', 'Imágenes', 'Videos', 'Espacios'],
    isAvailable: true
  },
  {
    name: 'YouTube',
    icon: <Youtube className="h-6 w-6" />,
    color: 'from-red-500 to-red-600',
    description: 'Crea y comparte contenido de video',
    features: ['Videos', 'Shorts', 'Live streaming', 'Playlists', 'Analytics'],
    isAvailable: true
  },
  {
    name: 'TikTok',
    icon: <div className="h-6 w-6 bg-black rounded flex items-center justify-center"><span className="text-white text-sm font-bold">T</span></div>,
    color: 'from-black to-gray-800',
    description: 'Crea y comparte videos cortos virales',
    features: ['Videos cortos', 'Tendencias', 'Duets', 'Stitches', 'Analytics de engagement'],
    isAvailable: true
  }
];

export function ChannelsManager({ organizationId }: ChannelsManagerProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const queryClient = useQueryClient();

  // Obtener canales existentes
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['channels', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/channels`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!organizationId,
  });

  // Obtener métricas de los canales
  const { data: channelsMetrics } = useQuery({
    queryKey: ['channels-metrics', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/channels/metrics`);
      if (response.ok) {
        return response.json();
      }
      return {};
    },
    enabled: !!organizationId,
  });

  // Mutación para conectar canal
  const connectChannelMutation = useMutation({
    mutationFn: async (platform: string) => {
      // Para TikTok, usar el endpoint específico
      if (platform.toLowerCase() === 'tiktok') {
        const response = await fetch('/api/oauth/tiktok');
        if (!response.ok) throw new Error('Error al conectar TikTok');
        return response.json();
      }
      
      // Para otras plataformas, usar el endpoint genérico (si existe)
      const response = await fetch('/api/oauth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, organizationId }),
      });
      if (!response.ok) throw new Error('Error al conectar');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('OAuth iniciado:', data);
      // Redirigir al usuario a la URL de autorización
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
      setShowConnectionModal(false);
    },
    onError: (error) => {
      console.error('Error iniciando OAuth:', error);
      alert('Error al iniciar la conexión. Por favor, intenta de nuevo.');
    },
  });

  // Mutación para desconectar canal
  const disconnectChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      // Necesitamos organizationId para la nueva ruta
      const response = await fetch(`/api/organizations/${organizationId}/channels/${channelId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al desconectar');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', organizationId] });
    },
  });

  // Mutación para sincronizar canal
  const syncChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/organizations/${organizationId}/channels/${channelId}/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error al sincronizar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['channels-metrics', organizationId] });
    },
  });

  const handleConnect = (platform: string) => {
    setSelectedPlatform(platform);
    setShowConnectionModal(true);
  };

  const handleDisconnect = (channelId: string) => {
    if (confirm('¿Estás seguro de que quieres desconectar este canal?')) {
      disconnectChannelMutation.mutate(channelId);
    }
  };

  const handleSync = (channelId: string) => {
    syncChannelMutation.mutate(channelId);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'youtube': return <Youtube className="h-5 w-5" />;
      case 'tiktok': return <div className="h-5 w-5 bg-black rounded flex items-center justify-center"><span className="text-white text-xs font-bold">T</span></div>;
      default: return <Link className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'from-purple-500 to-pink-500';
      case 'facebook': return 'from-blue-500 to-blue-600';
      case 'linkedin': return 'from-blue-600 to-blue-700';
      case 'twitter': return 'from-blue-400 to-blue-500';
      case 'youtube': return 'from-red-500 to-red-600';
      case 'tiktok': return 'from-black to-gray-800';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getConnectionStatus = (channel: Channel) => {
    if (!channel.isConnected) return { status: 'disconnected', text: 'Desconectado', color: 'text-red-600' };
    
    if (channel.expiresAt && new Date(channel.expiresAt) < new Date()) {
      return { status: 'expired', text: 'Token expirado', color: 'text-orange-600' };
    }
    
    return { status: 'connected', text: 'Conectado', color: 'text-green-600' };
  };

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Canales</h2>
            <p className="text-gray-600">Conecta y gestiona tus redes sociales</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {channels?.filter((c: Channel) => c.isConnected).length || 0} de {PLATFORMS.length} canales conectados
            </p>
          </div>
        </div>
      </div>

      {/* Canales conectados */}
      {channels && channels.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Canales Conectados</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {channels.map((channel: Channel) => {
                const connectionStatus = getConnectionStatus(channel);
                const metrics = channelsMetrics?.[channel.id] || {};
                
                return (
                  <div key={channel.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${getPlatformColor(channel.platform)}`}>
                          {getPlatformIcon(channel.platform)}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{channel.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{channel.platform}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              connectionStatus.status === 'connected' ? 'bg-green-100 text-green-800' :
                              connectionStatus.status === 'expired' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {connectionStatus.status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {connectionStatus.status === 'expired' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {connectionStatus.status === 'disconnected' && <XCircle className="h-3 w-3 mr-1" />}
                              {connectionStatus.text}
                            </span>
                            {channel.lastSync && (
                              <span className="text-xs text-gray-500">
                                Última sincronización: {new Date(channel.lastSync).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSync(channel.id)}
                          disabled={syncChannelMutation.isPending}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncChannelMutation.isPending ? 'animate-spin' : ''}`} />
                          Sincronizar
                        </button>
                        <button
                          onClick={() => handleDisconnect(channel.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          Desconectar
                        </button>
                      </div>
                    </div>

                    {/* Métricas del canal */}
                    {channel.isConnected && (
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">Seguidores</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {metrics.followers?.toLocaleString() || channel.followers?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">Alcance</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {metrics.reach?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
                            <Heart className="h-4 w-4" />
                            <span className="text-sm">Engagement</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {metrics.engagement?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">Posts</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {metrics.posts || channel.posts || '0'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Plataformas disponibles */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Conectar Nuevas Plataformas</h3>
          <p className="text-sm text-gray-500">Selecciona las redes sociales que quieres conectar</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORMS.map((platform) => {
              const isConnected = channels?.some((c: Channel) => 
                c.platform.toLowerCase() === platform.name.toLowerCase() && c.isConnected
              );
              
              return (
                <div
                  key={platform.name}
                  className={`border-2 rounded-lg p-6 transition-all ${
                    isConnected
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${platform.color}`}>
                      {platform.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{platform.name}</h4>
                      {isConnected && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectado
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                  
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Características:</h5>
                    <ul className="space-y-1">
                      {platform.features.map((feature, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {!isConnected ? (
                    <button
                      onClick={() => handleConnect(platform.name.toLowerCase())}
                      disabled={!platform.isAvailable}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        platform.isAvailable
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {platform.isAvailable ? 'Conectar' : 'Próximamente'}
                    </button>
                  ) : (
                    <div className="text-center">
                      <span className="text-sm text-green-600 font-medium">✓ Conectado</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

             {/* Modal de conexión */}
       {showConnectionModal && selectedPlatform && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <div className="flex items-center space-x-3 mb-4">
               <div className={`p-2 rounded-lg bg-gradient-to-r ${getPlatformColor(selectedPlatform)}`}>
                 {getPlatformIcon(selectedPlatform)}
               </div>
               <h3 className="text-lg font-medium text-gray-900">
                 Conectar {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
               </h3>
             </div>
             
             <p className="text-gray-600 mb-6">
               Serás redirigido a {selectedPlatform} para autorizar el acceso a tu cuenta.
               {connectChannelMutation.isPending && (
                 <span className="block mt-2 text-blue-600 font-medium">
                   Iniciando conexión...
                 </span>
               )}
             </p>
             
             <div className="flex space-x-3">
               <button
                 onClick={() => setShowConnectionModal(false)}
                 disabled={connectChannelMutation.isPending}
                 className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
               >
                 Cancelar
               </button>
               <button
                 onClick={() => connectChannelMutation.mutate(selectedPlatform)}
                 disabled={connectChannelMutation.isPending}
                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
               >
                 {connectChannelMutation.isPending ? (
                   <div className="flex items-center justify-center">
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     Conectando...
                   </div>
                 ) : (
                   'Conectar'
                 )}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
