'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2, Calendar, Download, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '@/lib/api';

interface PerformanceAnalyticsProps {
  organizationId: string;
}

interface AnalyticsData {
  overview: {
    totalPosts: number;
    totalEngagement: number;
    totalReach: number;
    averageEngagement: number;
    averageReach: number;
  };
  platformStats: Record<string, any>;
  topPosts: Array<{
    id: string;
    caption: string;
    platform: string;
    engagement: number;
    reach: number;
    publishedAt: string;
  }>;
}

export function PerformanceAnalytics({ organizationId }: PerformanceAnalyticsProps) {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Obtener datos de analytics
  const { data: analytics } = useQuery({
    queryKey: ['performance-analytics', organizationId, dateRange],
    queryFn: () => {
      const endDate = endOfDay(new Date());
      let startDate: Date;
      
      switch (dateRange) {
        case '7d':
          startDate = startOfDay(subDays(new Date(), 7));
          break;
        case '30d':
          startDate = startOfDay(subDays(new Date(), 30));
          break;
        case '90d':
          startDate = startOfDay(subDays(new Date(), 90));
          break;
        default:
          startDate = startOfDay(subDays(new Date(), 7));
      }

      return api.posts.getAll({
        organizationId,
        limit: 100
      });
    },
    enabled: !!organizationId,
  });

  const data: AnalyticsData = analytics?.data || {
    overview: {
      totalPosts: 0,
      totalEngagement: 0,
      totalReach: 0,
      averageEngagement: 0,
      averageReach: 0,
    },
    platformStats: {},
    topPosts: [],
  };

  // Exportar datos
  const exportData = (formatType: 'csv' | 'pdf') => {
    const endDate = endOfDay(new Date());
    let startDate: Date;
    
    switch (dateRange) {
      case '7d':
        startDate = startOfDay(subDays(new Date(), 7));
        break;
      case '30d':
        startDate = startOfDay(subDays(new Date(), 30));
        break;
      case '90d':
        startDate = startOfDay(subDays(new Date(), 90));
        break;
      default:
        startDate = startOfDay(subDays(new Date(), 7));
    }

          // Exportar métricas (implementar cuando esté disponible)
          console.log('Exportando métricas:', {
            organizationId,
            formatType,
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
          });
          
          // Simular descarga
          const mockData = 'Datos de métricas simulados';
          const url = window.URL.createObjectURL(new Blob([mockData]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `analytics-${formatType}-${format(new Date(), 'yyyy-MM-dd')}.${formatType}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
  };

  // Obtener color de plataforma
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

  // Obtener icono de plataforma
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

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BarChart3 className="h-8 w-8 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">Análisis de Rendimiento</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Filtro de plataforma */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todas las plataformas</option>
            {Object.keys(data.platformStats).map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>

          {/* Filtro de fecha */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>

          {/* Botones de exportación */}
          <div className="flex space-x-2">
            <button
              onClick={() => exportData('csv')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportData('pdf')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalPosts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alcance Total</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalReach.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement Total</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalEngagement.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasa Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.averageEngagement.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas por plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rendimiento por Plataforma</h3>
          <div className="space-y-4">
            {Object.entries(data.platformStats).map(([platform, stats]) => (
              <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-gradient-to-r ${getPlatformColor(platform)} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                    {getPlatformIcon(platform)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{platform}</p>
                    <p className="text-sm text-gray-500">{stats.posts} posts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{stats.avgEngagement.toFixed(2)}%</p>
                  <p className="text-sm text-gray-500">engagement</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas Detalladas</h3>
          <div className="space-y-4">
            {Object.entries(data.platformStats).map(([platform, stats]) => (
              <div key={platform} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{platform}</span>
                  <span className="text-sm text-gray-500">{stats.posts} posts</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Likes</p>
                    <p className="font-medium">{stats.likes?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Comentarios</p>
                    <p className="font-medium">{stats.comments?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Compartidos</p>
                    <p className="font-medium">{stats.shares?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts top */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Posts con Mejor Rendimiento</h3>
        <div className="space-y-3">
          {data.topPosts.map((post, index) => (
            <div key={post.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {post.caption || 'Sin texto'}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getPlatformColor(post.platform)} text-white`}>
                      {post.platform}
                    </span>
                    <span>{format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">Engagement</p>
                    <p className="font-medium text-gray-900">{post.engagement.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Alcance</p>
                    <p className="font-medium text-gray-900">{post.reach.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de tendencias */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencias de Engagement</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Gráfico de tendencias</p>
            <p className="text-sm">Integración con librería de gráficos próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
