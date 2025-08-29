'use client';

import { Clock, Eye, Heart, MessageCircle, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Post {
  id: string;
  caption?: string;
  type: string;
  status: string;
  publishedAt?: string;
  channel: {
    platform: string;
    name: string;
  };
  assets: any[];
}

interface RecentPostsProps {
  posts?: Post[];
}

export function RecentPosts({ posts = [] }: RecentPostsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Posts Recientes</h3>
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No hay posts recientes</p>
          <p className="text-sm text-gray-400">Los posts aparecerán aquí después de ser publicados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Posts Recientes</h3>
      <div className="space-y-4">
        {posts.slice(0, 5).map((post) => (
          <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              {/* Icono de plataforma */}
              <div className={`w-10 h-10 bg-gradient-to-r ${getPlatformColor(post.channel.platform)} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {getPlatformIcon(post.channel.platform)}
              </div>

              {/* Contenido del post */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">{post.channel.name}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                    {post.status.toLowerCase()}
                  </span>
                  {getStatusIcon(post.status)}
                </div>

                <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                  {post.caption || 'Sin texto'}
                </p>

                {/* Tipo de contenido */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                  <span className="capitalize">{post.type.toLowerCase()}</span>
                  {post.assets.length > 0 && (
                    <span>{post.assets.length} {post.assets.length === 1 ? 'medio' : 'medios'}</span>
                  )}
                  {post.publishedAt && (
                    <span>{format(new Date(post.publishedAt), 'dd MMM HH:mm', { locale: es })}</span>
                  )}
                </div>

                {/* Métricas simuladas */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{(Math.random() * 1000).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-3 w-3" />
                    <span>{(Math.random() * 100).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{(Math.random() * 20).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Share2 className="h-3 w-3" />
                    <span>{(Math.random() * 10).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todos los posts ({posts.length})
          </button>
        </div>
      )}
    </div>
  );
}
