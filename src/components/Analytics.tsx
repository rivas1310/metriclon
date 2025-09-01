'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  Filter,
  Download,
  RefreshCw,
  Camera,
  AlertCircle,
  Bug,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FacebookAnalytics } from './FacebookAnalytics';
import { InstagramAnalytics } from './InstagramAnalytics';
import { WebhookSetup } from './WebhookSetup';

interface AnalyticsProps {
  organizationId: string;
}

interface SummaryData {
  totalFollowers: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
  postCount: number;
}

interface PlatformSummary {
  platform: 'FACEBOOK' | 'INSTAGRAM';
  connected: boolean;
  followers: number;
  engagement: number;
  reach: number;
  posts: number;
}

const COLORS = ['#3B82F6', '#E91E63', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function Analytics({ organizationId }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'facebook' | 'instagram'>('overview');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [platformData, setPlatformData] = useState<PlatformSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Obteniendo analytics para organizationId: ${organizationId}`);

      const response = await fetch(
        `/api/metrics?organizationId=${organizationId}&days=${days}`
      );

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || 'Error al obtener métricas');
      }

      const result = await response.json();
      console.log('📈 Analytics result:', result);
      
      // Establecer datos de resumen
      setSummaryData(result.data.summary);

      // Preparar datos de plataformas
      const platforms: PlatformSummary[] = [
        {
          platform: 'FACEBOOK',
          connected: false,
          followers: 0,
          engagement: 0,
          reach: 0,
          posts: 0,
        },
        {
          platform: 'INSTAGRAM',
          connected: false,
          followers: 0,
          engagement: 0,
          reach: 0,
          posts: 0,
        }
      ];

      console.log(`🔗 Platforms encontradas: ${result.data.platforms.length}`);

      result.data.platforms.forEach((platform: any) => {
        console.log(`📱 Procesando platform: ${platform.platform}`);
        const platformIndex = platforms.findIndex(p => p.platform === platform.platform);
        if (platformIndex !== -1) {
          platforms[platformIndex] = {
            platform: platform.platform,
            connected: true,
            followers: 'followers_count' in platform.accountInfo 
              ? platform.accountInfo.followers_count 
              : platform.accountInfo.fan_count || 0,
            engagement: platform.insights.totalEngagement,
            reach: platform.insights.totalReach,
            posts: platform.insights.postCount,
          };
        }
      });

      setPlatformData(platforms);
      console.log('✅ Analytics data loaded successfully');

    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugData = async () => {
    try {
      const response = await fetch(`/api/debug/channels?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    if (showDebug) {
      fetchDebugData();
    }
  }, [organizationId, days, showDebug]);

  // Renderizar vista específica de plataforma
  if (selectedView === 'facebook') {
    return <FacebookAnalytics organizationId={organizationId} days={days} />;
  }

  if (selectedView === 'instagram') {
    return <InstagramAnalytics organizationId={organizationId} days={days} />;
  }

  // Preparar datos para gráficos del overview
  const chartData = platformData.filter(p => p.connected).map(platform => ({
    platform: platform.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram',
    followers: platform.followers,
    engagement: platform.engagement,
    reach: platform.reach,
    posts: platform.posts,
  }));

  return (
    <div className="space-y-8">
      {/* Header con filtros y navegación */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Reales</h2>
              <p className="text-gray-600">Métricas en tiempo real de Facebook e Instagram</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
            
              <button 
                onClick={fetchAnalyticsData}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={() => setShowDebug(!showDebug)}
                className={`p-2 transition-colors ${showDebug ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Panel de Debug"
              >
                <Bug className="h-4 w-4" />
            </button>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Exportar
              </button>
            </div>
          </div>

          {/* Navegación entre vistas */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedView('overview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'overview'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setSelectedView('facebook')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'facebook'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 text-blue-600" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setSelectedView('instagram')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'instagram'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="h-4 w-4 text-pink-600" />
              <span>Instagram</span>
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Debug */}
      {showDebug && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-yellow-800 flex items-center">
              <Bug className="h-5 w-5 mr-2" />
              Panel de Debug
            </h3>
            <button
              onClick={() => setShowDebug(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Información General:</h4>
              <div className="bg-white rounded p-3 text-sm">
                <p><strong>Organization ID:</strong> {organizationId}</p>
                <p><strong>Período:</strong> {days} días</p>
                <p><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</p>
                <p><strong>Error:</strong> {error || 'Ninguno'}</p>
              </div>
            </div>

            {debugData && (
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Canales Conectados:</h4>
                <div className="bg-white rounded p-3 text-sm">
                  <p><strong>Total de canales:</strong> {debugData.totalChannels}</p>
                  <p><strong>Canales activos:</strong> {debugData.activeChannels}</p>
                  <p><strong>Plataformas activas:</strong> {debugData.activeChannelPlatforms?.join(', ') || 'Ninguna'}</p>
                  
                  {debugData.channels.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium mb-2">Detalles de canales:</h5>
                      <div className="space-y-2">
                        {debugData.channels.map((channel: any) => (
                          <div key={channel.id} className="border border-gray-200 rounded p-2">
                            <p><strong>{channel.platform}:</strong> {channel.name}</p>
                            <p><strong>Activo:</strong> {channel.isActive ? '✅' : '❌'}</p>
                            <p><strong>Token:</strong> {channel.hasAccessToken ? '✅' : '❌'}</p>
                            <p><strong>Token expirado:</strong> {typeof channel.tokenExpired === 'boolean' ? (channel.tokenExpired ? '❌' : '✅') : channel.tokenExpired}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchDebugData}
                className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
              >
                Actualizar Debug
              </button>
              <button
                onClick={() => window.open(`/api/debug/channels?organizationId=${organizationId}`, '_blank')}
                className="px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm hover:bg-blue-300"
              >
                Ver JSON Canales
              </button>
              <button
                onClick={() => window.open(`/api/debug/api-test?organizationId=${organizationId}&platform=facebook`, '_blank')}
                className="px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm hover:bg-blue-300"
              >
                Test Facebook API
              </button>
              <button
                onClick={() => window.open(`/api/debug/api-test?organizationId=${organizationId}&platform=instagram`, '_blank')}
                className="px-3 py-1 bg-pink-200 text-pink-800 rounded text-sm hover:bg-pink-300"
              >
                Test Instagram API
              </button>
                               <button
                   onClick={() => window.open(`/api/debug/facebook-personal?organizationId=${organizationId}`, '_blank')}
                   className="px-3 py-1 bg-blue-300 text-blue-900 rounded text-sm hover:bg-blue-400"
                 >
                   Test Facebook Personal
                 </button>
               </div>
             </div>

             {/* Configuración de Webhook */}
             {debugData?.channels?.find(c => c.platform === 'FACEBOOK') && (
               <div className="mt-6">
                 <h4 className="text-lg font-medium text-gray-900 mb-4">🔗 Configuración de Webhook</h4>
                 <WebhookSetup
                   organizationId={organizationId}
                   channelId={debugData.channels.find(c => c.platform === 'FACEBOOK')?.id || ''}
                   channelName={debugData.channels.find(c => c.platform === 'FACEBOOK')?.name || 'Facebook'}
                   platform="FACEBOOK"
                 />
               </div>
             )}
           </div>
         )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando métricas...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </button>
        </div>
      ) : (
        <>
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Seguidores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summaryData?.totalFollowers.toLocaleString() || 0}
                  </p>
            </div>
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
                    {summaryData?.totalEngagement.toLocaleString() || 0}
                  </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alcance Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summaryData?.totalReach.toLocaleString() || 0}
                  </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tasa de Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summaryData?.engagementRate.toFixed(2) || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de plataformas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platformData.map((platform) => (
              <div key={platform.platform} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      platform.platform === 'FACEBOOK' ? 'bg-blue-100' : 'bg-pink-100'
                    }`}>
                      {platform.platform === 'FACEBOOK' ? (
                        <Users className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Camera className="h-6 w-6 text-pink-600" />
                      )}
          </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {platform.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram'}
                    </h3>
        </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    platform.connected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {platform.connected ? 'Conectado' : 'No conectado'}
                  </span>
      </div>

                {platform.connected ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Seguidores</p>
                      <p className="text-xl font-bold text-gray-900">
                        {platform.followers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Engagement</p>
                      <p className="text-xl font-bold text-gray-900">
                        {platform.engagement.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alcance</p>
                      <p className="text-xl font-bold text-gray-900">
                        {platform.reach.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Posts</p>
                      <p className="text-xl font-bold text-gray-900">
                        {platform.posts}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Conecta tu cuenta para ver métricas</p>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      Conectar {platform.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram'}
              </button>
                  </div>
                )}
              </div>
            ))}
        </div>
        
          {/* Comparación visual si hay datos */}
          {chartData.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico de comparación */}
        <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Comparación de Seguidores</h3>
          <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="followers" fill="#3B82F6" name="Seguidores" />
            </BarChart>
          </ResponsiveContainer>
        </div>

              {/* Distribución de engagement */}
        <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Distribución de Engagement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                      data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                      dataKey="engagement"
              >
                      {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
              </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}
