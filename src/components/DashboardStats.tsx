'use client';

import { BarChart3, Eye, Heart, TrendingUp, Users, Calendar } from 'lucide-react';

interface DashboardStatsProps {
  stats?: {
    totalPosts?: number;
    totalEngagement?: number;
    totalReach?: number;
    postsThisMonth?: number;
    engagementRate?: number;
    topPlatform?: string;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const defaultStats = {
    totalPosts: 0,
    totalEngagement: 0,
    totalReach: 0,
    postsThisMonth: 0,
    engagementRate: 0,
    topPlatform: 'Instagram',
  };

  const data = { ...defaultStats, ...stats };

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
      title: 'Total Posts',
      value: data.totalPosts.toLocaleString(),
      icon: BarChart3,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Total Engagement',
      value: data.totalEngagement.toLocaleString(),
      icon: Heart,
      color: 'bg-red-500',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Total Reach',
      value: data.totalReach.toLocaleString(),
      icon: Eye,
      color: 'bg-green-500',
      change: '+15%',
      changeType: 'positive',
    },
    {
      title: 'Posts este Mes',
      value: data.postsThisMonth.toString(),
      icon: Calendar,
      color: 'bg-purple-500',
      change: '+5%',
      changeType: 'positive',
    },
    {
      title: 'Tasa de Engagement',
      value: `${data.engagementRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+2.1%',
      changeType: 'positive',
    },
    {
      title: 'Plataforma Top',
      value: data.topPlatform,
      icon: Users,
      color: 'bg-indigo-500',
      change: 'Instagram',
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
