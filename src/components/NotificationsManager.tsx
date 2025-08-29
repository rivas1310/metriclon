'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Clock, 
  Trash2,
  Settings,
  Filter,
  Search,
  MoreVertical,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface NotificationsManagerProps {
  organizationId: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  category: 'post' | 'metrics' | 'connection' | 'system' | 'engagement';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: {
    platform?: string;
    postId?: string;
    channelId?: string;
    metricValue?: number;
    previousValue?: number;
  };
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: {
    post: boolean;
    metrics: boolean;
    connection: boolean;
    system: boolean;
    engagement: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
}

const NOTIFICATION_TYPES = {
  success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  error: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  warning: { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100' }
};

const CATEGORIES = {
  post: { label: 'Posts', color: 'bg-purple-100 text-purple-800' },
  metrics: { label: 'Métricas', color: 'bg-blue-100 text-blue-800' },
  connection: { label: 'Conexiones', color: 'bg-green-100 text-green-800' },
  system: { label: 'Sistema', color: 'bg-gray-100 text-gray-800' },
  engagement: { label: 'Engagement', color: 'bg-pink-100 text-pink-800' }
};

export function NotificationsManager({ organizationId }: NotificationsManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Obtener notificaciones
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', organizationId, selectedCategory, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({ organizationId });
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!organizationId,
  });

  // Obtener preferencias de notificaciones
  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/preferences?organizationId=${organizationId}`);
      if (response.ok) {
        return response.json();
      }
      return getDefaultPreferences();
    },
    enabled: !!organizationId,
  });

  // Mutación para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error al marcar como leída');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
      updateUnreadCount();
    },
  });

  // Mutación para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      if (!response.ok) throw new Error('Error al marcar todas como leídas');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
      updateUnreadCount();
    },
  });

  // Mutación para eliminar notificación
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar notificación');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
      updateUnreadCount();
    },
  });

  // Mutación para actualizar preferencias
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: NotificationPreferences) => {
      const response = await fetch(`/api/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, preferences: newPreferences }),
      });
      if (!response.ok) throw new Error('Error al actualizar preferencias');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', organizationId] });
      setShowPreferences(false);
    },
  });

  // WebSocket para notificaciones en tiempo real
  useEffect(() => {
    if (!organizationId) return;

    const connectWebSocket = () => {
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? `ws://localhost:3001/notifications/${organizationId}`
        : `wss://${window.location.host}/notifications/${organizationId}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket conectado para notificaciones');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          handleNewNotification(notification);
        } catch (error) {
          console.error('Error procesando notificación:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket desconectado, reconectando...');
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Error en WebSocket:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [organizationId]);

  // Actualizar contador de no leídas
  const updateUnreadCount = () => {
    if (notifications) {
      const count = notifications.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(count);
    }
  };

  useEffect(() => {
    updateUnreadCount();
  }, [notifications]);

  // Manejar nueva notificación
  const handleNewNotification = (notification: Notification) => {
    // Agregar a la lista de notificaciones
    queryClient.setQueryData(['notifications', organizationId], (old: Notification[] = []) => {
      return [notification, ...old];
    });

    // Mostrar toast si las preferencias lo permiten
    if (preferences?.inApp) {
      showToast(notification);
    }

    // Actualizar contador
    setUnreadCount(prev => prev + 1);
  };

  // Mostrar toast de notificación
  const showToast = (notification: Notification) => {
    // Implementar toast personalizado o usar librería como react-hot-toast
    console.log('Nueva notificación:', notification);
  };

  // Obtener preferencias por defecto
  const getDefaultPreferences = (): NotificationPreferences => ({
    email: true,
    push: false,
    inApp: true,
    categories: {
      post: true,
      metrics: true,
      connection: true,
      system: false,
      engagement: true,
    },
    frequency: 'immediate',
  });

  // Filtrar notificaciones
  const filteredNotifications = notifications?.filter((notification: Notification) => {
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) {
      return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  // Obtener icono y colores del tipo de notificación
  const getNotificationStyle = (type: string) => {
    return NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || NOTIFICATION_TYPES.info;
  };

  // Obtener estilo de categoría
  const getCategoryStyle = (category: string) => {
    return CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.system;
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="h-8 w-8 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
              <p className="text-gray-600">Mantente informado sobre tu actividad</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </button>
            
            <button
              onClick={() => setShowPreferences(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferencias
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro de categorías */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {filteredNotifications.length} notificación{filteredNotifications.length !== 1 ? 'es' : ''}
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification: Notification) => {
              const typeStyle = getNotificationStyle(notification.type);
              const categoryStyle = getCategoryStyle(notification.category);
              const Icon = typeStyle.icon;

              return (
                <div
                  key={notification.id}
                  className={`p-6 transition-colors ${
                    notification.isRead ? 'bg-gray-50' : 'bg-white'
                  } hover:bg-gray-50`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icono del tipo */}
                    <div className={`p-2 rounded-lg ${typeStyle.bgColor}`}>
                      <Icon className={`h-5 w-5 ${typeStyle.color}`} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryStyle}`}>
                              {CATEGORIES[notification.category as keyof typeof CATEGORIES]?.label}
                            </span>
                          </div>
                          
                          <p className={`text-sm ${
                            notification.isRead ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>

                          {/* Metadatos */}
                          {notification.metadata && (
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              {notification.metadata.platform && (
                                <span>Plataforma: {notification.metadata.platform}</span>
                              )}
                              {notification.metadata.metricValue !== undefined && (
                                <span>
                                  Valor: {notification.metadata.metricValue.toLocaleString()}
                                  {notification.metadata.previousValue !== undefined && (
                                    <span className="ml-1">
                                      (antes: {notification.metadata.previousValue.toLocaleString()})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mt-3">
                            <span className="text-xs text-gray-400 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(notification.createdAt)}
                            </span>
                            
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Marcar como leída
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center space-x-2">
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Ver detalles"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          
                          <button
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay notificaciones
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No se encontraron notificaciones con los filtros aplicados.'
                  : 'Cuando tengas actividad, aparecerán notificaciones aquí.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de preferencias */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Preferencias de Notificaciones</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Canales de notificación */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Canales de Notificación</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences?.inApp || false}
                      onChange={(e) => {
                        if (preferences) {
                          updatePreferencesMutation.mutate({
                            ...preferences,
                            inApp: e.target.checked
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificaciones en la aplicación</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences?.email || false}
                      onChange={(e) => {
                        if (preferences) {
                          updatePreferencesMutation.mutate({
                            ...preferences,
                            email: e.target.checked
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificaciones por email</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences?.push || false}
                      onChange={(e) => {
                        if (preferences) {
                          updatePreferencesMutation.mutate({
                            ...preferences,
                            push: e.target.checked
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificaciones push del navegador</span>
                  </label>
                </div>
              </div>

              {/* Categorías */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Categorías de Notificación</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(CATEGORIES).map(([key, category]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences?.categories[key as keyof typeof preferences.categories] || false}
                        onChange={(e) => {
                          if (preferences) {
                            updatePreferencesMutation.mutate({
                              ...preferences,
                              categories: {
                                ...preferences.categories,
                                [key]: e.target.checked
                              }
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Frecuencia */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Frecuencia de Resúmenes</h4>
                <select
                  value={preferences?.frequency || 'immediate'}
                  onChange={(e) => {
                    if (preferences) {
                      updatePreferencesMutation.mutate({
                        ...preferences,
                        frequency: e.target.value as any
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="immediate">Inmediato</option>
                  <option value="hourly">Cada hora</option>
                  <option value="daily">Diario</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (preferences) {
                    updatePreferencesMutation.mutate(preferences);
                  }
                }}
                disabled={updatePreferencesMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updatePreferencesMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
