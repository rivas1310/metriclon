'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Calendar } from '@/components/Calendar';
import { CreatePostModal } from '@/components/CreatePostModal';
import { Analytics } from '@/components/Analytics';
import { ChannelsManager } from '@/components/ChannelsManager';
import { NotificationsManager } from '@/components/NotificationsManager';
// import { TikTokConnect } from '@/components/TikTokConnect';
// import { TikTokSimple } from '@/components/TikTokSimple';
import TikTokVideoUpload from './TikTokVideoUpload';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Plus, 
  Settings, 
  LogOut, 
  Users, 
  TrendingUp,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  MessageSquare,
  Heart,
  Share2,
  Eye,
  ChevronDown,
  Bell
} from 'lucide-react';

interface Channel {
  id: string;
  platform: string;
  name: string;
  isConnected: boolean;
  followers?: number;
}

interface Post {
  id: string;
  caption?: string;
  platforms?: string[];
  scheduledAt?: string;
  scheduledFor?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'PUBLISHING' | 'CANCELLED';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export function DashboardClient() {
  const { user, logout, selectedOrganization, setSelectedOrganization } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showOrganizationDropdown, setShowOrganizationDropdown] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Verificar parámetros de URL para mostrar mensajes de estado
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const platform = urlParams.get('platform');

    if (success === 'facebook_connected') {
      setStatusMessage({ type: 'success', message: '¡Facebook conectado exitosamente!' });
      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error && platform) {
      setStatusMessage({ type: 'error', message: `Error al conectar ${platform}: ${error}` });
      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Obtener datos de la organización seleccionada
  const { data: organizationData } = useQuery({
    queryKey: ['organization', selectedOrganization],
    queryFn: async () => {
      if (!selectedOrganization) return null;
      const response = await fetch(`/api/organizations/${selectedOrganization}`);
      if (response.ok) {
        return response.json();
      }
      return null;
    },
    enabled: !!selectedOrganization,
  });

  // Obtener canales de la organización
  const { data: channelsData } = useQuery({
    queryKey: ['channels', selectedOrganization],
    queryFn: async () => {
      if (!selectedOrganization) return [];
      const response = await fetch(`/api/organizations/${selectedOrganization}/channels`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!selectedOrganization,
  });

  // Obtener métricas de la organización
  const { data: metricsData } = useQuery({
    queryKey: ['metrics', selectedOrganization],
    queryFn: async () => {
      if (!selectedOrganization) return null;
      const response = await fetch(`/api/organizations/${selectedOrganization}/channels/metrics`);
      if (response.ok) {
        return response.json();
      }
      return null;
    },
    enabled: !!selectedOrganization,
  });

  // Obtener posts programados para el calendario
  const { data: scheduledPosts } = useQuery({
    queryKey: ['scheduled-posts', selectedOrganization],
    queryFn: async () => {
      if (!selectedOrganization) return [];
      const response = await fetch(`/api/posts?organizationId=${selectedOrganization}&status=scheduled`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!selectedOrganization,
  });

  // Mock data para posts (luego se reemplazará con datos reales)
  const mockPosts: Post[] = [
    {
      id: '1',
      caption: '¡Hola! Hoy rescatamos a este pequeño gatito que necesita un hogar amoroso. ¿Alguien puede ayudarnos? 🐱❤️',
      platforms: ['instagram'],
      scheduledFor: '2024-01-15T10:00:00Z',
              status: 'SCHEDULED',
      engagement: { likes: 45, comments: 12, shares: 8, views: 120 }
    },
    {
      id: '2',
      caption: 'Consejos para cuidar a tu gato: siempre mantén agua fresca disponible y cepilla su pelaje regularmente 🐈✨',
      platforms: ['facebook'],
      scheduledFor: '2024-01-14T15:30:00Z',
              status: 'PUBLISHED',
      engagement: { likes: 67, comments: 15, shares: 23, views: 340 }
    }
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <div className="h-4 w-4 bg-black rounded flex items-center justify-center"><span className="text-white text-xs font-bold">T</span></div>;
      default: return <MessageSquare className="h-4 w-4" />;
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

  const handleLogout = () => {
    logout();
  };

  const handleAddPost = () => {
    setShowCreatePost(true);
  };

  const handleEditPost = (post: Post) => {
    // Aquí implementarías la lógica para editar el post
    console.log('Edit post:', post);
  };

  const handlePostCreated = () => {
    // Refrescar los datos después de crear un post
    // Esto se puede hacer invalidando las queries o recargando la página
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Integración Social
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Selector de organización */}
              <div className="relative">
                <button
                  onClick={() => setShowOrganizationDropdown(!showOrganizationDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span>{organizationData?.name || user.organizations[0]?.name || 'Seleccionar'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showOrganizationDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      {user.organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            setSelectedOrganization(org.id);
                            setShowOrganizationDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            selectedOrganization === org.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {org.name}
                          {org.role === 'OWNER' && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Propietario
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Información del usuario */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                </p>
                <p className="text-xs text-gray-500">Usuario activo</p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mensaje de estado */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`rounded-md p-4 ${
            statusMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex justify-between items-center">
              <span>{statusMessage.message}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen', icon: BarChart3 },
              { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
              { id: 'channels', label: 'Canales', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'notifications', label: 'Notificaciones', icon: Bell },
              { id: 'settings', label: 'Configuración', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Seguidores</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricsData?.totalFollowers?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">+12%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Posts Publicados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricsData?.totalPosts?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">+8%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Heart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricsData?.totalEngagement?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">+15%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Eye className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Alcance Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricsData?.totalReach?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">+22%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>
            </div>

            {/* Connected Channels */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Canales Conectados</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelsData?.map((channel: Channel) => (
                    <div
                      key={channel.id}
                      className={`p-4 rounded-lg border-2 ${
                        channel.isConnected
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${getPlatformColor(channel.platform)}`}>
                          {getPlatformIcon(channel.platform)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{channel.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{channel.platform}</p>
                          {channel.isConnected && channel.followers && (
                            <p className="text-sm text-green-600 font-medium">
                              {channel.followers.toLocaleString()} seguidores
                            </p>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          channel.isConnected ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      {!channel.isConnected && (
                        <button className="mt-3 w-full px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                          Conectar
                        </button>
                      )}
                    </div>
                  )) || (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No hay canales configurados aún
                    </div>
                  )}
                  
                  {/* Card de TikTok para conectar - Temporalmente comentada */}
                  {/* {!channelsData?.find((c: Channel) => c.platform === 'TIKTOK') && (
                    <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-black to-gray-800">
                          <div className="h-4 w-4 bg-black rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">TikTok</p>
                          <p className="text-sm text-gray-500">Conectar cuenta</p>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                      </div>
                      <button 
                        onClick={() => setSelectedTab('channels')}
                        className="mt-3 w-full px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Conectar TikTok
                      </button>
                    </div>
                  )} */}
                  
                  {/* Card de TikTok para conectar */}
                  {!channelsData?.find((c: Channel) => c.platform === 'TIKTOK') && (
                    <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-black to-gray-800">
                          <div className="h-4 w-4 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">TikTok</p>
                          <p className="text-sm text-gray-500">Conectar cuenta</p>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                      </div>
                      <button 
                        onClick={() => setSelectedTab('channels')}
                        className="mt-3 w-full px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Conectar TikTok
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Posts Recientes</h3>
                <button
                  onClick={handleAddPost}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Post
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockPosts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${getPlatformColor(post.platforms[0])}`}>
                          {getPlatformIcon(post.platforms[0])}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-900 capitalize">{post.platforms[0]}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                             post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                               post.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                               post.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                                                             {post.status === 'PUBLISHED' ? 'Publicado' :
                                post.status === 'SCHEDULED' ? 'Programado' :
                                post.status === 'DRAFT' ? 'Borrador' : 'Fallido'}
                            </span>
                          </div>
                                                     <p className="text-gray-900 mb-3">{post.caption}</p>
                          {post.engagement && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.engagement.likes}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.engagement.comments}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Share2 className="h-4 w-4" />
                                <span>{post.engagement.shares}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{post.engagement.views}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'calendar' && (
          <Calendar
            organizationId={selectedOrganization || ''}
            posts={scheduledPosts || []}
            onAddPost={handleAddPost}
            onEditPost={handleEditPost}
          />
        )}

        {selectedTab === 'channels' && (
          <div className="space-y-8">
            <ChannelsManager organizationId={selectedOrganization || ''} />
            
            {/* Sección específica de TikTok */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">🎵 Conectar TikTok</h3>
                <p className="text-sm text-gray-500 mt-1">Vincula tu cuenta de TikTok para analizar métricas y gestionar contenido</p>
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
                  onClick={() => {
                    // Función para conectar TikTok
                    window.open('/api/oauth/tiktok', '_blank');
                  }}
                  className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Conectar TikTok
                </button>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">¿Qué puedes hacer con TikTok?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ver métricas de seguidores y engagement</li>
                    <li>• Analizar rendimiento de videos</li>
                    <li>• Gestionar contenido desde un panel centralizado</li>
                    <li>• Publicar videos directamente desde Metriclon</li>
                    <li>• Obtener insights detallados de audiencia</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="space-y-8">
            <Analytics organizationId={selectedOrganization || ''} />
            
            {/* Botón de debug temporal */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">🔍 Debug TikTok</h4>
              <p className="text-xs text-yellow-700 mb-3">
                Organization ID: {selectedOrganization || 'NO DISPONIBLE'} | 
                Channels: {channelsData?.length || 0} | 
                TikTok: {channelsData?.find((c: Channel) => c.platform === 'TIKTOK') ? 'ENCONTRADO' : 'NO ENCONTRADO'}
              </p>
              <button
                onClick={() => {
                  const tiktokChannel = channelsData?.find((c: Channel) => c.platform === 'TIKTOK');
                  console.log('=== DEBUG TIKTOK ===');
                  console.log('Organization ID:', selectedOrganization);
                  console.log('Channels Data:', channelsData);
                  console.log('TikTok Channel:', tiktokChannel);
                  alert(`TikTok: ${tiktokChannel ? 'CONECTADO' : 'NO CONECTADO'}`);
                }}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
              >
                Ver Estado TikTok
              </button>
            </div>
            
            {/* TikTok Video Upload - Solo mostrar si está conectado */}
            {(() => {
              const tiktokChannel = channelsData?.find((c: Channel) => c.platform === 'TIKTOK' && c.isConnected);
              console.log('TikTok Channel encontrado:', tiktokChannel);
              console.log('Channels Data:', channelsData);
              console.log('Selected Organization:', selectedOrganization);
              
              return tiktokChannel ? (
                <TikTokVideoUpload 
                  organizationId={selectedOrganization || ''} 
                  onVideoUploaded={(result) => {
                    console.log('Video subido:', result);
                    // Aquí puedes agregar lógica adicional después de subir el video
                  }}
                />
              ) : (
                /* TikTok Inline - Componente directo */
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
                      onClick={() => {
                        // Función simple para conectar TikTok
                        window.open('/api/oauth/tiktok', '_blank');
                      }}
                      className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Conectar TikTok
                    </button>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">¿Qué puedes hacer?</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Ver métricas de seguidores y engagement</li>
                        <li>• Analizar rendimiento de videos</li>
                        <li>• Gestionar contenido desde un panel centralizado</li>
                        <li>• Subir y publicar videos directamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {selectedTab === 'notifications' && (
          <NotificationsManager organizationId={selectedOrganization || ''} />
        )}

        {selectedTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración</h3>
            <p className="text-gray-500">Aquí irán las opciones de configuración</p>
          </div>
        )}
      </main>

      {/* Modal para crear posts */}
      {showCreatePost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          organizationId={selectedOrganization || ''}
          channels={channelsData || []}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
