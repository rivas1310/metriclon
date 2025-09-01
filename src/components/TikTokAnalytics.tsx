import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Calendar,
  RefreshCw,
  Play,
  Video,
  BarChart3,
  Activity
} from 'lucide-react';

interface TikTokVideo {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  videoUrl: string;
  createTime: number;
  stats: {
    playCount: number;
    shareCount: number;
    commentCount: number;
    likeCount: number;
    downloadCount: number;
  };
  tags: string[];
}

interface TikTokMetrics {
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementRate: number;
}

interface TikTokAnalyticsData {
  accountInfo: {
    displayName: string;
    username: string;
    avatarUrl: string;
    isVerified: boolean;
    followerCount: number;
    followingCount: number;
    likesCount: number;
    videoCount: number;
  };
  metrics: TikTokMetrics;
  recentVideos: TikTokVideo[];
  topVideos: TikTokVideo[];
  engagementTrends: {
    date: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }[];
}

export default function TikTokAnalytics() {
  const [data, setData] = useState<TikTokAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const fetchTikTokData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/metrics?platform=tiktok');
      if (!response.ok) {
        throw new Error('Error al obtener datos de TikTok');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTikTokData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de TikTok...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <Activity className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-900">Error al cargar datos</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchTikTokData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Video className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-yellow-900">No hay datos de TikTok</h3>
            <p className="text-yellow-700">Conecta tu cuenta de TikTok para ver las métricas</p>
          </div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-black rounded-lg">
              <Video className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">TikTok Analytics</h2>
              <p className="text-gray-600">{data.accountInfo.displayName}</p>
              <p className="text-sm text-gray-500">@{data.accountInfo.username}</p>
              {data.accountInfo.isVerified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ✓ Verificado
                </span>
              )}
            </div>
          </div>
          <button
            onClick={fetchTikTokData}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-black rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Seguidores</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.metrics.followerCount)}
              </p>
              <p className="text-xs text-gray-500">Total de seguidores</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Me Gusta</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.metrics.totalLikes)}
              </p>
              <p className="text-xs text-gray-500">En todos los videos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Visualizaciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.metrics.totalViews)}
              </p>
              <p className="text-xs text-gray-500">Reproducciones totales</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasa de Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.metrics.engagementRate.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">Interacción / seguidores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de tendencias */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencias de Engagement</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.engagementTrends.slice(-7).map((trend, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className="w-8 bg-blue-500 rounded-t" style={{ height: `${(trend.views / Math.max(...data.engagementTrends.map(t => t.views))) * 200 }px` }}></div>
              <span className="text-xs text-gray-500">{trend.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Videos recientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Videos Recientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.recentVideos.map((video) => (
            <div key={video.id} className="border rounded-lg overflow-hidden">
              <div className="relative">
                <img 
                  src={video.coverImageUrl} 
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  <Play className="h-4 w-4 inline mr-1" />
                  {formatNumber(video.stats.playCount)}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {video.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatDate(video.createTime)}</span>
                  <div className="flex space-x-3">
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {formatNumber(video.stats.likeCount)}
                    </span>
                    <span className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {formatNumber(video.stats.commentCount)}
                    </span>
                    <span className="flex items-center">
                      <Share2 className="h-4 w-4 mr-1" />
                      {formatNumber(video.stats.shareCount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top videos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Videos por Engagement</h3>
        <div className="space-y-4">
          {data.topVideos.slice(0, 5).map((video, index) => (
            <div key={video.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-400 w-8">#{index + 1}</div>
              <img 
                src={video.coverImageUrl} 
                alt={video.title}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 line-clamp-1">
                  {video.title}
                </h4>
                <p className="text-sm text-gray-600">{formatDate(video.createTime)}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatNumber(video.stats.playCount)}
                </div>
                <div className="text-sm text-gray-500">reproducciones</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">
                  {formatNumber(video.stats.likeCount)}
                </div>
                <div className="text-sm text-gray-500">me gusta</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de Debug */}
      {showDebug && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-4">🔍 Debug - Datos de TikTok</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-yellow-800">Videos Encontrados:</h4>
                <p className="text-sm text-yellow-700">{data.recentVideos.length} videos</p>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800">Top Videos:</h4>
                <p className="text-sm text-yellow-700">{data.topVideos.length} videos</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Estructura de Datos:</h4>
              <div className="bg-white p-3 rounded border text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón de Debug */}
      <div className="text-center">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
        </button>
      </div>
    </div>
  );
}
