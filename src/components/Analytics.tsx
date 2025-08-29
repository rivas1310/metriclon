'use client';

import { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
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
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface AnalyticsProps {
  organizationId: string;
}

interface MetricData {
  date: string;
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
}

interface PlatformData {
  platform: string;
  followers: number;
  engagement: number;
  reach: number;
  posts: number;
}

interface PostPerformance {
  id: string;
  content: string;
  platform: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagementRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function Analytics({ organizationId }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'followers' | 'engagement' | 'reach' | 'posts'>('followers');

  // Mock data - en producción esto vendría de la API
  const mockMetricsData: MetricData[] = useMemo(() => {
    const data: MetricData[] = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, 'MMM dd'),
        followers: Math.floor(Math.random() * 1000) + 2000,
        reach: Math.floor(Math.random() * 5000) + 10000,
        engagement: Math.floor(Math.random() * 500) + 1000,
        posts: Math.floor(Math.random() * 3) + 1,
      });
    }
    return data;
  }, [timeRange]);

  const mockPlatformData: PlatformData[] = [
    { platform: 'Instagram', followers: 1250, engagement: 450, reach: 8500, posts: 12 },
    { platform: 'Facebook', followers: 890, engagement: 320, reach: 6200, posts: 8 },
    { platform: 'LinkedIn', followers: 450, engagement: 180, reach: 3200, posts: 5 },
    { platform: 'Twitter', followers: 320, engagement: 120, reach: 2100, posts: 3 },
    { platform: 'YouTube', followers: 280, engagement: 95, reach: 1800, posts: 2 },
  ];

  const mockPostPerformance: PostPerformance[] = [
    {
      id: '1',
      content: '¡Hola! Hoy rescatamos a este pequeño gatito...',
      platform: 'Instagram',
      publishedAt: '2024-01-15T10:00:00Z',
      likes: 45,
      comments: 12,
      shares: 8,
      views: 120,
      engagementRate: 8.2
    },
    {
      id: '2',
      content: 'Consejos para cuidar a tu gato...',
      platform: 'Facebook',
      publishedAt: '2024-01-14T15:30:00Z',
      likes: 67,
      comments: 15,
      shares: 23,
      views: 340,
      engagementRate: 12.1
    },
    {
      id: '3',
      content: 'Nuevo video: Cómo socializar gatitos...',
      platform: 'YouTube',
      publishedAt: '2024-01-13T12:00:00Z',
      likes: 89,
      comments: 28,
      shares: 15,
      views: 1200,
      engagementRate: 15.3
    },
  ];

  const totalFollowers = mockPlatformData.reduce((sum, p) => sum + p.followers, 0);
  const totalEngagement = mockPlatformData.reduce((sum, p) => sum + p.engagement, 0);
  const totalReach = mockPlatformData.reduce((sum, p) => sum + p.reach, 0);
  const totalPosts = mockPlatformData.reduce((sum, p) => sum + p.posts, 0);

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'followers': return <Users className="h-5 w-5" />;
      case 'engagement': return <Heart className="h-5 w-5" />;
      case 'reach': return <Eye className="h-5 w-5" />;
      case 'posts': return <Calendar className="h-5 w-5" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'followers': return 'text-blue-600';
      case 'engagement': return 'text-purple-600';
      case 'reach': return 'text-green-600';
      case 'posts': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getMetricBgColor = (metric: string) => {
    switch (metric) {
      case 'followers': return 'bg-blue-100';
      case 'engagement': return 'bg-purple-100';
      case 'reach': return 'bg-green-100';
      case 'posts': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header con filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Detallados</h2>
            <p className="text-gray-600">Métricas y rendimiento de tus redes sociales</p>
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
            
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Seguidores</p>
              <p className="text-2xl font-bold text-gray-900">{totalFollowers.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+12%</span>
            <span className="text-gray-500 text-sm ml-1">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{totalEngagement.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+8%</span>
            <span className="text-gray-500 text-sm ml-1">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alcance Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalReach.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+15%</span>
            <span className="text-gray-500 text-sm ml-1">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Posts Publicados</p>
              <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+5%</span>
            <span className="text-gray-500 text-sm ml-1">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* Gráfico de tendencias */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Tendencias en el tiempo</h3>
          <div className="flex space-x-2">
            {(['followers', 'engagement', 'reach', 'posts'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedMetric === metric
                    ? `${getMetricBgColor(metric)} ${getMetricColor(metric)}`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {getMetricIcon(metric)}
                <span className="ml-2 capitalize">{metric}</span>
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={mockMetricsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={selectedMetric} 
              stroke={selectedMetric === 'followers' ? '#3B82F6' : 
                     selectedMetric === 'engagement' ? '#8B5CF6' :
                     selectedMetric === 'reach' ? '#10B981' : '#F59E0B'} 
              strokeWidth={3}
              dot={{ fill: selectedMetric === 'followers' ? '#3B82F6' : 
                     selectedMetric === 'engagement' ? '#8B5CF6' :
                     selectedMetric === 'reach' ? '#10B981' : '#F59E0B', 
                     strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Comparación por plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de barras por plataforma */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Rendimiento por Plataforma</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockPlatformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="followers" fill="#3B82F6" name="Seguidores" />
              <Bar dataKey="engagement" fill="#8B5CF6" name="Engagement" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de radar para métricas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Análisis de Métricas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={mockPlatformData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="platform" />
              <PolarRadiusAxis />
              <Radar 
                name="Seguidores" 
                dataKey="followers" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3} 
              />
              <Radar 
                name="Engagement" 
                dataKey="engagement" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3} 
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución de seguidores por plataforma */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Distribución de Seguidores</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockPlatformData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="followers"
              >
                {mockPlatformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            {mockPlatformData.map((platform, index) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{platform.platform}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{platform.followers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">
                    {((platform.followers / totalFollowers) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top posts por rendimiento */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Top Posts por Rendimiento</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plataforma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alcance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa de Engagement
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockPostPerformance.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {post.content}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: es })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {post.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-900">
                      <span className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>{post.likes}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>{post.comments}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Share2 className="h-4 w-4 text-green-500" />
                        <span>{post.shares}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {post.engagementRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
