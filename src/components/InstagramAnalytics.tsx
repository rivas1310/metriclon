'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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
  Users, 
  Eye, 
  Heart, 
  MessageSquare, 
  Bookmark,
  TrendingUp,
  Calendar,
  RefreshCw,
  ExternalLink,
  Camera,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InstagramAnalyticsProps {
  organizationId: string;
  days?: number;
}

interface InstagramData {
  accountInfo: {
    id: string;
    username: string;
    name: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  };
  insights: {
    totalImpressions: number;
    totalReach: number;
    totalEngagement: number;
    engagementRate: number;
    postCount: number;
  };
  recentPosts: Array<{
    id: string;
    caption?: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    timestamp: string;
    like_count?: number;
    comments_count?: number;
    impressions?: number;
    reach?: number;
    saved?: number;
    engagement?: number;
    permalink: string;
  }>;
  dateRange: {
    since: string;
    until: string;
  };
}

export function InstagramAnalytics({ organizationId, days = 30 }: InstagramAnalyticsProps) {
  const [data, setData] = useState<InstagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstagramData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/metrics?organizationId=${organizationId}&platform=instagram&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener datos de Instagram');
      }

      const result = await response.json();
      
      if (result.data.platforms.length === 0) {
        setError('No hay cuentas de Instagram conectadas');
        return;
      }

      // Tomar la primera cuenta de Instagram encontrada
      const instagramPlatform = result.data.platforms.find((p: any) => p.platform === 'INSTAGRAM');
      
      if (!instagramPlatform) {
        setError('No se encontraron datos de Instagram');
        return;
      }

      setData({
        accountInfo: instagramPlatform.accountInfo,
        insights: instagramPlatform.insights,
        recentPosts: instagramPlatform.recentPosts,
        dateRange: instagramPlatform.dateRange,
      });

    } catch (err) {
      console.error('Error fetching Instagram data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstagramData();
  }, [organizationId, days]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando métricas de Instagram...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-pink-500 mb-4">
            <Camera className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error en Instagram</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchInstagramData}
            className="inline-flex items-center px-4 py-2 border border-pink-300 rounded-md text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Preparar datos para gráficos
  const postsChartData = data.recentPosts.map(post => ({
    date: format(new Date(post.timestamp), 'dd/MM'),
    impressions: post.impressions || 0,
    reach: post.reach || 0,
    engagement: post.engagement || 0,
    likes: post.like_count || 0,
    comments: post.comments_count || 0,
  }));

  const mediaTypeData = [
    { 
      name: 'Imágenes', 
      value: data.recentPosts.filter(p => p.media_type === 'IMAGE').length,
      color: '#E91E63'
    },
    { 
      name: 'Videos', 
      value: data.recentPosts.filter(p => p.media_type === 'VIDEO').length,
      color: '#9C27B0'
    },
    { 
      name: 'Carruseles', 
      value: data.recentPosts.filter(p => p.media_type === 'CAROUSEL_ALBUM').length,
      color: '#673AB7'
    },
  ].filter(item => item.value > 0);

  const engagementTypes = [
    { name: 'Likes', value: data.recentPosts.reduce((sum, post) => sum + (post.like_count || 0), 0), color: '#E91E63' },
    { name: 'Comentarios', value: data.recentPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0), color: '#9C27B0' },
    { name: 'Guardados', value: data.recentPosts.reduce((sum, post) => sum + (post.saved || 0), 0), color: '#673AB7' },
  ];

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'VIDEO':
        return <Play className="h-4 w-4" />;
      case 'CAROUSEL_ALBUM':
        return <div className="h-4 w-4 grid grid-cols-2 gap-0.5"><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div></div>;
      default:
        return <Camera className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Camera className="h-8 w-8 text-pink-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Instagram Analytics</h2>
              <p className="text-gray-600">@{data.accountInfo.username}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                {data.accountInfo.account_type}
              </span>
            </div>
          </div>
          <button
            onClick={fetchInstagramData}
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
            <div className="p-2 bg-pink-100 rounded-lg">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Seguidores</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.accountInfo.followers_count.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alcance</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.insights.totalReach.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Heart className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.insights.totalEngagement.toLocaleString()}
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
                {data.insights.engagementRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Siguiendo</p>
              <p className="text-xl font-bold text-gray-900">
                {data.accountInfo.follows_count.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Camera className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-xl font-bold text-gray-900">
                {data.accountInfo.media_count.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Posts Analizados</p>
              <p className="text-xl font-bold text-gray-900">
                {data.insights.postCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias de posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rendimiento de Posts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={postsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="impressions" stroke="#E91E63" name="Impresiones" />
              <Line type="monotone" dataKey="reach" stroke="#9C27B0" name="Alcance" />
              <Line type="monotone" dataKey="engagement" stroke="#673AB7" name="Engagement" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tipos de contenido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Contenido</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mediaTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mediaTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución de engagement */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Engagement</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={engagementTypes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#E91E63" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Posts recientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Posts Recientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentPosts.slice(0, 6).map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-500">
                    {getMediaIcon(post.media_type)}
                  </div>
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    {post.media_type}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(post.timestamp), 'dd MMM', { locale: es })}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-900 line-clamp-2 mb-3">
                {post.caption ? post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : '') : 'Sin descripción'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.impressions?.toLocaleString() || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span>{post.like_count || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                    <span>{post.comments_count || 0}</span>
                  </span>
                  {post.saved !== undefined && (
                    <span className="flex items-center space-x-1">
                      <Bookmark className="h-3 w-3 text-yellow-500" />
                      <span>{post.saved}</span>
                    </span>
                  )}
                </div>
                <a 
                  href={post.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-800 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

