'use client';

import { useState, useEffect } from 'react';
import { 
  Webhook, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface WebhookSetupProps {
  organizationId: string;
  channelId: string;
  channelName: string;
  platform: string;
}

interface WebhookStatus {
  channel: {
    id: string;
    name: string;
    platform: string;
    webhookConfigured: boolean;
    webhookCallbackUrl?: string;
  };
  pages: Array<{
    id: string;
    name: string;
    category: string;
    followers_count: number;
    webhookStatus: {
      isSubscribed: boolean;
      status: string;
    };
  }>;
}

export function WebhookSetup({ organizationId, channelId, channelName, platform }: WebhookSetupProps) {
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Configuración del webhook
  const [callbackUrl, setCallbackUrl] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  useEffect(() => {
    // Generar URL de callback automáticamente
    const baseUrl = window.location.origin;
    setCallbackUrl(`${baseUrl}/api/webhooks/facebook`);
    
    // Generar token de verificación
    setVerifyToken(`garras_felinas_${Date.now()}`);
    
    fetchWebhookStatus();
  }, [organizationId, channelId]);

  const fetchWebhookStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await fetch(
        `/api/webhooks/setup?organizationId=${organizationId}&channelId=${channelId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener estado del webhook');
      }

      const result = await response.json();
      setWebhookStatus(result.data);
    } catch (err) {
      console.error('Error fetching webhook status:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const setupWebhook = async () => {
    try {
      setSetupLoading(true);
      setError(null);
      setSuccess(null);

      if (!callbackUrl || !verifyToken) {
        setError('Por favor completa todos los campos');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await fetch('/api/webhooks/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationId,
          channelId,
          callbackUrl,
          verifyToken
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        fetchWebhookStatus(); // Actualizar estado
      } else {
        setError(result.message || 'Error configurando webhook');
      }
    } catch (err) {
      console.error('Error setting up webhook:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSetupLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Cargando estado del webhook...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Webhook className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Configuración de Webhook</h3>
            <p className="text-sm text-gray-600">
              Configura webhooks para recibir métricas en tiempo real de {channelName}
            </p>
          </div>
        </div>
      </div>

      {/* Estado Actual */}
      {webhookStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Estado Actual</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Canal:</span>
              <span className="text-sm text-gray-900">{webhookStatus.channel.name}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Webhook Configurado:</span>
              <div className="flex items-center space-x-2">
                {webhookStatus.channel.webhookConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`text-sm ${webhookStatus.channel.webhookConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {webhookStatus.channel.webhookConfigured ? 'Sí' : 'No'}
                </span>
              </div>
            </div>

            {webhookStatus.channel.webhookCallbackUrl && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">URL de Callback:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900 font-mono">
                    {webhookStatus.channel.webhookCallbackUrl}
                  </span>
                  <button
                    onClick={() => copyToClipboard(webhookStatus.channel.webhookCallbackUrl!)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Páginas */}
          <div className="mt-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Páginas Administradas:</h5>
            <div className="space-y-2">
              {webhookStatus.pages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{page.name}</span>
                      <span className="text-xs text-gray-500">({page.category})</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {page.followers_count?.toLocaleString() || 0} seguidores
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {page.webhookStatus.isSubscribed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs ${page.webhookStatus.isSubscribed ? 'text-green-600' : 'text-red-600'}`}>
                      {page.webhookStatus.isSubscribed ? 'Suscrito' : 'No suscrito'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuración */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Configurar Webhook</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de Callback
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://tudominio.com/api/webhooks/facebook"
              />
              <button
                onClick={() => copyToClipboard(callbackUrl)}
                className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Esta URL debe ser accesible públicamente para que Facebook pueda enviar webhooks
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token de Verificación
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Token de verificación"
              />
              <button
                onClick={() => copyToClipboard(verifyToken)}
                className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usa este token en la configuración de Facebook para verificar el webhook
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={setupWebhook}
              disabled={setupLoading || !callbackUrl || !verifyToken}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {setupLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              {setupLoading ? 'Configurando...' : 'Configurar Webhook'}
            </button>

            <button
              onClick={fetchWebhookStatus}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Instrucciones para Facebook */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-blue-900 mb-3">Instrucciones para Facebook:</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. Ve a tu app de Facebook → Webhooks</p>
          <p>2. Selecciona <strong>"Page"</strong> como producto</p>
          <p>3. Copia la URL de callback y el token de verificación de arriba</p>
          <p>4. Haz clic en "Verificar y guardar"</p>
          <p>5. Suscríbete a los campos: <strong>feed, insights, engagement, messages</strong></p>
        </div>
      </div>
    </div>
  );
}
