'use client';

import { useState, useRef } from 'react';
import { Upload, Play, Calendar, Globe, Lock, Send } from 'lucide-react';

interface TikTokVideoUploadProps {
  organizationId: string;
  onVideoUploaded?: (result: any) => void;
}

export default function TikTokVideoUpload({ organizationId, onVideoUploaded }: TikTokVideoUploadProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'private'>('public');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'publish'>('publish');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !caption.trim()) {
      alert('Por favor selecciona un video y escribe una descripción');
      return;
    }

    setIsUploading(true);

    try {
      const endpoint = uploadMode === 'upload' 
        ? '/api/tiktok/upload-video' 
        : '/api/tiktok/publish-video';

      const formData = new FormData();
      formData.append('videoFile', videoFile);
      formData.append('caption', caption);
      formData.append('privacyLevel', privacyLevel);
      formData.append('organizationId', organizationId);
      
      if (scheduledTime && uploadMode === 'publish') {
        formData.append('scheduledTime', scheduledTime);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        onVideoUploaded?.(result);
        // Reset form
        setVideoFile(null);
        setCaption('');
        setScheduledTime('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error al subir el video. Por favor, intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-r from-black to-gray-800">
          <div className="h-6 w-6 bg-black rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">T</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Subir Video a TikTok</h3>
          <p className="text-sm text-gray-500">Comparte contenido en tu cuenta de TikTok</p>
        </div>
      </div>

      {/* Modo de subida */}
      <div className="mb-6">
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setUploadMode('upload')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              uploadMode === 'upload'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Subir como Borrador
          </button>
          <button
            onClick={() => setUploadMode('publish')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              uploadMode === 'publish'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="h-4 w-4 inline mr-2" />
            Publicar Directamente
          </button>
        </div>
      </div>

      {/* Selección de archivo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Video
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar Video
          </button>
          {videoFile && (
            <div className="mt-3 text-sm text-gray-600">
              <Play className="h-4 w-4 inline mr-1" />
              {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="Describe tu video..."
          maxLength={2200}
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {caption.length}/2200 caracteres
        </div>
      </div>

      {/* Configuraciones adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Nivel de privacidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Privacidad
          </label>
          <select
            value={privacyLevel}
            onChange={(e) => setPrivacyLevel(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="public">
              <Globe className="h-4 w-4 inline mr-2" />
              Público
            </option>
            <option value="friends">
              <Lock className="h-4 w-4 inline mr-2" />
              Solo Amigos
            </option>
            <option value="private">
              <Lock className="h-4 w-4 inline mr-2" />
              Privado
            </option>
          </select>
        </div>

        {/* Programación (solo para publicación directa) */}
        {uploadMode === 'publish' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programar Publicación
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <div className="text-xs text-gray-500 mt-1">
              Deja vacío para publicar inmediatamente
            </div>
          </div>
        )}
      </div>

      {/* Botón de subida */}
      <button
        onClick={handleUpload}
        disabled={!videoFile || !caption.trim() || isUploading}
        className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
          !videoFile || !caption.trim() || isUploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {isUploading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {uploadMode === 'upload' ? 'Subiendo...' : 'Publicando...'}
          </div>
        ) : (
          <>
            {uploadMode === 'upload' ? (
              <>
                <Upload className="h-4 w-4 inline mr-2" />
                Subir como Borrador
              </>
            ) : (
              <>
                <Send className="h-4 w-4 inline mr-2" />
                Publicar en TikTok
              </>
            )}
          </>
        )}
      </button>

      {/* Información adicional */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Información:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Subir como Borrador:</strong> El video se guarda en TikTok para editar después</li>
          <li>• <strong>Publicar Directamente:</strong> El video se publica inmediatamente en tu perfil</li>
          <li>• <strong>Programación:</strong> Puedes programar la publicación para una fecha específica</li>
          <li>• <strong>Formato:</strong> MP4, MOV, AVI (máximo 4GB)</li>
        </ul>
      </div>
    </div>
  );
}
