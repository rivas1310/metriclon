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
  Share2,
  TrendingUp,
  Calendar,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FacebookAnalyticsProps {
  organizationId: string;
  days?: number;
}

interface FacebookData {
  accountInfo: {
    id: string;
    name: string;
    followers_count: number;
    fan_count: number;
    talking_about_count: number;
    impressions?: number;
    reach?: number;
    engaged_users?: number;
    page_views?: number;
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
    message?: string;
    created_time: string;
    impressions?: number;
    reach?: number;
    reactions?: any;
    comments?: number;
    shares?: number;
  }>;
  dateRange: {
    since: string;
    until: string;
  };
}

export function FacebookAnalytics({ organizationId, days = 30 }: FacebookAnalyticsProps) {
  const [data, setData] = useState<FacebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacebookData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/metrics?organizationId=${organizationId}&platform=facebook&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener datos de Facebook');
      }

      const result = await response.json();
      
      if (result.data.platforms.length === 0) {
        setError('No hay cuentas de Facebook conectadas');
        return;
      }

      // Tomar la primera cuenta de Facebook encontrada
      const facebookPlatform = result.data.platforms.find((p: any) => p.platform === 'FACEBOOK');
      
      if (!facebookPlatform) {
        setError('No se encontraron datos de Facebook');
        return;
      }

      setData({
        accountInfo: facebookPlatform.accountInfo,
        insights: facebookPlatform.insights,
        recentPosts: facebookPlatform.recentPosts,
        dateRange: facebookPlatform.dateRange,
      });

    } catch (err) {
      console.error('Error fetching Facebook data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacebookData();
  }, [organizationId, days]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando métricas de Facebook...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error en Facebook</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFacebookData}
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
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
    date: format(new Date(post.created_time), 'dd/MM'),
    impressions: post.impressions || 0,
    reach: post.reach || 0,
    engagement: (post.reactions?.like || 0) + (post.comments || 0) + (post.shares || 0),
  }));

  // Debug: Mostrar estructura de datos de reacciones
  console.log('🔍 Debug - Estructura de posts y reacciones:', data.recentPosts.map(post => ({
    id: post.id,
    message: post.message?.substring(0, 50),
    reactions: post.reactions,
    comments: post.comments,
    shares: post.shares
  })));

  // Preparar datos de engagement detallado
  const engagementTypes = [
    { name: '❤️ Me Gusta', value: data.recentPosts.reduce((sum, post) => {
      const reactions = post.reactions || {};
      console.log(`🔍 Post ${post.id} reactions:`, reactions);
      return sum + (reactions.like || reactions.LIKE || 0);
    }, 0), color: '#EF4444' },
    { name: '😍 Love', value: data.recentPosts.reduce((sum, post) => {
      const reactions = post.reactions || {};
      return sum + (reactions.love || reactions.LOVE || 0);
    }, 0), color: '#EC4899' },
    { name: '😮 Wow', value: data.recentPosts.reduce((sum, post) => {
      const reactions = post.reactions || {};
      return sum + (reactions.wow || reactions.WOW || 0);
    }, 0), color: '#8B5CF6' },
    { name: '😂 Haha', value: data.recentPosts.reduce((sum, post) => {
      const reactions = post.reactions || {};
      return sum + (reactions.haha || reactions.HAHA || 0);
    }, 0), color: '#F59E0B' },
    { name: '😢 Sad', value: data.recentPosts.reduce((sum, post) => {
      const reactions = post.reactions || {};
      return sum + (reactions.sad || reactions.SAD || 0);
    }, 0), color: '#3B82F6' },
    { name: '😠 Angry', value: data.recentPosts.reduce((sum, post) => {
      const reactions = post.reactions || {};
      return sum + (reactions.angry || reactions.ANGRY || 0);
    }, 0), color: '#DC2626' },
    { name: '💬 Comentarios', value: data.recentPosts.reduce((sum, post) => sum + (post.comments || 0), 0), color: '#10B981' },
    { name: '📤 Compartidas', value: data.recentPosts.reduce((sum, post) => sum + (post.shares || 0), 0), color: '#6366F1' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
                      <div>
            <h2 className="text-2xl font-bold text-gray-900">Facebook Analytics</h2>
            <p className="text-gray-600">{data.accountInfo.name}</p>
            {(data.accountInfo as any).category && (
              <p className="text-sm text-gray-500">{(data.accountInfo as any).category}</p>
            )}
          </div>
          </div>
          <button
            onClick={fetchFacebookData}
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {data.accountInfo.followers_count > 0 ? 'Seguidores' : 'Amigos'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(data.accountInfo.followers_count || data.accountInfo.fan_count || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {data.accountInfo.followers_count > 0 ? 'Página de Facebook' : 'Perfil personal'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contenido Encontrado</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.insights.postCount}
              </p>
              <p className="text-xs text-gray-500">Posts, fotos, videos</p>
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
                {data.insights.totalEngagement.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Reacciones + comentarios + shares</p>
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
              <p className="text-xs text-gray-500">Engagement / seguidores</p>
            </div>
          </div>
        </div>

        {/* Total de Me Gusta */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Me Gusta</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.recentPosts.reduce((sum, post) => {
                  const reactions = post.reactions || {};
                  return sum + (reactions.like || reactions.LIKE || 0);
                }, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">❤️ Reacciones de amor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional del perfil */}
      {((data.accountInfo as any).location || (data.accountInfo as any).work || (data.accountInfo as any).education) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(data.accountInfo as any).location && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ubicación</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(data.accountInfo as any).location}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(data.accountInfo as any).work && Array.isArray((data.accountInfo as any).work) && (data.accountInfo as any).work.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trabajo</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(data.accountInfo as any).work[0]?.employer?.name || 'Disponible'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(data.accountInfo as any).website && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Website</p>
                  <a 
                    href={(data.accountInfo as any).website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-blue-600 hover:text-blue-800"
                  >
                    Ver sitio
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Información sobre limitaciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-900">Perfil Personal de Facebook Conectado</h3>
            <div className="mt-2 text-sm text-blue-800">
              <p className="mb-2">
                <strong>Tu perfil personal está conectado exitosamente.</strong> Sin embargo, los perfiles personales de Facebook tienen limitaciones en cuanto a métricas comerciales:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>No tienen métricas de seguidores (solo amigos)</li>
                <li>No proporcionan insights de engagement</li>
                <li>No tienen acceso a métricas de alcance e impresiones</li>
                <li>Acceso limitado a contenido público</li>
              </ul>
              <p className="mt-3 font-medium">
                ✅ <strong>Lo que SÍ puedes ver:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                <li>Información básica del perfil (nombre, ubicación, trabajo)</li>
                <li>Conteo de amigos (como equivalente a seguidores)</li>
                <li>Posts del feed personal</li>
                <li>Fotos subidas</li>
                <li>Videos compartidos</li>
                <li>Estado de verificación del perfil</li>
                <li>Información de contacto y sitio web</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

             {/* Panel de Debug de Reacciones */}
       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
         <h3 className="text-lg font-medium text-yellow-900 mb-4">🔍 Debug - Datos de Reacciones</h3>
         <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <h4 className="font-medium text-yellow-800">Posts Encontrados:</h4>
               <p className="text-sm text-yellow-700">{data.recentPosts.length} posts</p>
             </div>
             <div>
               <h4 className="font-medium text-yellow-800">Posts con Reacciones:</h4>
               <p className="text-sm text-yellow-700">
                 {data.recentPosts.filter(post => post.reactions && Object.keys(post.reactions).length > 0).length} posts
               </p>
             </div>
           </div>
           
           <div>
             <h4 className="font-medium text-yellow-800 mb-2">Estructura de Reacciones por Post:</h4>
             <div className="space-y-2">
               {data.recentPosts.slice(0, 3).map((post, index) => (
                 <div key={post.id} className="p-3 bg-white rounded border text-xs">
                   <div className="font-medium">Post {index + 1} (ID: {post.id.slice(-8)})</div>
                   <div className="text-gray-600">
                     <div>Reactions: {JSON.stringify(post.reactions)}</div>
                     <div>Comments: {post.comments}</div>
                     <div>Shares: {post.shares}</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Botones de Debug */}
           <div className="pt-4 border-t border-yellow-200 space-y-3">
             <button
               onClick={async () => {
                 try {
                   // Mostrar detalles completos del token
                   const detailsResponse = await fetch('/api/debug/facebook-token-details');
                   
                   if (detailsResponse.ok) {
                     const detailsData = await detailsResponse.json();
                     console.log('🔍 Detalles completos del token:', detailsData);
                     
                     // Mostrar resultado en un alert temporal
                     let message = `🔍 Detalles del Token:\n\n`;
                     message += `Canal: ${detailsData.channel.id}\n`;
                     message += `Nombre: ${detailsData.channel.name || 'Sin nombre'}\n`;
                     message += `Longitud: ${detailsData.channel.accessTokenLength} caracteres\n`;
                     message += `Inicio: ${detailsData.channel.accessTokenPreview}\n`;
                     message += `Final: ${detailsData.channel.accessTokenEnd}\n\n`;
                     
                     message += `📊 Análisis:\n`;
                     message += `¿Es token real? ${detailsData.analysis.isRealToken ? '✅ SÍ' : '❌ NO'}\n`;
                     message += `Contiene 'ejemplo'? ${detailsData.analysis.containsExample ? '❌ SÍ' : '✅ NO'}\n`;
                     message += `Contiene 'placeholder'? ${detailsData.analysis.containsPlaceholder ? '❌ SÍ' : '✅ NO'}\n\n`;
                     
                     message += `💡 Recomendación:\n`;
                     message += detailsData.analysis.recommendation;
                     
                     alert(message);
                   } else {
                     const error = await detailsResponse.json();
                     alert(`❌ Error al obtener detalles: ${error.error}`);
                   }
                 } catch (error) {
                   console.error('Error al obtener detalles:', error);
                   alert('Error al obtener detalles. Revisa la consola.');
                 }
               }}
               className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm w-full"
             >
               🔍 Ver Detalles del Token
             </button>
             
             <button
               onClick={async () => {
                 try {
                   // Verificar token primero
                   const tokenResponse = await fetch('/api/debug/facebook-token');
                   
                   if (tokenResponse.ok) {
                     const tokenData = await tokenResponse.json();
                     console.log('🔍 Verificación de token:', tokenData);
                     
                     // Mostrar resultado en un alert temporal
                     let message = `🔍 Verificación de Token:\n\n`;
                     message += `Canal: ${tokenData.channel.id}\n`;
                     message += `Token: ${tokenData.channel.tokenPreview}\n\n`;
                     
                     if (tokenData.testResults.basicToken?.success) {
                       message += `✅ Token básico: FUNCIONA\n`;
                     } else {
                       message += `❌ Token básico: FALLA\n`;
                     }
                     
                     if (tokenData.testResults.permissions?.success) {
                       message += `✅ Permisos: FUNCIONA\n`;
                     } else {
                       message += `❌ Permisos: FALLA\n`;
                     }
                     
                     if (tokenData.testResults.pages?.success) {
                       message += `✅ Páginas: FUNCIONA\n`;
                     } else {
                       message += `❌ Páginas: FALLA\n`;
                     }
                     
                     alert(message);
                   } else {
                     const error = await tokenResponse.json();
                     alert(`❌ Error al verificar token: ${error.error}`);
                   }
                 } catch (error) {
                   console.error('Error al verificar token:', error);
                   alert('Error al verificar el token. Revisa la consola.');
                 }
               }}
               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-full"
             >
               🔍 Verificar Token de Facebook
             </button>
             
             <button
               onClick={async () => {
                 try {
                   // Hacer la llamada al endpoint simple
                   const response = await fetch('/api/debug/facebook-simple');

                   if (response.ok) {
                     const data = await response.json();
                     console.log('🔍 Resultado de la prueba de API:', data);
                     
                     // Mostrar resultado en un alert temporal
                     alert(`✅ API funcionando!\n\nPágina: ${data.page.name}\n\nRevisa la consola para detalles completos.`);
                   } else {
                     const error = await response.json();
                     alert(`❌ Error: ${error.error}`);
                   }
                 } catch (error) {
                   console.error('Error al probar API:', error);
                   alert('Error al probar la API. Revisa la consola.');
                 }
               }}
               className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm w-full"
             >
               🔍 Probar API de Reacciones
             </button>
             
             <button
               onClick={async () => {
                 try {
                   // Confirmar antes de resetear
                   const confirmReset = confirm(
                     '⚠️ ¿Estás seguro de que quieres resetear el canal de Facebook?\n\n' +
                     'Esto eliminará el token actual y tendrás que reconectarlo.\n\n' +
                     '¿Continuar?'
                   );
                   
                   if (!confirmReset) return;
                   
                   // Resetear el canal
                   const resetResponse = await fetch('/api/debug/facebook-reset', {
                     method: 'POST'
                   });

                   if (resetResponse.ok) {
                     const resetData = await resetResponse.json();
                     console.log('🔧 Canal reseteado:', resetData);
                     
                     // Mostrar pasos siguientes
                     let message = `✅ ${resetData.message}\n\n`;
                     message += `📋 Pasos siguientes:\n\n`;
                     resetData.nextSteps.forEach(step => {
                       message += `${step}\n`;
                     });
                     
                     alert(message);
                     
                     // Refrescar la página para mostrar el estado actualizado
                     setTimeout(() => {
                       window.location.reload();
                     }, 2000);
                   } else {
                     const error = await resetResponse.json();
                     alert(`❌ Error al resetear: ${error.error}`);
                   }
                 } catch (error) {
                   console.error('Error al resetear canal:', error);
                   alert('Error al resetear el canal. Revisa la consola.');
                 }
               }}
               className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm w-full"
             >
               🔧 Resetear Canal de Facebook
             </button>
             
             <p className="text-xs text-yellow-700 text-center">
               Primero verifica el token, luego prueba la API
             </p>
           </div>
         </div>
       </div>

       {/* Gráficos (si hay datos) */}
       {data.insights.postCount > 0 && (
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
              <Line type="monotone" dataKey="impressions" stroke="#3B82F6" name="Impresiones" />
              <Line type="monotone" dataKey="reach" stroke="#10B981" name="Alcance" />
              <Line type="monotone" dataKey="engagement" stroke="#8B5CF6" name="Engagement" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de engagement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Engagement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engagementTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {engagementTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        </div>
      )}

      {/* Contenido reciente */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Contenido Reciente</h3>
        {data.recentPosts.length > 0 ? (
          <div className="space-y-4">
            {data.recentPosts.slice(0, 10).map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.type === 'photo' ? 'bg-green-100 text-green-800' :
                        post.type === 'video' ? 'bg-red-100 text-red-800' :
                        post.type === 'link' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {post.type === 'photo' ? '📸' : 
                         post.type === 'video' ? '🎥' :
                         post.type === 'link' ? '🔗' : '📝'} {post.type}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(post.created_time), 'dd MMM yyyy HH:mm', { locale: es })}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-3">
                      {post.message || post.story || 'Contenido sin texto'}
                    </p>
                  </div>
                  {(post as any).link && (
                    <a 
                      href={(post as any).link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                
                                 {/* Métricas de Engagement Detalladas */}
                 {post.reactions && Object.keys(post.reactions).length > 0 && (
                   <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                     <h5 className="text-xs font-medium text-gray-700 mb-2">Reacciones Detalladas:</h5>
                     <div className="flex flex-wrap gap-2">
                       {Object.entries(post.reactions).map(([reactionType, count]) => {
                         if (count > 0) {
                           const reactionEmoji = {
                             like: '❤️',
                             LOVE: '😍',
                             love: '😍',
                             WOW: '😮',
                             wow: '😮',
                             HAHA: '😂',
                             haha: '😂',
                             SAD: '😢',
                             sad: '😢',
                             ANGRY: '😠',
                             angry: '😠',
                             THANKFUL: '🙏',
                             thankful: '🙏'
                           }[reactionType] || '👍';
                           
                           return (
                             <span key={reactionType} className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-full text-xs">
                               <span className="mr-1">{reactionEmoji}</span>
                               <span className="font-medium text-gray-700">{count}</span>
                               <span className="ml-1 text-gray-500 capitalize">{reactionType.toLowerCase()}</span>
                             </span>
                           );
                         }
                         return null;
                       })}
                     </div>
                   </div>
                 )}

                 {/* Métricas Adicionales */}
                 <div className="flex items-center justify-between mt-3">
                   <div className="flex items-center space-x-4 text-sm text-gray-600">
                     <span className="flex items-center space-x-1">
                       <span className="text-xs">ID:</span>
                       <span className="font-mono text-xs">{post.id.split('_')[1] || post.id.slice(-8)}</span>
                     </span>
                     {(post as any).picture && (
                       <span className="flex items-center space-x-1">
                         <span className="text-xs">📷 Imagen disponible</span>
                       </span>
                     )}
                   </div>
                   
                   {/* Métricas del Post */}
                   <div className="flex items-center space-x-3 text-xs text-gray-500">
                     {post.comments > 0 && (
                       <span className="flex items-center space-x-1">
                         <span>💬</span>
                         <span>{post.comments}</span>
                       </span>
                     )}
                     {post.shares > 0 && (
                       <span className="flex items-center space-x-1">
                         <span>📤</span>
                         <span>{post.shares}</span>
                       </span>
                     )}
                     {post.impressions > 0 && (
                       <span className="flex items-center space-x-1">
                         <span>👁️</span>
                         <span>{post.impressions.toLocaleString()}</span>
                       </span>
                     )}
                     {post.reach > 0 && (
                       <span className="flex items-center space-x-1">
                         <span>📊</span>
                         <span>{post.reach.toLocaleString()}</span>
                       </span>
                     )}
                   </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No se encontró contenido</h4>
            <p className="text-gray-600 mb-4">
              Esto puede deberse a la configuración de privacidad de tu perfil de Facebook.
            </p>
            <div className="text-sm text-gray-500">
              <p><strong>Posibles causas:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Posts configurados como privados</li>
                <li>Permisos de aplicación limitados</li>
                <li>Sin contenido público reciente</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
