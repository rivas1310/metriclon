'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Eye, Heart, TrendingUp, Users, Calendar, RefreshCw } from 'lucide-react';

interface DashboardStatsProps {
  organizationId?: string;
}

interface StatsData {
  totalFollowers: number;
  totalEngagement: number;
  totalReach: number;
  totalImpressions: number;
  engagementRate: number;
  postCount: number;
  connectedPlatforms: string[];
}

export function DashboardStats({ organizationId }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/metrics?organizationId=${organizationId}&days=30`);
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }

      const result = await response.json();
      
      const connectedPlatforms = result.data.platforms.map((p: any) => 
        p.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram'
      );

      setStats({
        totalFollowers: result.data.summary.totalFollowers,
        totalEngagement: result.data.summary.totalEngagement,
        totalReach: result.data.summary.totalReach,
        totalImpressions: result.data.summary.totalImpressions,
        engagementRate: result.data.summary.engagementRate,
        postCount: result.data.summary.postCount,
        connectedPlatforms,
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [organizationId]);

  // Datos por defecto mientras carga o si hay error
  const data = stats || {
    totalFollowers: 0,
    totalEngagement: 0,
    totalReach: 0,
    totalImpressions: 0,
    engagementRate: 0,
    postCount: 0,
    connectedPlatforms: [],
  };

  type ChangeType = 'positive' | 'negative' | 'neutral';
  
  const statCards: Array<{
    title: string;
    value: string;
    icon: any;
    color: string;
    change: string;
    changeType: ChangeType;
  }> = [
    {
      title: 'Total Seguidores',
      value: data.totalFollowers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: loading ? '...' : 'En tiempo real',
      changeType: 'neutral',
    },
    {
      title: 'Total Engagement',
      value: data.totalEngagement.toLocaleString(),
      icon: Heart,
      color: 'bg-red-500',
      change: loading ? '...' : 'En tiempo real',
      changeType: 'neutral',
    },
    {
      title: 'Alcance Total',
      value: data.totalReach.toLocaleString(),
      icon: Eye,
      color: 'bg-green-500',
      change: loading ? '...' : 'En tiempo real',
      changeType: 'neutral',
    },
    {
      title: 'Posts Analizados',
      value: data.postCount.toString(),
      icon: BarChart3,
      color: 'bg-purple-500',
      change: loading ? '...' : 'Últimos 30 días',
      changeType: 'neutral',
    },
    {
      title: 'Tasa de Engagement',
      value: `${data.engagementRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: loading ? '...' : 'Promedio',
      changeType: 'neutral',
    },
    {
      title: 'Plataformas Conectadas',
      value: data.connectedPlatforms.length.toString(),
      icon: Calendar,
      color: 'bg-indigo-500',
      change: data.connectedPlatforms.join(', ') || 'Ninguna',
      changeType: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs mes anterior</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
