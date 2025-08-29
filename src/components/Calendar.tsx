'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface Post {
  id: string;
  caption?: string;
  platforms?: string[];
  scheduledAt?: string;
  scheduledFor?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'PUBLISHING' | 'CANCELLED';
  organizationId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK';
  meta?: any;
}

interface CalendarProps {
  organizationId: string;
  posts: Post[];
  onAddPost: () => void;
  onEditPost: (post: Post) => void;
}

export function Calendar({ organizationId, posts, onAddPost, onEditPost }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const postsForDate = (date: Date) => {
    if (!posts || !Array.isArray(posts)) {
      return [];
    }
    return posts.filter(post => {
      const scheduledDate = post.scheduledAt || post.scheduledFor;
      return scheduledDate && isSameDay(new Date(scheduledDate), date);
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📷';
      case 'facebook': return '📘';
      case 'linkedin': return '💼';
      case 'twitter': return '🐦';
      case 'youtube': return '📺';
      case 'tiktok': return '🎵';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PUBLISHING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header del calendario */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Calendario de Publicaciones</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h4 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h4>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          onClick={onAddPost}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Programar Post
        </button>
      </div>

      {/* Días de la semana */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Grilla del calendario */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) => {
            const dayPosts = postsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                  isSelected ? 'bg-blue-50' : ''
                } hover:bg-gray-50 transition-colors cursor-pointer`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-right mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Posts del día */}
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={`p-2 rounded text-xs cursor-pointer transition-colors hover:bg-gray-100 ${
                        getStatusColor(post.status)
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPost(post);
                      }}
                    >
                      <div className="flex items-center space-x-1 mb-1">
                        {post.platforms ? post.platforms.map((platform, idx) => (
                          <span key={idx} className="text-xs">
                            {getPlatformIcon(platform)}
                          </span>
                        )) : (
                          <span className="text-xs">
                            {getPlatformIcon('facebook')}
                          </span>
                        )}
                      </div>
                      <div className="truncate font-medium">
                        {(post.caption || '').substring(0, 20)}...
                      </div>
                      <div className="flex items-center space-x-1 text-xs opacity-75">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(post.scheduledAt || post.scheduledFor || ''), 'HH:mm')}</span>
                      </div>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayPosts.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel lateral de posts del día seleccionado */}
      {selectedDate && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Posts para {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {postsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay posts programados para este día</p>
                <button
                  onClick={onAddPost}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Programar un post
                </button>
              </div>
            ) : (
              postsForDate(selectedDate).map((post) => (
                <div
                  key={post.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onEditPost(post)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {post.platforms ? post.platforms.map((platform, idx) => (
                        <span key={idx} className="text-lg">
                          {getPlatformIcon(platform)}
                        </span>
                      )) : (
                        <span className="text-lg">
                          {getPlatformIcon('facebook')}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getStatusColor(post.status)
                    }`}>
                      {post.status === 'SCHEDULED' ? 'Programado' :
                       post.status === 'PUBLISHED' ? 'Publicado' : 
                       post.status === 'FAILED' ? 'Fallido' :
                       post.status === 'PUBLISHING' ? 'Publicando' :
                       post.status === 'CANCELLED' ? 'Cancelado' :
                       post.status === 'DRAFT' ? 'Borrador' : 'Desconocido'}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 mb-3 line-clamp-3">{post.caption || 'Sin contenido'}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(post.scheduledAt || post.scheduledFor || ''), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{post.platforms ? post.platforms.length : 1} plataforma{(post.platforms ? post.platforms.length : 1) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
